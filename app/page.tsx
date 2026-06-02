"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase-client" // Ya fir useAuth agar aap use kar rahe hain
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ScreenshotsGallery } from "@/components/screenshots-gallery"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import { DashboardPage } from "@/components/dashboard-page"
import { ToolsPage } from "@/components/tools-page"
import { AiAdvisorPage } from "@/components/ai-advisor-page"
import { TermsPage } from "@/components/terms-page"
import { AuthPage } from "@/components/auth-page"

export type PageType = "home" | "dashboard" | "finance-hub" | "tools" | "ai-advisor" | "terms"
export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>("home")
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  
  const [authFlowCompleted, setAuthFlowCompleted] = useState(false)
  
  
  const initialCheckDone = useRef(false)

  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)

        // LOGIC FIX:
        if (!initialCheckDone.current) {
          if (currentSession) {
            setAuthFlowCompleted(true) 
          }
          initialCheckDone.current = true // Mark check as done
        }

        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      
     
      
      if (!newSession) {
        setAuthFlowCompleted(false)
        initialCheckDone.current = false // Reset for next login
      }
    })

    return () => subscription?.unsubscribe()
  }, [supabase])

  
  const handleAuthSuccess = () => {
    setAuthFlowCompleted(true)
    setCurrentPage("dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    )
  }

  // --- RENDER LOGIC ---
  const isProtectedPage = ["dashboard", "finance-hub", "tools", "ai-advisor"].includes(currentPage)
  
  
  //  AuthPage .
  if (isProtectedPage && (!session || !authFlowCompleted)) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-black text-white">
<Navbar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page)} />
      {currentPage === "home" && (
        <main>
          <HeroSection onGetStarted={() => setCurrentPage("dashboard")} />
          <FeaturesSection />
          <ScreenshotsGallery />
          <FaqSection />
          <Footer onNavigate={(page) => setCurrentPage(page as PageType)} />
        </main>
      )}

      {currentPage === "dashboard" && session && authFlowCompleted && <DashboardPage userEmail={session.user?.email} />}
      {currentPage === "finance-hub" && session && authFlowCompleted && <ToolsPage section="finance" />}
{currentPage === "tools" && session && authFlowCompleted && <ToolsPage section="tools" />}
      {currentPage === "ai-advisor" && session && authFlowCompleted && <AiAdvisorPage />}
      {currentPage === "terms" && <TermsPage />}
    </div>
  )
}