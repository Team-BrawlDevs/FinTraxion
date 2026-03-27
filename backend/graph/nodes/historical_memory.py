"""
historical_memory_agent — fetches past decision context to inform new recommendations.

Fetches simple KV memory context for the current run, specifically aggregating
information about the services being analyzed.
"""
from __future__ import annotations

from db.supabase_client import fetch_rows
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "historical_memory_agent"

class HistoricalMemoryAgent:
    """
    Agent responsible for fetching past approvals, rejections, or related 
    context for the services currently in the portfolio.
    Outputs a consolidated memory context to the state.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ HistoricalMemoryAgent started")

        services = [s.get("canonical_name") for s in state.get("normalized_services", []) if s.get("canonical_name")]
        
        historical_context = {
            "past_recommendations": [],
            "recent_failures": [],
            "notes": "No historical context found for current portfolio."
        }

        if not services:
            log.info("▶ HistoricalMemoryAgent complete — no services to look up")
            return {"historical_context": historical_context}

        # In a generic KV approach without complex FAISS, we might just query the database 
        # for past actions on these specific services, or use a mocked memory block.
        try:
            # Look up past recommendations for these services in Supabase 
            # (limiting to 10 most recent to keep prompt context clean)
            recent_recs = fetch_rows("recommendations", limit=20)
            
            relevant_recs = []
            for rec in recent_recs:
                action = (rec.get("action") or "").lower()
                target_service = (rec.get("target") or {}).get("service", "").lower()
                
                # If target service matches, or action string contains the service name
                if target_service and target_service in [s.lower() for s in services]:
                    relevant_recs.append(rec)
                elif any(s.lower() in action for s in services):
                    relevant_recs.append(rec)

            if relevant_recs:
                # Keep top 5 to avoid blowing up the prompt
                historical_context["past_recommendations"] = relevant_recs[:5]
                historical_context["notes"] = f"Found {len(relevant_recs)} related past actions."
                
        except Exception as e:
            log.warning(f"Failed to fetch historical context: {e}")
            historical_context["notes"] = f"Error fetching history: {e}"

        log.info(f"▶ HistoricalMemoryAgent complete — {len(historical_context['past_recommendations'])} past events found")
        return {"historical_context": historical_context}
