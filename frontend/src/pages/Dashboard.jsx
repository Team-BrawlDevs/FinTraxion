import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Zap,
  TrendingDown,
  AlertTriangle,
  Brain,
  Bell,
  Settings,
  Play,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import { pageTransition } from '../utils/animations'
import BackgroundDecor from '../components/ui/BackgroundDecor'
import ImpactSummary from '../components/ImpactSummary'
import AgentWorkflow from '../components/AgentWorkflow'
import { useOptimization } from '../context/OptimizationContext'

const agentFeedFallback = [
  { id: '1', agent: 'Discovery Agent', action: 'Start a run to stream live agent activity from the FinTraxion API.', time: '—', status: 'active', icon: Brain },
  { id: '2', agent: 'API', action: 'Backend: POST /run → SSE /stream/{run_id} → GET /status', time: '—', status: 'monitoring', icon: Zap },
]

const statusIconMap = {
  active: Brain,
  alert: AlertTriangle,
  monitoring: Zap,
}

function RecommendationRow({ action }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-edge p-4 flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{action.title}</p>
        <p className="text-xs text-muted truncate">{action.description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-accent">{action.saving}</p>
        <p className={`text-xs font-medium ${action.risk === 'Low' ? 'text-accent' : action.risk === 'Medium' ? 'text-warning' : 'text-danger'}`}>
          {action.risk} risk
        </p>
      </div>
    </motion.div>
  )
}

function RecommendationsCard({ recommendationActions }) {
  return (
    <div className="glass-card flex max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-md p-6 glass-card-hover">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-ink">Recommendations</h3>
          <p className="text-xs text-muted mt-1">From GET /status after each graph step</p>
        </div>
        {recommendationActions.length > 0 && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning text-xs font-bold text-white">
            {recommendationActions.length}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
        <AnimatePresence>
          {recommendationActions.length > 0 ? (
            <div className="space-y-3">
              {recommendationActions.map((action) => (
                <RecommendationRow key={action.id} action={action} />
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
                <TrendingDown className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium text-ink">No recommendations yet</p>
              <p className="text-xs text-muted px-2">
                Run optimization — results sync here and in Live workspace.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AgentActivityCard({ displayFeed, uiState }) {
  return (
    <div className="glass-card flex h-[min(50vh,320px)] shrink-0 flex-col overflow-hidden rounded-md p-6 glass-card-hover">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h3 className="font-display text-xl text-ink">Agent activity</h3>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
          <span className={`h-1.5 w-1.5 rounded-full ${uiState === 'Running' ? 'animate-pulse bg-accent' : 'bg-muted'}`} />
          {uiState === 'Running' ? 'Live' : 'Idle'}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll overscroll-contain pr-1 [scrollbar-gutter:stable]">
        <div className="w-max max-w-none space-y-4 pb-0.5">
          {displayFeed.map((item, i) => {
            const Icon = item.icon
            const colorMap = {
              active: 'text-primary bg-primary-light',
              alert: 'text-danger bg-red-50',
              monitoring: 'text-blue-500 bg-blue-50',
            }
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colorMap[item.status] || colorMap.active}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-[12rem]">
                  <p className="text-xs font-semibold capitalize text-ink">{item.agent}</p>
                  <p className="whitespace-nowrap text-xs leading-relaxed text-muted">{item.action}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted/50">{item.time}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    uiState,
    runId,
    status,
    activityFeed,
    lastEvent,
    activeNode,
    completedNodes,
    runAnalysis,
    needsHumanApproval,
    approvalNotes,
    setApprovalNotes,
    approveBusy,
    onApprove,
    apiBase,
    setApiBase,
  } = useOptimization()

  const recommendationActions = useMemo(() => {
    const recs = status.recommendations || []
    return recs.map((r, i) => ({
      id: `${r.run_id || 'r'}-${i}`,
      title: r.action || `Recommendation ${i + 1}`,
      description: (r.justification || r.reason || '').slice(0, 120) || '—',
      saving: typeof r.savings === 'number' ? `₹${Math.round(r.savings).toLocaleString('en-IN')}` : '—',
      risk: r.risk === 'high' ? 'High' : r.risk === 'medium' ? 'Medium' : 'Low',
    }))
  }, [status.recommendations])

  const displayFeed = useMemo(() => {
    if (activityFeed.length === 0) return agentFeedFallback
    return activityFeed.map((item) => ({
      id: item.id,
      agent: item.agent,
      action: item.action,
      time: item.time,
      status: item.status,
      icon: statusIconMap[item.status] || Brain,
    }))
  }, [activityFeed])

  /** Monthly spend before vs after from GET /status (impact_metrics, baseline, usage_data, context_memory). */
  const beforeAfterChart = useMemo(() => {
    const im = status.impact_metrics || {}
    const cm = status.context_memory || {}
    const bs = status.baseline_snapshot || {}
    const usage = status.usage_data || []

    let before = Number(im.before_cost ?? cm.total_cost_before ?? bs.before_cost ?? 0)
    let after = Number(im.after_cost ?? cm.total_cost_after ?? 0)

    if (!before && usage.length > 0) {
      before = usage.reduce((sum, u) => sum + Number(u.monthly_cost ?? u.monthlyCost ?? 0), 0)
    }
    if (!after && before > 0) {
      if (im.savings != null && im.savings !== '') {
        after = Math.max(0, before - Number(im.savings))
      } else if (cm.total_savings != null) {
        after = Math.max(0, before - Number(cm.total_savings))
      } else {
        after = before
      }
    }

    const hasData = before > 0 || after > 0
    return {
      rows: [
        { name: 'Before optimization', amount: Math.round(before), fill: '#EF4444' },
        { name: 'After optimization', amount: Math.round(after), fill: '#10B981' },
      ],
      hasData,
      savings: Math.max(0, Math.round(before - after)),
    }
  }, [status])

  const statusLine =
    uiState === 'Idle'
      ? 'Idle — start a run to connect to the API'
      : uiState === 'Running'
        ? `Running${runId ? ` — ${runId.slice(0, 8)}…` : ''}`
        : uiState === 'Completed'
          ? 'Run completed — review impact and recommendations below'
          : 'Error — check backend logs'

  return (
    <motion.div {...pageTransition} className="relative min-h-screen bg-background">
      <BackgroundDecor />
      <Navbar />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-ink">Command Center</h1>
            <p className="text-sm text-muted mt-1">
              <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 animate-pulse ${uiState === 'Running' ? 'bg-accent' : 'bg-muted'}`} />
              {statusLine}
            </p>
            <p className="text-xs text-muted mt-2 font-mono max-w-xl truncate" title={apiBase}>
              API: {apiBase}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              <span className="whitespace-nowrap">Backend URL</span>
              <input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                className="rounded-lg border border-edge bg-white px-2 py-1.5 text-xs text-ink w-48 sm:w-64 font-mono"
                placeholder="http://localhost:8000"
              />
            </label>
            <button
              type="button"
              onClick={() => runAnalysis()}
              disabled={uiState === 'Running'}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold shadow-card hover:bg-primary-dark disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Run optimization
            </button>
            <Link
              to="/workspace"
              className="inline-flex items-center rounded-xl border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary/30"
            >
              Live workspace
            </Link>
            <button type="button" className="relative p-2.5 rounded-xl bg-white border border-edge hover:border-primary/30 transition-colors">
              <Bell className="w-4 h-4 text-muted" />
              {needsHumanApproval ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning" />
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
              )}
            </button>
            <button type="button" className="p-2.5 rounded-xl bg-white border border-edge hover:border-primary/30 transition-colors">
              <Settings className="w-4 h-4 text-muted" />
            </button>
          </div>
        </div>

        {needsHumanApproval ? (
          <div className="mb-6 rounded-xl border border-warning/40 bg-warning-light p-4">
            <p className="text-sm font-semibold text-ink">Human approval required</p>
            <p className="text-xs text-muted mt-1">The graph is paused. Approve or reject from here or from Live workspace.</p>
            <label className="block mt-3 text-xs text-ink">
              Notes (optional)
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-edge bg-white p-2 text-sm"
                rows={2}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={approveBusy}
                onClick={() => onApprove('approved')}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Approve all
              </button>
              <button
                type="button"
                disabled={approveBusy}
                onClick={() => onApprove('rejected')}
                className="rounded-lg border border-edge bg-white px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Reject all
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-6">
          <AgentWorkflow
            lastEvent={lastEvent}
            completedNodes={completedNodes}
            activeNode={activeNode}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="min-w-0 lg:col-span-8">
            <ImpactSummary
              contextMemory={status.context_memory || {}}
              impactMetrics={status.impact_metrics}
              learningUpdate={status.learning_update}
            />
          </div>
          <div className="min-w-0 lg:col-span-4">
            <AgentActivityCard displayFeed={displayFeed} uiState={uiState} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-8">
            <div className="glass-card rounded-md p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-semibold text-ink">Before vs after optimization</h3>
                  <p className="text-xs text-muted mt-1">
                    Monthly portfolio spend from backend status (baseline, impact_metrics, usage_data).
                  </p>
                </div>
                {beforeAfterChart.hasData && (
                  <span className="text-xs font-semibold text-emerald-800 bg-accent-light px-3 py-1 rounded-full">
                    Realized reduction ~ ₹{beforeAfterChart.savings.toLocaleString('en-IN')}/mo
                  </span>
                )}
              </div>
              {beforeAfterChart.hasData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={beforeAfterChart.rows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      interval={0}
                      height={48}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${Math.round(v / 1000)}K`}`}
                    />
                    <Tooltip
                      formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Monthly']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={120}>
                      {beforeAfterChart.rows.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-edge bg-gray-50/50 text-center px-4">
                  <p className="text-sm font-medium text-ink">No spend snapshot yet</p>
                  <p className="text-xs text-muted mt-2 max-w-md">
                    Run an optimization to populate baseline and post-execution costs from the API.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-4">
            <RecommendationsCard recommendationActions={recommendationActions} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
