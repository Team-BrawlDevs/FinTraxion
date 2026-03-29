import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Copilot', href: '/#copilot' },
  { label: 'Simulation', href: '/#simulation' },
  { label: 'Impact', href: '/#impact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isAppShell = location.pathname === '/dashboard' || location.pathname === '/workspace'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-edge-strong bg-white/95 shadow-card'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary-dark/20 bg-primary transition-transform duration-200 group-hover:scale-[1.02]">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-ink text-sm tracking-tight">
            FinOps<span className="text-primary"> AI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        {!isAppShell && (
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted hover:text-ink transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3">
          {!isAppShell ? (
            <Link to="/dashboard" className="btn-primary text-sm py-2 px-5">
              Open Dashboard
            </Link>
          ) : (
            <>
              {location.pathname === '/dashboard' ? (
                <Link to="/workspace" className="btn-secondary text-sm py-2 px-4 hidden sm:inline-flex">
                  Live workspace
                </Link>
              ) : null}
              {location.pathname === '/workspace' ? (
                <Link to="/dashboard" className="btn-secondary text-sm py-2 px-4 hidden sm:inline-flex">
                  Command center
                </Link>
              ) : null}
              <Link to="/" className="btn-secondary text-sm py-2 px-5">
                ← Back to Home
              </Link>
            </>
          )}
          {!isAppShell && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-edge bg-white/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-muted hover:text-ink font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
