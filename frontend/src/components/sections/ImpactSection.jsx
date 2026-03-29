import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AnimatedCounter from '../ui/AnimatedCounter'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import { fadeUp, staggerContainer } from '../../utils/animations'

const stats = [
  { value: 500000, prefix: '₹', suffix: '', label: 'Annual savings identified', display: '₹5L' },
  { value: 180, prefix: '', suffix: '%', label: 'ROI delivered', display: '180%' },
  { value: 47, prefix: '', suffix: '', label: 'SaaS tools analyzed', display: '47' },
  { value: 14, prefix: '', suffix: '', label: 'Duplicate tools eliminated', display: '14' },
]

const timeline = [
  { step: '01', action: 'CFO asks "Where are we wasting money?"', time: '0s', outcome: 'Query routed to 4 agents' },
  { step: '02', action: 'Discovery Agent scans all tools', time: '1.2s', outcome: '14 duplicates found' },
  { step: '03', action: 'Anomaly Detector flags EC2 spike', time: '1.8s', outcome: '+340% cost anomaly detected' },
  { step: '04', action: 'Governance checks pass', time: '2.1s', outcome: 'Auto-approved under threshold' },
  { step: '05', action: 'Remediation executes', time: '2.4s', outcome: 'Tools deprecated, resources scaled' },
  { step: '06', action: 'Impact Engine calculates savings', time: '3.0s', outcome: '₹5L/yr, 180% ROI confirmed' },
]

export default function ImpactSection() {
  const { ref, isInView } = useScrollAnimation()
  const { ref: tlRef, isInView: tlInView } = useScrollAnimation()

  return (
    <section id="impact" className="border-t border-edge bg-white py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-4">
            <span className="section-label">Layer 09 — Quantifiable Impact</span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="font-display text-5xl md:text-6xl text-ink leading-tight mb-4"
          >
            Numbers that{' '}
            <span className="font-semibold text-primary">speak for themselves.</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.2} className="text-lg text-muted max-w-xl mx-auto">
            Every action taken by FinOps AI is measured, attributed, and reported
            with full business context.
          </motion.p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card glass-card-hover rounded-md p-6 text-center"
            >
              <p className="mb-1 font-mono text-3xl font-semibold tabular-nums text-ink md:text-4xl">
                <AnimatedCounter
                  from={0}
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={2}
                />
              </p>
              <p className="text-sm text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Demo timeline */}
        <motion.div
          ref={tlRef}
          initial="hidden"
          animate={tlInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-20"
        >
          <motion.h3
            variants={fadeUp}
            custom={0}
            className="text-center font-semibold text-ink text-xl mb-10"
          >
            From question to action in{' '}
            <span className="text-primary font-mono">3.0 seconds</span>
          </motion.h3>

          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line */}
            <motion.div
              className="absolute bottom-0 left-6 top-0 w-px bg-slate-200"
              initial={{ scaleY: 0, originY: 0 }}
              animate={tlInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />

            <div className="space-y-6">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="flex items-start gap-6 pl-0"
                >
                  <div className="relative flex w-12 shrink-0 items-center justify-center">
                    <div className="relative z-10 h-2.5 w-2.5 rounded-sm border-2 border-white bg-primary shadow-sm" />
                  </div>
                  <div className="glass-card flex flex-1 items-center justify-between gap-4 rounded-md p-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.action}</p>
                      <p className="text-xs text-accent font-medium mt-1">{item.outcome}</p>
                    </div>
                    <span className="font-mono text-xs text-muted whitespace-nowrap flex-shrink-0 bg-background px-2 py-1 rounded-lg">
                      T+{item.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={tlInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto max-w-lg rounded-md border-2 border-blue-200 bg-white px-10 py-10 shadow-card">
            <p className="mb-2 font-display text-3xl text-ink">Ready to stop the bleed?</p>
            <p className="mb-6 text-sm text-muted">
              FinOps AI is live. Every second you wait costs money.
            </p>
            <Link to="/dashboard" className="btn-primary w-full justify-center py-4 text-base">
              Open command center
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
