"""
digital_twin_agent — builds a structured, immutable model of the SaaS portfolio.
Creates the baseline state for the predictive simulation engine.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "digital_twin_agent"

class DigitalTwinAgent:
    """
    Agent responsible for synthesizing raw usage, pricing, and normalization metrics
    into a cohesive, mathematically rigorous 'Digital Twin' of the current infrastructure.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ DigitalTwinAgent started")

        usage_data = state.get("usage_data", [])
        
        # Build the baseline snapshot
        services_map = {}
        total_baseline_cost = 0.0
        total_seats = 0
        
        for u in usage_data:
            name = u.get("canonical_name", "Unknown")
            cost = float(u.get("monthly_cost", 0.0))
            seats = int(u.get("seat_count", 0))
            
            services_map[name] = {
                "category": u.get("category", "Other"),
                "seats": seats,
                "price_per_seat": float(u.get("price_per_seat", 0.0)),
                "monthly_cost": cost,
                "utilisation_score": float(u.get("utilisation_score", 1.0)),
                "last_used_days_ago": int(u.get("last_used_days_ago", 0))
            }
            
            total_baseline_cost += cost
            total_seats += seats

        digital_twin = {
            "services": services_map,
            "metrics": {
                "total_monthly_baseline": total_baseline_cost,
                "total_active_seats": total_seats,
                "service_count": len(services_map)
            }
        }

        log.info(f"▶ DigitalTwinAgent complete — baseline cost: ${total_baseline_cost:,.2f} across {len(services_map)} services.")
        
        return {"digital_twin": digital_twin}
