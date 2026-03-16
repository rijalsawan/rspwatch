"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Menu, X, Moon, Sun, Search, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useSearch } from "./SearchModal"

const PRIMARY_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/press", label: "Press & News" },
  { href: "/transparency", label: "Transparency" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/events", label: "Events" },
]

const TRACKING_LINKS = [
  { href: "/members", label: "MPs" },
  { href: "/laws", label: "Laws & Bills" },
  { href: "/promises", label: "Promises" },
  { href: "/votes", label: "Votes" },
]

const MORE_LINKS = [
  { href: "/analytics", label: "Analytics" },
  { href: "/timeline", label: "Timeline" },
  { href: "/statements", label: "Statements" },
  { href: "/appointments", label: "Appointments" },
  { href: "/controversies", label: "Controversies" },
]

const ALL_LINKS = [...PRIMARY_LINKS, ...TRACKING_LINKS, ...MORE_LINKS]

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isTrackOpen, setIsTrackOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { openSearch } = useSearch()
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const trackRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false)
      }
      if (trackRef.current && !trackRef.current.contains(e.target as Node)) {
        setIsTrackOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsMoreOpen(false)
    setIsTrackOpen(false)
  }, [pathname])

  const isMoreActive = MORE_LINKS.some(
    (link) => pathname === link.href || pathname.startsWith(link.href)
  )
  
  const isTrackActive = TRACKING_LINKS.some(
    (link) => pathname === link.href || pathname.startsWith(link.href)
  )

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 shrink-0"
        >
          <Bell className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
          <span className="font-display font-bold text-lg tracking-tight">RSP Watch</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {/* Dashboard link */}
          <Link
            href={PRIMARY_LINKS[0].href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap",
              pathname === PRIMARY_LINKS[0].href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            {PRIMARY_LINKS[0].label}
          </Link>

          {/* Tracking Dropdown */}
          <div ref={trackRef} className="relative">
            <button
              onClick={() => {
                setIsTrackOpen((v) => !v)
                setIsMoreOpen(false)
              }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap",
                isTrackActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              Accountability
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  isTrackOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isTrackOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 w-48 bg-background border border-border rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5"
                >
                  {TRACKING_LINKS.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname.startsWith(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsTrackOpen(false)}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        )}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {PRIMARY_LINKS.slice(1).map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {link.label}
              </Link>
            )
          })}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => {
                setIsMoreOpen((v) => !v)
                setIsTrackOpen(false)
              }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isMoreActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              More
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  isMoreOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 w-48 bg-background border border-border rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5"
                >
                  {MORE_LINKS.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname.startsWith(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMoreOpen(false)}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        )}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Desktop search */}
          <button
            onClick={openSearch}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <kbd className="hidden lg:inline-flex items-center font-mono text-[10px] opacity-60 ml-1 bg-background border border-border rounded px-1 py-0.5">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search */}
          <button
            onClick={openSearch}
            className="md:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-md hover:bg-secondary text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-background border-b border-border shadow-lg"
          >
            <nav className="flex flex-col p-3 gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {ALL_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "px-4 py-2.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
