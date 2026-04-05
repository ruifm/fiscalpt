'use client'

import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 600

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target)
  const prevTarget = useRef(target)

  useEffect(() => {
    if (prevTarget.current === target) return
    const from = prevTarget.current
    prevTarget.current = target
    const start = performance.now()

    const tick = () => {
      const elapsed = performance.now() - start
      const progress = Math.min(elapsed / DURATION_MS, 1)
      setDisplay(from + (target - from) * easeOut(progress))
      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        setDisplay(target)
      }
    }

    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [target])

  return display
}

export function AnimatedEuro({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value)
  const formatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(animated))

  return <span className={className}>{formatted}</span>
}
