"""
enrichment_node — adds mock usage metrics and pricing to normalized services.
Uses pandas for transformation.
"""
from __future__ import annotations

import random

import pandas as pd

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "enrichment_node"

# Mock pricing catalogue ($/month per seat)
MOCK_PRICING: dict[str, float] = {
    "Slack": 7.25, "Microsoft Teams": 6.00, "Zoom": 14.99, "Google Meet": 0.0,
    "Notion": 10.00, "Confluence": 5.75, "Jira": 8.15, "Asana": 10.99,
    "Monday.com": 9.00, "Linear": 8.00, "GitHub": 4.00, "GitLab": 19.00,
    "Figma": 12.00, "Miro": 10.00, "Loom": 12.50, "Salesforce": 75.00,
    "HubSpot": 50.00, "Intercom": 39.00, "Zendesk": 55.00, "Stripe": 0.0,
    "AWS": 0.0, "GCP": 0.0, "Azure": 0.0, "Datadog": 15.00,
    "PagerDuty": 21.00, "Dropbox": 9.99, "Box": 10.00,
    "Google Workspace": 12.00, "Microsoft 365": 6.00,
}

CATEGORIES: dict[str, str] = {
    "Slack": "Communication", "Microsoft Teams": "Communication",
    "Zoom": "Communication", "Google Meet": "Communication",
    "Notion": "Productivity", "Confluence": "Productivity",
    "Jira": "Project Management", "Asana": "Project Management",
    "Monday.com": "Project Management", "Linear": "Project Management",
    "GitHub": "Developer Tools", "GitLab": "Developer Tools",
    "Figma": "Design", "Miro": "Design",
    "Loom": "Communication", "Salesforce": "CRM",
    "HubSpot": "CRM", "Intercom": "Support", "Zendesk": "Support",
    "Stripe": "Payments", "AWS": "Infrastructure", "GCP": "Infrastructure",
    "Azure": "Infrastructure", "Datadog": "Observability",
    "PagerDuty": "Observability", "Dropbox": "Storage",
    "Box": "Storage", "Google Workspace": "Productivity",
    "Microsoft 365": "Productivity",
}


def enrichment_node(state: AgentState) -> dict:
    log = get_logger(LOGGER_NAME, state["run_id"])
    log.info("▶ enrichment_node started")

    records = state["normalized_services"]
    if not records:
        log.warning("No normalized services to enrich")
        return {"usage_data": []}

    df = pd.DataFrame(records)

    # Add mock usage + pricing columns
    df["seat_count"] = df["canonical_name"].apply(
        lambda n: random.randint(5, 200)
    )
    df["last_used_days_ago"] = df["canonical_name"].apply(
        lambda n: random.randint(0, 90)
    )
    df["price_per_seat"] = df["canonical_name"].map(MOCK_PRICING).fillna(
        df["amount"] if "amount" in df.columns else 0
    )
    df["monthly_cost"] = (df["price_per_seat"] * df["seat_count"]).round(2)
    df["category"] = df["canonical_name"].map(CATEGORIES).fillna("Other")
    df["utilisation_score"] = df["last_used_days_ago"].apply(
        lambda d: max(0.0, round(1.0 - d / 90.0, 2))
    )

    usage_data = df.to_dict(orient="records")
    log.info(f"▶ enrichment_node complete — {len(usage_data)} enriched records")
    return {"usage_data": usage_data}
