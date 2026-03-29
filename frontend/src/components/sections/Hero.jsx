import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingDown, Zap, Shield, Brain, Activity } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { fadeUp, staggerContainer } from '../../utils/animations'

const WASTE_PER_SECOND = 1420

const sparklineData = [
  { d: 1, v: 412 },
  { d: 2, v: 418 },
  { d: 3, v: 405 },
  { d: 4, v: 431 },
  { d: 5, v: 448 },
  { d: 6, v: 439 },
  { d: 7, v: 462 },
  { d: 8, v: 455 },
  { d: 9, v: 478 },
  { d: 10, v: 502 },
  { d: 11, v: 489 },
  { d: 12, v: 511 },
  { d: 13, v: 498 },
  { d: 14, v: 524 },
]

const varianceKpis = [
  { label: 'MTD actual', value: '₹4.98Cr', delta: '+6.2% vs LM', tone: 'text-danger' },
  { label: 'Run-rate vs budget', value: '108.4%', delta: 'Over by ₹42L', tone: 'text-warning' },
  { label: 'Forecast (EOM)', value: '₹5.31Cr', delta: 'CI 95%', tone: 'text-ink' },
  { label: 'Open anomalies', value: '3', delta: '2 auto-remediated', tone: 'text-accent' },
]

function LiveWasteCounter() {
  const [wasted, setWasted] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWasted((prev) => prev + WASTE_PER_SECOND)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 rounded-md border border-edge-strong bg-white px-4 py-3 shadow-card">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Live bleed rate (illustrative)</p>
        <p className="font-mono text-base font-semibold tabular-nums text-danger">
          ${wasted.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function HeroVarianceStrip() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-edge-strong bg-slate-200 lg:grid-cols-4">
      {varianceKpis.map((k) => (
        <div key={k.label} className="bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k.label}</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{k.value}</p>
          <p className={`mt-0.5 text-xs font-medium ${k.tone}`}>{k.delta}</p>
        </div>
      ))}
    </div>
  )
}

function HeroSparklineCard() {
  return (
    <div className="rounded-md border border-edge-strong bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Trailing 14d — cloud + SaaS
          </span>
        </div>
        <span className="font-mono text-xs tabular-nums text-danger">+12.4% WoW</span>
      </div>
      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#2563EB"
              strokeWidth={1.5}
              fill="url(#heroSpark)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-muted">Synthetic series for demo — variance visible at a glance.</p>
    </div>
  )
}

const pillBadges = [
  { icon: Brain, label: 'Multi-agent orchestration' },
  { icon: Zap, label: 'Streaming cost events' },
  { icon: Shield, label: 'Governance & audit' },
  { icon: TrendingDown, label: 'Attributable savings' },
]

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-5">
              <span className="section-label">Autonomous FinOps intelligence</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={0.08}
              className="font-display text-balance text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7xl"
            >
              Command every rupee across{' '}
              <span className="text-gradient">SaaS and infra</span>
              <span className="text-muted"> — </span>
              before it leaks.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.15}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg"
            >
              Multi-agent monitoring, anomaly response, SLA protection, and CFO-grade attribution — with policies and
              humans in the loop.
            </motion.p>

            <motion.div variants={fadeUp} custom={0.22} className="mt-8">
              <HeroVarianceStrip />
            </motion.div>

            <motion.div variants={fadeUp} custom={0.28} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LiveWasteCounter />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={0.34}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link to="/dashboard" className="btn-primary justify-center text-sm md:text-base">
                Open command center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="btn-secondary justify-center text-sm md:text-base">
                Architecture
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={0.4}
              className="mt-8 flex flex-wrap gap-2"
            >
              {pillBadges.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded border border-edge bg-white px-2.5 py-1 text-xs font-medium text-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  {label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <HeroSparklineCard />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6"
            >
              <HeroProductPreview />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function HeroProductPreview() {
  const agents = [
    { name: 'Discovery Agent', status: 'active', action: 'Scanning 47 SaaS tools...', color: 'bg-primary' },
    { name: 'Anomaly Detector', status: 'alert', action: 'Spike: AWS EC2 +340%', color: 'bg-danger' },
    { name: 'SLA Monitor', status: 'monitoring', action: '12 SLAs in watch', color: 'bg-sky-500' },
    { name: 'CFO Copilot', status: 'active', action: 'Query routed', color: 'bg-accent' },
  ]

  return (
    <div className="mx-auto max-w-full">
      <div className="glass-card glass-card-hover overflow-hidden rounded-md">
        <div className="flex items-center justify-between border-b border-edge bg-blue-50/90 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-danger/80" />
            <div className="h-2.5 w-2.5 rounded-sm bg-warning/80" />
            <div className="h-2.5 w-2.5 rounded-sm bg-accent/80" />
          </div>
          <span className="font-mono text-[11px] text-muted">FinOps AI / command_center</span>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            LIVE
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-edge bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="col-span-1 p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">Agent activity</p>
            <div className="space-y-3">
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.08, duration: 0.35 }}
                  className="flex items-start gap-2.5"
                >
                  <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm ${agent.color}`} />
                  <div>
                    <p className="text-xs font-semibold text-ink">{agent.name}</p>
                    <p className="text-[11px] text-muted">{agent.action}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center p-5 text-center">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Projected savings (session)</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="font-mono text-4xl font-semibold tabular-nums text-accent md:text-5xl"
            >
              ₹5L
            </motion.p>
            <p className="mb-4 text-[11px] text-muted">Attributable / audited</p>
            <div className="h-1.5 w-full max-w-[180px] rounded-sm bg-slate-100">
              <motion.div
                className="h-1.5 rounded-sm bg-accent"
                initial={{ width: 0 }}
                animate={{ width: '72%' }}
                transition={{ delay: 0.85, duration: 0.9, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted">72% of modeled levers captured</p>
          </div>

          <div className="col-span-1 p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">Live metrics</p>
            <div className="space-y-3">
              {[
                { label: 'Duplicate SaaS', value: '14', sub: '6 queued cut', tone: 'text-danger' },
                { label: 'Anomalies', value: '3', sub: 'Auto-resolve on', tone: 'text-warning' },
                { label: 'SLAs at risk', value: '1', sub: 'Rebalance', tone: 'text-slate-600' },
                { label: 'ROI (MTD)', value: '180%', sub: '+23% vs LM', tone: 'text-accent' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 + i * 0.06 }}
                  className="flex items-end justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-[11px] text-muted">{stat.label}</p>
                    <p className={`text-[11px] font-medium ${stat.tone}`}>{stat.sub}</p>
                  </div>
                  <p className={`font-mono text-lg font-semibold tabular-nums ${stat.tone}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
