import { motion } from 'framer-motion'

const statusColors = {
  active: 'bg-accent text-white',
  monitoring: 'bg-blue-500 text-white',
  idle: 'bg-gray-200 text-gray-600',
  alert: 'bg-warning text-white',
}

export default function AgentStatusBadge({ status = 'active', label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status]}`}>
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {label}
    </span>
  )
}
