import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, MessageSquare } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import { fadeUp, staggerContainer } from '../../utils/animations'
import CFOModal from '../ui/CFOModal'

const conversation = [
  {
    role: 'user',
    text: 'Where are we wasting money this quarter?',
    delay: 500,
  },
  {
    role: 'ai',
    text: 'Analyzing your 47 active SaaS tools, infrastructure spend, and usage patterns...',
    isTyping: true,
    delay: 1200,
  },
  {
    role: 'ai',
    text: 'Found 3 critical waste areas:\n\n• **14 duplicate tools** — Slack + Teams + Discord all active (₹1.2L/yr)\n• **AWS EC2 over-provisioned** by 340% in staging env (₹80K/mo)\n• **Zoom Enterprise** — 62% of seats unused last 90 days (₹40K/yr)',
    delay: 3200,
  },
  {
    role: 'user',
    text: 'Fix the duplicate tools immediately.',
    delay: 5000,
  },
  {
    role: 'ai',
    text: 'Running governance checks... ✓ Policy cleared. ✓ CFO approval tier: auto-approved under ₹2L threshold.\n\nExecuting: Scheduling deprecation of Teams and Discord. Preserving Slack as primary. Estimated annual saving: **₹1.2L**.',
    delay: 6000,
  },
]

function ChatBubble({ message, visible }) {
  const isAI = message.role === 'ai'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
        >
          {isAI && (
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <div
            className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isAI
                ? 'bg-white border border-edge text-ink rounded-bl-sm shadow-card'
                : 'bg-primary text-white rounded-br-sm'
            }`}
          >
            {message.isTyping ? (
              <TypingIndicator />
            ) : (
              <span className="whitespace-pre-line">
                {message.text.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-muted/50"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

/** Demo runs only while modal is open. Scroll stays inside messagesRef — never the page. */
function DemoChat({ isActive }) {
  const [visibleMessages, setVisibleMessages] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [inputValue] = useState('Where are we wasting money this quarter?')
  const messagesRef = useRef(null)
  const timeoutsRef = useRef([])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  const runDemo = () => {
    clearTimeouts()
    setVisibleMessages([])
    setIsPlaying(true)

    conversation.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg])
        if (i === conversation.length - 1) setIsPlaying(false)
      }, msg.delay)
      timeoutsRef.current.push(t)
    })
  }

  useEffect(() => {
    if (!isActive) {
      clearTimeouts()
      setVisibleMessages([])
      setIsPlaying(false)
      return
    }
    runDemo()
    return clearTimeouts
  }, [isActive])

  useEffect(() => {
    const el = messagesRef.current
    if (!el || !isActive) return
    el.scrollTop = el.scrollHeight
  }, [visibleMessages, isActive])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center justify-end border-b border-edge bg-white px-5 py-2">
        <button
          type="button"
          onClick={runDemo}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Replay demo
        </button>
      </div>

      <div
        ref={messagesRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 bg-background/40 touch-pan-y"
      >
        {visibleMessages.map((msg, i) => (
          <ChatBubble key={i} message={msg} visible={true} />
        ))}
      </div>

      <div className="shrink-0 border-t border-edge bg-white px-5 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-edge bg-background px-4 py-2.5">
          <input
            readOnly
            value={isPlaying ? '' : inputValue}
            placeholder="Ask anything about your spend..."
            className="flex-1 bg-transparent text-sm text-muted outline-none placeholder:text-muted/50"
          />
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CFOCopilotSection() {
  const { ref, isInView } = useScrollAnimation()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section id="copilot" className="border-y border-edge bg-blue-50/70 py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-4">
            <span className="section-label">Layer 06 — CFO Copilot</span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="font-display text-5xl md:text-6xl text-ink leading-tight mb-6"
          >
            Ask anything.{' '}
            <span className="font-semibold text-primary">Fix everything.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="text-lg text-muted leading-relaxed mb-10 max-w-xl mx-auto"
          >
            Talk to your finances in plain English. The CFO Copilot understands context,
            routes queries to the right agents, and executes approved actions — all in one conversation.
          </motion.p>

          <motion.div variants={fadeUp} custom={0.25} className="space-y-4 text-left max-w-md mx-auto mb-12">
            {[
              { label: 'Natural language understanding', desc: 'No dashboards. Just ask.' },
              { label: 'Multi-agent routing', desc: 'Routes to the right specialist automatically.' },
              { label: 'Governance-gated execution', desc: 'Every action requires policy approval.' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={0.35}
            className="glass-card glass-card-hover mx-auto max-w-lg rounded-md p-8"
          >
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-primary-dark/20 bg-primary">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-accent">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </span>
              </div>
            </div>
            <p className="text-sm text-muted mb-6">
              Open the CFO Copilot to watch a guided demo conversation — multi-agent routing, governance checks,
              and automated savings in one flow. Nothing scrolls until you choose to open it.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              <Sparkles className="h-4 w-4" />
              Open CFO Copilot
            </button>
          </motion.div>
        </motion.div>
      </div>

      <CFOModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="CFO Copilot"
        subtitle="Online — powered by GPT-4 + Claude"
      >
        <DemoChat isActive={modalOpen} />
      </CFOModal>
    </section>
  )
}
