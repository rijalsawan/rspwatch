import Link from "next/link"
import {
  Scale,
  Users,
  FileText,
  BarChart3,
  Calendar,
  Shield,
  BookOpen,
  ExternalLink,
  Github,
  Mail,
  Eye,
} from "lucide-react"

const ACCOUNTABILITY_LINKS = [
  { href: "/members", label: "Members & MPs", icon: Users },
  { href: "/laws", label: "Laws & Bills", icon: Scale },
  { href: "/promises", label: "Promise Tracker", icon: FileText },
  { href: "/votes", label: "Voting Records" },
  { href: "/appointments", label: "Appointments" },
  { href: "/controversies", label: "Controversies" },
]

const EXPLORE_LINKS = [
  { href: "/press", label: "Press & News", icon: BookOpen },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/manifesto", label: "Manifesto", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/transparency", label: "Transparency", icon: Shield },
  { href: "/timeline", label: "Timeline" },
]

const PROJECT_LINKS = [
  { href: "/about", label: "About & Methodology" },
  { href: "/about", label: "Data Sources" },
  { href: "/about#contribute", label: "Report an Issue" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      {/* CTA Banner */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-lg">
            <h3 className="font-display font-bold text-lg md:text-xl">
              Help keep democracy accountable
            </h3>
            <p className="text-sm text-muted-foreground">
              Parliament Watch is an open-source, community-driven project. Spot
              inaccurate data? Have a suggestion? Contribute to the project.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/about#contribute"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="w-4 h-4" />
              Get Involved
            </Link>
            <a
              href="https://github.com/rijalsawan/rspwatch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border bg-background font-medium text-sm hover:bg-secondary/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <Link
              href="/transparency"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border bg-background font-medium text-sm hover:bg-secondary/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Shield className="w-4 h-4" />
              View Data Sources
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 flex flex-col gap-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md w-fit group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
                <Eye className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Parliament <span className="text-muted-foreground font-normal">Watch</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              An independent, non-partisan public accountability tracker for
              Nepal&apos;s Parliament and political parties. Monitoring promises, votes,
              and governance in real time.
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                Data auto-updated daily
              </span>
            </div>
          </div>

          {/* Accountability Links */}
          <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Accountability
            </h4>
            <nav className="flex flex-col gap-2.5">
              {ACCOUNTABILITY_LINKS.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {link.icon && (
                    <link.icon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Explore Links */}
          <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Explore
            </h4>
            <nav className="flex flex-col gap-2.5">
              {EXPLORE_LINKS.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {link.icon && (
                    <link.icon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Project Links */}
          <div className="col-span-2 md:col-span-2 flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Project
            </h4>
            <nav className="flex flex-col gap-2.5">
              {PROJECT_LINKS.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://github.com/rijalsawan/rspwatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://parliament.gov.np"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Nepal Parliament"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>
            &copy; {year} Parliament Watch. Open-source civic data.
          </p>
          <div className="flex items-center gap-1.5">
            <span>Not affiliated with any political party.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
