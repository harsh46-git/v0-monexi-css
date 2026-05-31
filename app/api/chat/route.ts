import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Monexi AI, a smart Indian personal finance advisor.

## RESPONSE STYLE
- Reply like a real human friend, NOT a robot
- Keep it SHORT: 3-5 sentences for simple questions
- Only use bullet points if listing 3+ items
- Don't use ## headers unless user asks for a detailed plan
- Sound natural, conversational, warm
- Use ₹ for amounts, mention real Indian platforms (Zerodha, Groww, HDFC etc.)

## RULES
- English only, never Hindi/Hinglish
- Be specific with numbers (₹5,000/month not "some money")
- Never recommend specific stocks
- Never ask for PAN/Aadhaar/passwords
- Add brief disclaimer only for complex topics

## TONE
Like a knowledgeable CA friend chatting on WhatsApp - warm, direct, practical.

## EXAMPLE
User: "Should I invest in mutual funds?"
You: "Absolutely, mutual funds are a great starting point! For beginners, I'd suggest a SIP of ₹2,000-5,000/month in an index fund like UTI Nifty 50 or HDFC Index Fund. They're low-cost (~0.2% expense ratio) and give instant diversification. Start small, stay consistent, increase as your income grows. 📈"`;

export const runtime = "edge"; // streaming works best on the edge runtime

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    // FIX: previously `message` + full history both pushed -> last turn duplicated.
    // Now: if `messages` already contains the latest user turn, use it as-is.
    // Only append `body.message` if it isn't already the last entry.
    const history = incoming.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    }));

    const last = history[history.length - 1];
    if (body.message && (!last || last.content !== body.message)) {
      history.push({ role: "user", content: String(body.message) });
    }
    if (history.length === 0) {
      history.push({ role: "user", content: "Hello" });
    }

    // Optional: keep context window tight — last 12 turns only
    const trimmed = history.slice(-12);

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
      max_tokens: 800,
      temperature: 0.7,
      stream: true,
    });

    // Stream tokens back as plain text
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch (e) {
          controller.enqueue(
            encoder.encode("\n\n[connection interrupted, please try again]")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Groq Error:", error?.message);
    return new Response(
      "I'm having trouble connecting right now. Please try again in a moment.",
      { status: 500 }
    );
  }
}