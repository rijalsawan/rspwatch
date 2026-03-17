"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"

export function DiscussionFab() {
  const pathname = usePathname()

  // Don't show the FAB if we are already on the discussions page
  if (pathname?.startsWith("/discussions")) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Link href="/discussions">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        >
          {/* Main icon */}
          <motion.div
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="relative z-10"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.div>

          {/* Pulsing notification dot */}
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-0 right-0 flex h-3 w-3"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </motion.span>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background text-sm font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
          >
            Join Discussion
          </motion.div>
        </motion.div>
      </Link>
    </div>
  )
}

