"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import type { PageType } from "@/app/page"

interface NavbarProps {
  currentPage: PageType
  onNavigate: (page: PageType) => void
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [supabase])

  // UPDATED LOGOUT LOGIC
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setSession(null)
      onNavigate("home")
      
      // Page refresh ensure karta hai ki cache clear ho jaye aur user logged out state mein dikhe
      window.location.reload() 
    } catch (error) {
      console.error("Error during logout:", error)
      // Fallback: forcefully redirect to home if logout fails
      window.location.href = "/"
    }
  }

  const navItems: { label: string; page: PageType }[] = [
    { label: "Home", page: "home" },
    { label: "Dashboard", page: "dashboard" },
    { label: "Finance Hub", page: "finance-hub" },
    { label: "Tools", page: "tools" },
    { label: "AI Advisor", page: "ai-advisor" },
  ]

  // Helper to get first letter
  const userInitial = session?.user?.email?.charAt(0).toUpperCase() || "U"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button onClick={() => onNavigate("home")} className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg md:text-xl">M</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Monexi</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === item.page
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA Button or User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                {/* 👇 NEW AVATAR CODE START 👇 */}
                <div 
                  className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-emerald-500/20 cursor-default"
                  title={session.user?.email} // Mouse hover par email dikhega
                >
                  {userInitial}
                </div>
                {/* 👆 NEW AVATAR CODE END 👆 */}

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleLogout()
                  }}
                  className="p-2 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors bg-secondary/30 rounded-full hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Button
                onClick={() => onNavigate("dashboard")}
                className="gradient-accent text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get Started
              </Button>
            )}
          </div>
          

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page)
                    setMobileMenuOpen(false)
                  }}
                  className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                    currentPage === item.page
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {session ? (
                <div className="pt-2 mt-2 border-t border-white/5">
                   <div className="px-4 py-2 flex items-center gap-3 text-sm text-gray-400">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        {userInitial}
                      </div>
                      <span className="truncate">{session.user?.email}</span>
                   </div>
                   <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-3 rounded-lg text-left font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    onNavigate("dashboard")
                    setMobileMenuOpen(false)
                  }}
                  className="mt-2 gradient-accent text-primary-foreground w-full"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
