import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'
import { gsap } from 'gsap'

export default function AnimatedCounter({ from = 0, to, duration = 2, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (isInView && !hasAnimated.current && ref.current) {
      hasAnimated.current = true
      const obj = { value: from }
      gsap.to(obj, {
        value: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (ref.current) {
            const val = Number.isInteger(to)
              ? Math.round(obj.value).toLocaleString()
              : obj.value.toFixed(1)
            ref.current.textContent = `${prefix}${val}${suffix}`
          }
        },
      })
    }
  }, [isInView, from, to, duration, prefix, suffix])

  return (
    <span ref={ref} className={`tabular-nums ${className}`.trim()}>
      {prefix}{from}{suffix}
    </span>
  )
}
