import Link from "next/link"
import { Bell } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md w-fit">
              <Bell className="w-5 h-5 text-primary" />
              <span className="font-display font-bold space-x-1">
                <span>RSP</span>
                <span className="text-muted-foreground font-normal">Watch</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              An independent public accountability tracker for the Rastriya Swatantra Party's performance in government. Not affiliated with the RSP.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <h3 className="font-medium text-sm">Navigation</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/laws" className="hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Laws & Bills</Link>
              <Link href="/promises" className="hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Promises</Link>
              <Link href="/members" className="hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Members & MPs</Link>
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-medium text-sm">About</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Methodology</Link>
              <a href="#" className="hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Data Sources</a>
              <a href="#" className="hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Report an Issue</a>
            </nav>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} RSP Watch Project. Open source data.</p>
          <div className="flex items-center gap-4">
            <span>Last updated: March 15, 2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
