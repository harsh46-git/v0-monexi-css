import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { goalName, goalPrice, monthlySavings } = await req.json();

    const prompt = `You are Monexi AI, a smart and polite financial advisor for Indian users.
User wants to buy: ${goalName}
Price: ₹${goalPrice}
User's Monthly Savings: ₹${monthlySavings}
Give 2 short sentences of advice in Hinglish.`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const advice = result.choices[0].message.content;
    return NextResponse.json({ advice });
  } catch (error) {
    return NextResponse.json({ advice: "AI is thinking... please try again." }, { status: 500 });
  }
}
