import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import { fadeUp, staggerContainer } from '../../utils/animations'

const scenarios = [
  { id: 'slack', label: 'Remove Slack', impact: -120000, risk: 'high', savings: '₹1.2L/yr', warning: 'Communication disruption risk' },
  { id: 'teams', label: 'Remove MS Teams', impact: -80000, risk: 'low', savings: '₹80K/yr', warning: null },
  { id: 'ec2', label: 'Downsize EC2 by 50%', impact: -960000, risk: 'medium', savings: '₹9.6L/yr', warning: 'SLA at 78% threshold' },
  { id: 'staging', label: 'Kill Staging Weekends', impact: -240000, risk: 'low', savings: '₹2.4L/yr', warning: null },
]

const riskColors = { low: 'text-accent', medium: 'text-warning', high: 'text-danger' }
const riskBg = { low: 'bg-accent-light', medium: 'bg-warning-light', high: 'bg-red-50' }

export default function SimulationSection() {
  const { ref, isInView } = useScrollAnimation()
  const [selected, setSelected] = useState(['teams', 'staging'])
  const [simulated, setSimulated] = useState(false)
  const [simulating, setSimulating] = useState(false)

  const toggleScenario = (id) => {
    setSimulated(false)
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const runSimulation = () => {
    setSimulating(true)
    setSimulated(false)
    setTimeout(() => {
      setSimulating(false)
      setSimulated(true)
    }, 1800)
  }

  const totalSavings = scenarios
    .filter((s) => selected.includes(s.id))
    .reduce((acc, s) => acc + Math.abs(s.impact), 0)

  const hasHighRisk = scenarios.some((s) => selected.includes(s.id) && s.risk === 'high')

  return (
    <section id="simulation" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-4">
            <span className="section-label">Layer 05 — Digital Twin</span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="font-display text-5xl md:text-6xl text-ink leading-tight mb-4"
          >
            Test decisions{' '}
            <span className="font-semibold text-primary">before they cost you.</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.2} className="text-lg text-muted max-w-2xl mx-auto">
            Run what-if scenarios on your real cost structure. See projected savings,
            risks, and SLA impacts before committing to any change.
          </motion.p>
        </motion.div>

        {/* Simulation UI */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card overflow-hidden rounded-md">
            {/* Top bar */}
            <div className="bg-white/60 border-b border-edge px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Predictive Simulation Engine</span>
              <span className="text-xs text-muted font-mono">Digital Twin v2.1</span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Scenario selector */}
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
                  Select Cost Scenarios
                </p>
                {scenarios.map((scenario) => {
                  const active = selected.includes(scenario.id)
                  return (
                    <motion.button
                      key={scenario.id}
                      onClick={() => toggleScenario(scenario.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${
                        active
                          ? 'border-primary bg-primary-light'
                          : 'border-edge bg-white hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          active ? 'border-primary bg-primary' : 'border-gray-300'
                        }`}>
                          {active && <div className="w-2 h-2 rounded-sm bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{scenario.label}</p>
                          {scenario.warning && (
                            <p className="text-xs text-warning flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3" />
                              {scenario.warning}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent">{scenario.savings}</p>
                        <span className={`text-xs font-medium capitalize ${riskColors[scenario.risk]}`}>
                          {scenario.risk} risk
                        </span>
                      </div>
                    </motion.button>
                  )
                })}

                <button
                  onClick={runSimulation}
                  disabled={selected.length === 0 || simulating}
                  className="w-full mt-2 btn-primary justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {simulating ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      Running simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Run Simulation
                    </>
                  )}
                </button>
              </div>

              {/* Results panel */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-widest">
                  Projected Outcome
                </p>

                <div className="bg-white rounded-2xl border border-edge p-5 space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-muted mb-1">Annual Savings</p>
                    <motion.p
                      key={totalSavings}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-display text-4xl font-bold text-accent"
                    >
                      ₹{(totalSavings / 100000).toFixed(1)}L
                    </motion.p>
                  </div>

                  {simulated && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-3 border-t border-edge"
                    >
                      <ResultRow label="ROI" value="+180%" positive />
                      <ResultRow label="Implementation Time" value="4.2 days" />
                      <ResultRow label="Risk Score" value={hasHighRisk ? 'Medium' : 'Low'} positive={!hasHighRisk} />
                      <ResultRow label="SLA Impact" value={hasHighRisk ? 'Review needed' : 'None'} positive={!hasHighRisk} />
                    </motion.div>
                  )}

                  {!simulated && selected.length > 0 && (
                    <p className="text-xs text-center text-muted">
                      Press Run Simulation to calculate
                    </p>
                  )}

                  {selected.length === 0 && (
                    <p className="text-xs text-center text-muted">
                      Select at least one scenario
                    </p>
                  )}
                </div>

                {hasHighRisk && selected.includes('slack') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-3"
                  >
                    <p className="text-xs text-danger font-semibold">⚠ High Risk Detected</p>
                    <p className="text-xs text-danger/80 mt-1">
                      Removing Slack may break 3 active integrations. Consider migrating first.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ResultRow({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-bold flex items-center gap-1 ${positive ? 'text-accent' : 'text-warning'}`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {value}
      </span>
    </div>
  )
}
