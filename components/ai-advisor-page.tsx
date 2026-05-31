"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Send, Bot, User, Sparkles, Plus, MessageSquare,
  Trash2, Pencil, Check, X, Menu,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createClient } from "@/lib/supabase-client"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Session {
  id: string
  title: string
  updated_at: string
}

const suggestions = [
  "How should I start investing in mutual funds?",
  "What is the 50/30/20 budgeting rule?",
  "Explain SIP vs lump sum investment",
  "How much emergency fund should I have?",
  "What is Section 80C and how can I save tax?",
  "How do I calculate EMI for a home loan?",
]

export function AiAdvisorPage() {
  const supabase = createClient() // 👈 Add this line here
  
  const [userId, setUserId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Auth + initial load ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const loadSessions = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
    setSessions(data ?? [])
  }, [userId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // --- Load a session's messages ---
  const openSession = async (id: string) => {
    setCurrentSessionId(id)
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", id)
      .order("created_at", { ascending: true })
    setMessages((data as Message[]) ?? [])
    setSidebarOpen(window.innerWidth >= 768) // mobile pe close kar do
  }

  const newChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setInput("")
  }

  const deleteSession = async (id: string) => {
    await supabase.from("chat_sessions").delete().eq("id", id)
    if (id === currentSessionId) newChat()
    loadSessions()
  }

  const saveRename = async (id: string) => {
    const title = editTitle.trim() || "New Chat"
    await supabase.from("chat_sessions").update({ title }).eq("id", id)
    setEditingId(null)
    loadSessions()
  }

  // --- Main send handler ---
  const handleSend = async (text: string = input) => {
    if (!text.trim() || isStreaming || !userId) return

    let sessionId = currentSessionId

    // Naya session banao (sirf pehle message pe)
    if (!sessionId) {
      const title = text.slice(0, 40) + (text.length > 40 ? "…" : "")
      const { data } = await supabase
        .from("chat_sessions")
        .insert({ user_id: userId, title })
        .select("id")
        .single()
      if (!data) return
      sessionId = data.id
      setCurrentSessionId(sessionId)
    }

    const userMessage: Message = { role: "user", content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages([...updatedMessages, { role: "assistant", content: "" }])
    setInput("")
    setIsStreaming(true)

    // User message DB mein save
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "user",
      content: text,
    })

    let assistantText = ""
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      if (!res.ok || !res.body) throw new Error("stream failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: assistantText },
        ])
      }
    } catch {
      assistantText = "Sorry, I'm having trouble connecting right now. Please try again."
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: assistantText },
      ])
    } finally {
      setIsStreaming(false)
      // Assistant message + session timestamp save
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: userId,
        role: "assistant",
        content: assistantText,
      })
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId)
      loadSessions()
    }
  }

  const isWaiting =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === ""

  return (
    <div className="h-screen pt-16 flex overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 overflow-hidden border-r border-white/10 flex flex-col bg-black/20 shrink-0`}
      >
        <div className="p-3">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl gradient-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                s.id === currentSessionId
                  ? "bg-secondary"
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => editingId !== s.id && openSession(s.id)}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />

              {editingId === s.id ? (
                <input
                  value={editTitle}
                  autoFocus
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveRename(s.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-sm outline-none border-b border-accent"
                />
              ) : (
                <span className="flex-1 text-sm truncate text-foreground/90">
                  {s.title}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === s.id ? (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); saveRename(s.id) }}>
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null) }}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(s.id)
                        setEditTitle(s.title)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Delete this chat?")) deleteSession(s.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4 px-2">
              No chats yet. Start a conversation!
            </p>
          )}
        </div>
      </aside>

      {/* ===== MAIN CHAT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Monexi AI Advisor</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-12 w-12 text-accent/50 mb-4" />
                <p className="text-muted-foreground text-center mb-6">
                  Ask me anything about personal finance, investments, or budgeting
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-left p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => {
                  if (m.role === "assistant" && m.content === "") return null
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {m.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                          m.role === "user"
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {m.role === "user" ? (
                          <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                            {m.content}
                          </p>
                        ) : (
                          <div className="markdown-body text-sm md:text-base leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                            {isStreaming && i === messages.length - 1 && (
                              <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/70 animate-pulse align-middle" />
                            )}
                          </div>
                        )}
                      </div>
                      {m.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-foreground" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {isWaiting && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-secondary rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto glass rounded-2xl p-3 flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isStreaming && handleSend()}
              placeholder="Ask about investing, budgeting, savings..."
              className="bg-secondary border-none text-foreground text-base"
              disabled={isStreaming}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="gradient-accent text-primary-foreground hover:opacity-90 px-4"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}