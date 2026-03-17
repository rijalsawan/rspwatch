"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu, X, Moon, Sun, Search, ChevronDown,
  LayoutDashboard, Newspaper, Eye, BookOpen, Calendar,
  Users, Scale, ClipboardList, Vote, BarChart2,
  Clock, MessageSquare, CalendarCheck, AlertTriangle,
  UserCircle2, LogOut,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useSearch } from "./SearchModal"
import { useAuthModal } from "./AuthModal"

const PRIMARY_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/press", label: "Press & News", icon: Newspaper },
  { href: "/transparency", label: "Transparency", icon: Eye },
  { href: "/manifesto", label: "Manifesto", icon: BookOpen },
  { href: "/events", label: "Events", icon: Calendar },
]

const TRACKING_LINKS = [
  { href: "/members", label: "MPs", icon: Users },
  { href: "/laws", label: "Laws & Bills", icon: Scale },
  { href: "/promises", label: "Promises", icon: ClipboardList },
  { href: "/votes", label: "Votes", icon: Vote },
]

const MORE_LINKS = [
  { href: "/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/statements", label: "Statements", icon: MessageSquare },
  { href: "/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/controversies", label: "Controversies", icon: AlertTriangle },
]

const ALL_LINKS = [...PRIMARY_LINKS, ...TRACKING_LINKS, ...MORE_LINKS]

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isTrackOpen, setIsTrackOpen] = useState(false)
  const [sidebarAccountabilityOpen, setSidebarAccountabilityOpen] = useState(true)
  const [sidebarMoreOpen, setSidebarMoreOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { openSearch } = useSearch()
  const { openAuthModal } = useAuthModal()
  const { data: session } = useSession()
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isMobileMenuOpen])

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
    <>
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
          <span className="font-display font-bold text-lg tracking-tight">Parliament Watch</span>
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

          {/* Desktop theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {/* Desktop auth */}
          {mounted && (
            session ? (
              <div className="hidden md:flex items-center gap-1">
                <span className="text-xs text-muted-foreground px-2 max-w-[96px] truncate">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserCircle2 className="w-4 h-4" />
                Sign In
              </button>
            )
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
    </header>

      {/* Mobile full-screen menu — outside header to avoid stacking context issues */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Full-screen panel — slides up from bottom */}
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-50 bg-background md:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
                <Link
                  href="/"
                  className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="font-display font-bold text-lg tracking-tight">Parliament Watch</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav — 3-col grid, vertically fills remaining space */}
              <nav className="flex-1 px-4 py-4 flex flex-col justify-evenly">
                {/* Main */}
                <div>
                  <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Main</p>
                  <div className="grid grid-cols-3 gap-1">
                    {PRIMARY_LINKS.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 px-1 py-3 rounded-lg text-xs font-medium transition-colors text-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="leading-tight">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Accountability */}
                <div>
                  <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Accountability</p>
                  <div className="grid grid-cols-3 gap-1">
                    {TRACKING_LINKS.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || pathname.startsWith(href)
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 px-1 py-3 rounded-lg text-xs font-medium transition-colors text-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="leading-tight">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Explore */}
                <div>
                  <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Explore</p>
                  <div className="grid grid-cols-3 gap-1">
                    {MORE_LINKS.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || pathname.startsWith(href)
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 px-1 py-3 rounded-lg text-xs font-medium transition-colors text-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="leading-tight">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-border px-4 py-4 grid grid-cols-2 gap-2 shrink-0">
                <button
                  onClick={() => { openSearch(); setIsMobileMenuOpen(false) }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-medium"
                  aria-label="Open search"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-medium border border-border"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
