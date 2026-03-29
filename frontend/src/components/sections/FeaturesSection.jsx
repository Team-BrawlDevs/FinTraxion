import { motion } from 'framer-motion'
import {
  Search, AlertTriangle, Zap, Clock, BarChart2, MessageSquare,
  RefreshCw, Network, TrendingUp, Shield,
} from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import { fadeUp, staggerContainer, fadeUpItem } from '../../utils/animations'

/** White + blue family: indigo / sky / cyan accents; red/amber kept for risk semantics */
const layers = [
  {
    number: '01',
    icon: Search,
    title: 'SaaS Optimization',
    description: 'Detects duplicate tools, underutilized licenses, and shadow IT across your entire software stack.',
    tags: ['Discovery', 'Normalization', 'Duplicate Detection'],
    accent: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    number: '02',
    icon: AlertTriangle,
    title: 'Spend Anomaly',
    description: 'Reactive intelligence that catches cost spikes the moment they happen and auto-remediates issues.',
    tags: ['Anomaly Detection', 'Root Cause', 'Remediation'],
    accent: '#DC2626',
    bg: '#FEE2E2',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Real-Time Engine',
    description: 'Streaming data pipeline for instant cost event detection with sub-second alerting and auto-response.',
    tags: ['Stream Ingestion', 'Real-Time Detector', 'Alerting'],
    accent: '#D97706',
    bg: '#FEF3C7',
  },
  {
    number: '04',
    icon: Clock,
    title: 'SLA Breach Prevention',
    description: 'Predicts SLA failures before they occur and proactively reallocates resources to prevent breaches.',
    tags: ['SLA Monitoring', 'Prediction', 'Prevention'],
    accent: '#3B82F6',
    bg: '#DBEAFE',
  },
  {
    number: '05',
    icon: BarChart2,
    title: 'Predictive Simulation',
    description: 'Digital twin engine to run what-if cost scenarios before committing to any infrastructure change.',
    tags: ['Scenario Generator', 'Simulation Engine', 'Strategy Rec'],
    accent: '#4F46E5',
    bg: '#EEF2FF',
  },
  {
    number: '06',
    icon: MessageSquare,
    title: 'CFO Copilot',
    description: 'Conversational interface that understands natural language queries and routes them to the right agents.',
    tags: ['Query Understanding', 'Routing', 'Reasoning'],
    accent: '#0EA5E9',
    bg: '#E0F2FE',
  },
  {
    number: '07',
    icon: RefreshCw,
    title: 'Continuous Learning',
    description: 'Adaptive layer that improves every decision based on past outcomes and CFO feedback loops.',
    tags: ['Feedback Collector', 'Learning Agent', 'Policy Adjustment'],
    accent: '#06B6D4',
    bg: '#CFFAFE',
  },
  {
    number: '08',
    icon: Network,
    title: 'Knowledge Graph',
    description: 'Maps all vendor, cost, and team relationships to enable deep causality analysis and attribution.',
    tags: ['Graph Builder', 'Relationship Extraction', 'Causality'],
    accent: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    number: '09',
    icon: TrendingUp,
    title: 'Quantifiable Impact',
    description: 'Calculates real business value, ROI, and efficiency gains for every automated action taken.',
    tags: ['Cost Calculator', 'ROI Agent', 'Impact Aggregator'],
    accent: '#059669',
    bg: '#D1FAE5',
  },
  {
    number: '10',
    icon: Shield,
    title: 'Governance',
    description: 'Enforces policies, maintains full audit logs, and ensures every action complies with access controls.',
    tags: ['Policy Engine', 'Governance Node', 'Audit Logger'],
    accent: '#1D4ED8',
    bg: '#DBEAFE',
  },
]

function LayerCard({ layer }) {
  const Icon = layer.icon

  return (
    <motion.div
      variants={fadeUpItem}
      className="glass-card glass-card-hover group cursor-default rounded-md p-6"
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: layer.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: layer.accent }} />
        </div>
        <span className="font-mono text-xs font-bold text-muted/50 transition-colors group-hover:text-muted">
          {layer.number}
        </span>
      </div>

      <h3 className="mb-2 text-base font-semibold text-ink">{layer.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted">{layer.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {layer.tags.map((tag) => (
          <span
            key={tag}
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: layer.bg, color: layer.accent }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function FeaturesSection() {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation()
  /** One observer for the whole grid — avoids bottom cards never hitting 15% in-view */
  const { ref: gridRef, isInView: gridInView } = useScrollAnimation({
    amount: 0.08,
    margin: '0px 0px 15% 0px',
    once: true,
  })

  return (
    <section id="features" className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          ref={headerRef}
          initial="hidden"
          animate={headerInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-20 text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-4">
            <span className="section-label">The 10-Layer Intelligence Stack</span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="mb-4 font-display text-5xl leading-tight text-ink md:text-6xl"
          >
            Every dollar, every agent,{' '}
            <span className="font-semibold text-primary">every second.</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.2} className="mx-auto max-w-2xl text-lg text-muted">
            Ten specialized AI agents working in concert — each with a distinct mission,
            all reporting to a single intelligent orchestrator.
          </motion.p>
        </motion.div>

        <motion.div
          ref={gridRef}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate={gridInView ? 'visible' : 'hidden'}
        >
          {layers.map((layer) => (
            <LayerCard key={layer.number} layer={layer} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
