import { useRef } from 'react'
import { useInView } from 'framer-motion'

const defaultOptions = {
  amount: 0.15,
  margin: '0px 0px -80px 0px',
  once: true,
}

/**
 * @param {number | object} optsOrAmount - Legacy: number = `amount`. Or `{ amount, margin, once }`.
 */
export function useScrollAnimation(optsOrAmount = 0.15) {
  const ref = useRef(null)
  const opts =
    typeof optsOrAmount === 'number'
      ? { ...defaultOptions, amount: optsOrAmount }
      : { ...defaultOptions, ...optsOrAmount }
  const isInView = useInView(ref, {
    once: opts.once,
    margin: opts.margin,
    amount: opts.amount,
  })
  return { ref, isInView }
}
