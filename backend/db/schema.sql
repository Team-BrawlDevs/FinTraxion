-- ============================================================
-- Autonomous SaaS Optimization System — Supabase Schema
-- Run this in your Supabase SQL Editor before starting the app
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. services: registered SaaS tools
create table if not exists public.services (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    category    text,
    created_at  timestamptz default now()
);

-- 2. recommendations: LLM-generated optimization actions
create table if not exists public.recommendations (
    id            uuid primary key default gen_random_uuid(),
    run_id        text,
    action        text not null,
    risk          text check (risk in ('low', 'medium', 'high')),
    confidence    numeric(4,3),
    savings       numeric(12,2),
    justification text,
    status        text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at    timestamptz default now()
);

-- 3. actions_log: execution outcomes per run
create table if not exists public.actions_log (
    id          uuid primary key default gen_random_uuid(),
    run_id      text,
    action      text not null,
    status      text check (status in ('success', 'failed', 'retried', 'escalated')),
    details     jsonb,
    created_at  timestamptz default now()
);

-- 4. memory: long-term key/value store for agent decisions
create table if not exists public.memory (
    id          uuid primary key default gen_random_uuid(),
    key         text unique not null,
    value       jsonb,
    updated_at  timestamptz default now()
);

-- 5. impact_metrics: Quantifiable Impact Engine aggregates per run
create table if not exists public.impact_metrics (
    id              uuid primary key default gen_random_uuid(),
    run_id          text not null,
    before_cost     numeric(14,2),
    after_cost      numeric(14,2),
    savings         numeric(14,2),
    roi             numeric(20,6),
    efficiency_gain numeric(20,6),
    payload         jsonb,
    created_at      timestamptz default now()
);

-- 6. impact_audit: append-only audit trail for impact pipeline steps
create table if not exists public.impact_audit (
    id          uuid primary key default gen_random_uuid(),
    run_id      text not null,
    step        text not null,
    payload     jsonb,
    created_at  timestamptz default now()
);

-- Row Level Security (off for service-role usage — enable in production)
alter table public.services       disable row level security;
alter table public.recommendations disable row level security;
alter table public.actions_log    disable row level security;
alter table public.memory         disable row level security;
alter table public.impact_metrics disable row level security;
alter table public.impact_audit   disable row level security;
