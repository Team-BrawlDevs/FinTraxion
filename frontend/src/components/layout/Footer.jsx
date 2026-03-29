import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-edge-strong bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary-dark/20 bg-primary">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="font-bold text-ink text-sm">FinOps <span className="text-primary">AI</span></span>
        </div>

        <p className="text-xs text-muted text-center">
          Autonomous Cost Intelligence &amp; Optimization Platform &mdash; Built for the Enterprise
        </p>

        <Link to="/dashboard" className="btn-primary text-xs py-2 px-4">
          Launch Dashboard →
        </Link>
      </div>
    </footer>
  )
}
