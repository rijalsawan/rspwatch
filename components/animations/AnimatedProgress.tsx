"use client"

import { motion } from "framer-motion"

interface AnimatedProgressProps {
  value: number // 0 to 100
  className?: string
  delay?: number
  duration?: number
}

export function AnimatedProgress({ 
  value, 
  className = "", 
  delay = 0.1, 
  duration = 0.8 
}: AnimatedProgressProps) {
  // Ensure value is between 0 and 100
  const widthVal = Math.max(0, Math.min(100, isNaN(value) ? 0 : value))

  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      animate={{ width: `${widthVal}%` }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }} // nice custom spring-like ease
    />
  )
}