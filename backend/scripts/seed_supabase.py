"""
Seeder script — run once to bootstrap your Supabase project.

What it does:
  1. Generates transactions.csv (20 mock rows) and uploads to Storage
  2. Generates invoice.pdf (via fpdf2) and uploads to Storage
  3. Inserts 5 seed rows into the `services` table
"""
from __future__ import annotations

import io
import os
import sys

# Allow running from backend/ or repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from fpdf import FPDF

from config import SUPABASE_BUCKET
from db.supabase_client import upload_file, insert_row

# ── 1. transactions.csv ───────────────────────────────────────────────────────

def generate_csv() -> bytes:
    data = [
        {"date": "2026-04-01", "vendor": "AWS EMEA SARL", "amount": 4250.00, "currency": "USD"},
        {"date": "2026-04-01", "vendor": "Amazon Web Services", "amount": 150.00, "currency": "USD"},  # duplicate candidate
        {"date": "2026-04-02", "vendor": "Datadog, Inc.", "amount": 890.00, "currency": "USD"},
        {"date": "2026-04-02", "vendor": "New Relic", "amount": 450.00, "currency": "USD"}, # overlap with datadog
        {"date": "2026-04-03", "vendor": "Slack Technologies", "amount": 1200.00, "currency": "USD"},
        {"date": "2026-04-04", "vendor": "Microsoft Teams (M365)", "amount": 800.00, "currency": "USD"}, # overlap with slack
        {"date": "2026-04-05", "vendor": "Notion Labs Inc.", "amount": 450.00, "currency": "USD"},
        {"date": "2026-04-05", "vendor": "Atlassian Confluence", "amount": 320.00, "currency": "USD"}, # overlap with notion
        {"date": "2026-04-06", "vendor": "Salesforce.com", "amount": 5400.00, "currency": "USD"},
        {"date": "2026-04-07", "vendor": "HubSpot", "amount": 2100.00, "currency": "USD"}, # overlap with salesforce
        {"date": "2026-04-08", "vendor": "Figma Design", "amount": 600.00, "currency": "USD"},
        {"date": "2026-04-08", "vendor": "Miro Boards", "amount": 400.00, "currency": "USD"}, # overlap with figma
        {"date": "2026-04-09", "vendor": "Linear App", "amount": 250.00, "currency": "USD"},
        {"date": "2026-04-09", "vendor": "Jira Software", "amount": 650.00, "currency": "USD"}, # overlap with linear
        {"date": "2026-04-10", "vendor": "GitHub Enterprise", "amount": 850.00, "currency": "USD"},
        {"date": "2026-04-10", "vendor": "GitLab CI", "amount": 420.00, "currency": "USD"}, # overlap with github
        {"date": "2026-04-11", "vendor": "Stripe Payments", "amount": 120.00, "currency": "USD"},
        {"date": "2026-04-11", "vendor": "Auth0 (Okta)", "amount": 350.00, "currency": "USD"},
    ]
    df = pd.DataFrame(data)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


# ── 2. invoice.pdf ────────────────────────────────────────────────────────────

def generate_pdf() -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 12, "Slack Technologies Inc.", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, "Invoice #SL-20250301", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.cell(0, 8, "Date: 2025-03-01", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(10)

    # Table header
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(90, 9, "Description", border=1, fill=True)
    pdf.cell(50, 9, "Qty", border=1, fill=True)
    pdf.cell(50, 9, "Amount (USD)", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 11)
    rows = [
        ("Slack Pro Plan (200 seats)", "200", "$1,450.00"),
        ("Slack Connect Add-on", "1", "$99.00"),
    ]
    for desc, qty, amt in rows:
        pdf.cell(90, 8, desc, border=1)
        pdf.cell(50, 8, qty, border=1)
        pdf.cell(50, 8, amt, border=1, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(140, 9, "Total Due", border=0)
    pdf.cell(50, 9, "$1,549.00", border=1, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 8, "Thank you for your business!", new_x="LMARGIN", new_y="NEXT", align="C")

    return bytes(pdf.output())


# ── 3. Seed services table ────────────────────────────────────────────────────

SERVICE_SEEDS = [
    {"name": "Slack", "category": "Communication"},
    {"name": "Zoom", "category": "Communication"},
    {"name": "Notion", "category": "Productivity"},
    {"name": "GitHub", "category": "Developer Tools"},
    {"name": "Salesforce", "category": "CRM"},
]


def seed_services():
    for svc in SERVICE_SEEDS:
        try:
            insert_row("services", svc)
        except Exception as exc:
            print(f"  ⚠  Skipped {svc['name']}: {exc}")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🌱 Seeding Supabase...")

    # CSV
    csv_bytes = generate_csv()
    upload_file(SUPABASE_BUCKET, "transactions.csv", csv_bytes, "text/csv")
    print("✅ Uploaded transactions.csv")

    # PDF
    pdf_bytes = generate_pdf()
    upload_file(SUPABASE_BUCKET, "invoice.pdf", pdf_bytes, "application/pdf")
    print("✅ Uploaded invoice.pdf")

    # Services table
    print("📋 Seeding services table...")
    seed_services()
    print("✅ Seeded services table")

    print("\n🎉 Done! Your Supabase project is ready.")
    print("   Next: uvicorn main:app --reload --port 8000")
