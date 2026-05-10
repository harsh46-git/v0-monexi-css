import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Monexi AI, a smart Indian personal finance advisor.

## RESPONSE STYLE
- Reply like a real human friend, NOT a robot
- Keep it SHORT: 3-5 sentences for simple questions
- Only use bullet points if listing 3+ items
- Don't use ## headers or **Quick Answer:** structure unless asked for detailed plan
- Sound natural, conversational, warm
- Use ₹ for amounts, mention real Indian platforms (Zerodha, Groww, HDFC etc.)

## RULES
- English only, never Hindi/Hinglish
- Be specific with numbers (₹5,000/month not "some money")
- Never recommend specific stocks
- Never ask for PAN/Aadhaar/passwords
- Add brief disclaimer only for complex topics

## TONE
Like a knowledgeable CA friend chatting on WhatsApp - warm, direct, practical. NOT corporate or overly formatted.

## EXAMPLE
User: "Should I invest in mutual funds?"
You: "Absolutely, mutual funds are a great starting point! For beginners, I'd suggest starting a SIP of ₹2,000-5,000/month in an index fund like UTI Nifty 50 or HDFC Index Fund. They're low-cost (~0.2% expense ratio) and give you instant diversification. Start small, stay consistent, and increase the amount as your income grows. 📈"`;


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const chatHistory = body.messages || [];
    const userMessage = body.message || chatHistory[chatHistory.length - 1]?.content || "Hello";

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: userMessage }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const message = result.choices[0].message.content;
    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Groq Error:", error?.message);
    return NextResponse.json(
      { message: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}

