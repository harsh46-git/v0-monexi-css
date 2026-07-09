"use client"

import { Mail, MapPin, Twitter, Linkedin, Instagram } from "lucide-react"

interface FooterProps {
  onNavigate?: (page: string) => void
}

export function Footer({ onNavigate }: FooterProps) {
  const handleLinkClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <footer className="border-t border-white/5 bg-card/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 lg:gap-28">

          {/* Brand + Contact */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-bold text-foreground tracking-tight">
                Monexi
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">India</span>
              </div>

              <a
                href="mailto:contact@monexi.in"
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">contact@monexi.in</span>
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4 pt-3">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-full bg-secondary/50 text-muted-foreground
                             hover:bg-secondary hover:text-primary hover:scale-110
                             transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="md:pl-10">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
              Product
            </h4>
            <ul className="space-y-3">
              {[
                ["Dashboard", "dashboard"],
                ["Market", "tools"],
                ["SIP Engine", "tools"],
                ["Trip Planner", "tools"],
                ["Tax", "tools"],
                ["Analysis", "tools"],
                ["AI Advisor", "ai-advisor"],
              ].map(([label, page]) => (
                <li key={label}>
                  <button
                    onClick={() => handleLinkClick(page)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Cookie Policy", href: "/privacy" },
              ].map(({ label, href }) => (
                <li key={label}>
                  
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 mt-14 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Monexi. All rights reserved. Designed for the future.
          </p>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-24" />

    </footer>
  )
}
