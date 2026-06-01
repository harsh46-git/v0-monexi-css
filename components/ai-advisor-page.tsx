"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Sparkles, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
}

const suggestions = [
  "How should I start investing in mutual funds?",
  "What is the 50/30/20 budgeting rule?",
  "Explain SIP vs lump sum investment",
  "How much emergency fund should I have?",
  "What is Section 80C and how can I save tax?",
  "How do I calculate EMI for a home loan?",
  "What's the best strategy for wealth building?",
  "How much should I invest vs save monthly?",
]

export function AiAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    // streaming ke time instant scroll, warna smooth
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" })
  }, [messages, isStreaming])

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isStreaming) return

    const userMessage: Message = { role: "user", content: text }
    const updatedMessages = [...messages, userMessage]

    // Add user message + empty assistant bubble for streaming
    setMessages([...updatedMessages, { role: "assistant", content: "" }])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) throw new Error("Stream failed")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        setMessages((prev) => {
          const last = prev[prev.length - 1]
          return [
            ...prev.slice(0, -1),
            { role: "assistant", content: last.content + chunk },
          ]
        })
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // user ne stop kiya — jo aaya wahi rakho, agar khaali to bubble hatao
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1)
          return prev
        })
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." },
        ])
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }
  const stopStreaming = () => {
    abortRef.current?.abort()
  }

  // Last assistant message is still empty = waiting for first token
  const isWaitingForFirstToken =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === ""

  return (
    <div className="min-h-screen pt-20 pb-4 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent mb-4">
            <Bot className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Monexi AI Advisor</h1>
          <p className="text-muted-foreground">Your personal AI-powered financial assistant</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass rounded-2xl p-4 md:p-6 mb-4 overflow-hidden flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Sparkles className="h-12 w-12 text-accent/50 mb-4" />
              <p className="text-muted-foreground text-center mb-6">
                Ask me anything about personal finance, investments, or budgeting
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="text-left p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((message, i) => {
                // Skip rendering the empty assistant bubble (typing dots handle it)
                if (message.role === "assistant" && message.content === "") return null

                return (
                  <div
                    key={i}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <div className="markdown-body text-sm md:text-base leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                          {/* Blinking cursor while streaming */}
                          {isStreaming && i === messages.length - 1 && (
                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/70 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Typing dots — only before first token arrives */}
              {isWaitingForFirstToken && (
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

        {/* Input Area */}
        <div className="glass rounded-2xl p-3 flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isStreaming && handleSend()}
            placeholder="Ask about investing, budgeting, savings..."
            className="bg-secondary border-none text-foreground text-base"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              onClick={stopStreaming}
              className="bg-rose-500/90 text-white hover:bg-rose-500 px-4"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="gradient-accent text-primary-foreground hover:opacity-90 px-4"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}