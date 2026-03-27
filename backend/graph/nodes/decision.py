"""
decision_agent — uses the strong Gemini model to evaluate rich shared context
and generate structured optimization recommendations.

Output per recommendation:
  {
    "action": str,
    "action_type": str,
    "target": dict,
    "params": dict,
    "confidence": float,
    "risk": "low" | "medium" | "high",
    "savings": float,
    "justification": str
  }

Results are persisted to Supabase `recommendations` table.
"""
from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage

from db.supabase_client import insert_row
from graph.state import AgentState
from services.llm_router import strong_llm
from utils.logging_utils import get_logger

LOGGER_NAME = "decision_agent"

SYSTEM_PROMPT = """You are a SaaS cost optimization expert. Analyze the provided data about
duplicate or overlapping SaaS subscriptions and return a JSON array of recommendations.

You have access to a rich Shared Context, including:
1. Current Usage & Spend (usage_data)
2. Semantic Duplicates (duplicate_candidates)
3. Past Decisions & Context (historical_context)
4. Advanced Mocks (simulation_results, graph_context)

Each recommendation MUST be a JSON object with EXACTLY these fields:
- action: string describing the specific action to take
- action_type: one of "scale_down_instance", "stop_idle_resource", "reduce_api_rate", "switch_pricing_tier", "alert_admin"
- target: object describing what to change, e.g. {"service":"Slack"} or {"provider":"aws","resource_id":"i-123"}
- params: object with action parameters, e.g. {"target_tier":"lower_tier"}
- confidence: float between 0.0 and 1.0 (penalize if lacking historical context or high risk)
- risk: one of "low", "medium", or "high"
- savings: estimated monthly savings in USD (float)
- justification: 1-2 sentence explanation citing the usage data or historical context

Return ONLY a valid JSON array, no markdown, no explanation outside the JSON."""


def _extract_json_payload(raw: str) -> str:
    """Best-effort cleanup to extract a JSON payload from LLM text."""
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.startswith("json"):
                text = text[4:]
    return text.strip()


def _rule_based_recommendations(state: AgentState) -> list[dict]:
    """
    Deterministic fallback when LLM is unavailable.
    Generates actionable recommendations from top duplicate candidates.
    """
    recommendations: list[dict] = []
    candidates = state.get("duplicate_candidates", [])

    for candidate in candidates[:5]:
        ctype = candidate.get("type", "overlap")
        service_a = candidate.get("service_a", "Unknown A")
        service_b = candidate.get("service_b", "Unknown B")
        cost_a = float(candidate.get("monthly_cost_a", 0) or 0)
        cost_b = float(candidate.get("monthly_cost_b", 0) or 0)
        savings = round(min(cost_a, cost_b), 2)

        if ctype == "exact_duplicate":
            action = f"Cancel duplicate {service_b} subscription and retain the primary instance"
            action_type = "switch_pricing_tier"
            target = {"service": service_b}
            params = {"target_tier": "lower_tier_or_cancel_duplicate"}
            risk = "low"
            confidence = 0.85
        else:
            action = f"Consolidate overlapping tools: {service_a} and {service_b} after owner validation"
            action_type = "alert_admin"
            target = {"service_a": service_a, "service_b": service_b}
            params = {
                "channel": "email",
                "message": f"Review consolidation for {service_a} and {service_b}",
            }
            risk = "medium"
            confidence = 0.65

        recommendations.append({
            "action": action,
            "action_type": action_type,
            "target": target,
            "params": params,
            "confidence": confidence,
            "risk": risk,
            "savings": savings,
            "justification": (
                f"Auto-generated fallback recommendation from {ctype} detection; "
                f"estimated monthly savings based on the lower duplicate/overlap cost."
            ),
            "run_id": state["run_id"],
            "status": "pending",
        })

    return recommendations


def _infer_action_type(action: str) -> str:
    """Infer action type for partially structured LLM outputs."""
    text = (action or "").lower()
    if "scale down" in text or "rightsize" in text:
        return "scale_down_instance"
    if "stop idle" in text or "stop unused" in text:
        return "stop_idle_resource"
    if "api rate" in text or "rate limit" in text:
        return "reduce_api_rate"
    if "switch pricing tier" in text or "downgrade" in text or "cancel duplicate" in text:
        return "switch_pricing_tier"
    return "alert_admin"


def _normalize_recommendation(state: AgentState, rec: dict) -> dict:
    """Ensure all required recommendation fields exist and are well-formed."""
    action = rec.get("action", "Manual review required")
    action_type = rec.get("action_type") or _infer_action_type(action)
    target = rec.get("target")
    if not isinstance(target, dict):
        target = {"service": "unknown"}
    params = rec.get("params")
    if not isinstance(params, dict):
        params = {}

    return {
        "action": action,
        "action_type": action_type,
        "target": target,
        "params": params,
        "confidence": float(rec.get("confidence", 0.7)),
        "risk": rec.get("risk", "medium"),
        "savings": float(rec.get("savings", 0.0)),
        "justification": rec.get("justification", "Automated optimization recommendation."),
        "run_id": state["run_id"],
        "status": "pending",
    }


def _persist_recommendations(run_id: str, recommendations: list[dict], log) -> None:
    """Persist recommendations to Supabase recommendations table."""
    for rec in recommendations:
        try:
            insert_row("recommendations", {
                "run_id": run_id,
                "action": rec.get("action", ""),
                "risk": rec.get("risk", "medium"),
                "confidence": rec.get("confidence", 0.7),
                "savings": rec.get("savings", 0.0),
                "justification": rec.get("justification", ""),
                "status": rec.get("status", "pending"),
            })
        except Exception as db_exc:
            log.warning(f"Failed to persist recommendation to Supabase: {db_exc}")


class DecisionAgent:
    """
    Agent responsible for evaluating shared context gathered by previous agents
    and emitting structured optimization recommendations.
    Uses LLM for complex reasoning, falls back to deterministic rules on failure.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ DecisionAgent started (strong model)")

        duplicates = state.get("duplicate_candidates", [])
        usage_data = state.get("usage_data", [])
        historical_context = state.get("historical_context", {})

        if not duplicates:
            log.info("No duplicate candidates — generating general recommendations")

        # Explicitly build shared context for LLM
        context = {
            "duplicate_candidates": duplicates[:10],  # top 10 to stay within token budget
            "services_summary": [
                {
                    "name": s.get("canonical_name"),
                    "monthly_cost": s.get("monthly_cost"),
                    "seat_count": s.get("seat_count"),
                    "last_used_days_ago": s.get("last_used_days_ago"),
                    "category": s.get("category"),
                    "utilisation_score": s.get("utilisation_score"),
                }
                for s in usage_data[:15]
            ],
            "historical_context": historical_context,
            "simulation_results": state.get("simulation_results", []),
            "graph_context": state.get("graph_context", {})
        }

        prompt = f"""Analyze the following rich SaaS portfolio context and provide recommendations:

{json.dumps(context, indent=2)}

Return a JSON array of 3-5 recommendations.
Each item must include: action, action_type, target, params, confidence, risk, savings, justification."""

        recommendations: list[dict] = []

        try:
            llm = strong_llm()
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
            response = llm.invoke(messages)
            raw = response.content if isinstance(response.content, str) else json.dumps(response.content)
            raw = _extract_json_payload(raw)

            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                parsed = [parsed]

            seen_keys = set()
            for rec in parsed:
                norm_rec = _normalize_recommendation(state, rec)
                
                # Check system for unique recommendations
                target_str = str(norm_rec.get("target", {}))
                action_type = norm_rec.get("action_type", "")
                action_str = norm_rec.get("action", "").lower().strip()
                
                # Create a robust unique key based on action type and target
                dedup_key = f"{action_type}_{target_str}"
                # Additional check for literal exact same action texts
                action_key = f"action_{action_str}"
                
                if dedup_key not in seen_keys and action_key not in seen_keys:
                    seen_keys.add(dedup_key)
                    seen_keys.add(action_key)
                    recommendations.append(norm_rec)

            log.info(f"▶ DecisionAgent complete — {len(recommendations)} unique recommendations generated")

        except json.JSONDecodeError as exc:
            log.error(f"Failed to parse LLM JSON output: {exc}")
            recommendations = _rule_based_recommendations(state)
            if not recommendations:
                recommendations = [{
                    "action": "Manual review required — LLM output parsing failed",
                    "action_type": "alert_admin",
                    "target": {"service": "unknown"},
                    "params": {"channel": "email", "message": "LLM output parsing failed"},
                    "confidence": 0.3,
                    "risk": "low",
                    "savings": 0.0,
                    "justification": "Automated analysis incomplete. Please review portfolio manually.",
                    "run_id": state["run_id"],
                    "status": "pending",
                }]
            log.info(f"Fallback recommendations generated: {len(recommendations)}")
        except Exception as exc:
            log.error(f"DecisionAgent LLM call failed: {exc}")
            recommendations = _rule_based_recommendations(state)
            if recommendations:
                log.info(f"Fallback recommendations generated after LLM failure: {len(recommendations)}")

        if recommendations:
            _persist_recommendations(state["run_id"], recommendations, log)

        return {"recommendations": recommendations}
