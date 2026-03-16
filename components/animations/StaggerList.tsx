"use client"

import { motion, Variants } from "framer-motion"
import { ReactNode } from "react"
import { Children, isValidElement } from "react"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

interface StaggerListProps {
  children: ReactNode
  className?: string
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        return (
          <motion.div variants={itemVariants}>
            {child}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
