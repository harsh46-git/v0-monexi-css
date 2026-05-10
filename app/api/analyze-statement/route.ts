import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfData } = body;

    if (!pdfData) {
      return NextResponse.json({ error: "No PDF provided" }, { status: 400 });
    }

    const { extractText } = await import("unpdf");
    const buffer = Buffer.from(pdfData, "base64");
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    
    // INCREASED LIMIT: Llama 3.3 70B has a massive context window. 
    // 6000 chars is too small for a bank statement. We bump this to 40,000 to capture the whole month.
    const extractedText = text?.substring(0, 18000) || "";

    const systemPrompt = `
      You are an expert financial data extraction AI specializing in Indian Bank Statements.
      Analyze the provided raw text and extract the data into the exact JSON schema requested.
      
      CRITICAL RULES FOR ACCURACY:
      1. UNDERSTAND CREDITS VS DEBITS: Look for keywords like "CR", "Deposit", or "Credit" for income. Look for "DR", "Withdrawal", "Debit", "UPI", "POS" for expenses.
      2. MATH ACCURACY: Try to find the "Summary" section of the statement (often at the top or bottom) that lists "Total Withdrawals" and "Total Deposits" to populate 'total_spent' and 'total_income'. If not found, carefully estimate by looking at the largest transactions.
      3. SAVINGS RATE: Calculate as ((Total Income - Total Spent) / Total Income) * 100. If Spent > Income, this must be a negative number.
      4. CATEGORIES: Map expenses logically.
         - Zomato/Swiggy/Zepto/Restaurants -> "Food & Dining"
         - Amazon/Flipkart/Myntra/POS -> "Shopping"
         - Uber/Ola/IRCTC/MakeMyTrip -> "Travel"
         - Rent/Electricity/Jio/Airtel/Broadband -> "Rent & Bills"
         - Unknown UPI transfers -> "Others"
      5. TRANSACTIONS: Extract the 5-8 most significant or recent transactions. Ensure 'type' is strictly "CREDIT" or "DEBIT".
      
      RETURN ONLY VALID JSON WITH THIS EXACT STRUCTURE:
      {
        "data": {
          "summary": { "total_spent": 0, "total_income": 0, "savings_rate": 0, "risk_score": "Low|Medium|High" },
          "categories": [
            { "name": "Rent & Bills", "amount": 0, "color": "#10B981" },
            { "name": "Food & Dining", "amount": 0, "color": "#F59E0B" },
            { "name": "Travel", "amount": 0, "color": "#3B82F6" },
            { "name": "Shopping", "amount": 0, "color": "#EC4899" },
            { "name": "Others", "amount": 0, "color": "#8B5CF6" }
          ],
          "insights": ["3 sharp, actionable financial insights based on their specific spending habits"],
          "recent_transactions": [
            { "date": "DD-MM-YYYY", "desc": "Cleaned up merchant name", "amount": 0, "type": "DEBIT|CREDIT", "category": "Category Name" }
          ]
        }
      }
    `;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Raw Bank Statement Text:\n\n${extractedText}` }
      ],
      // Increased max_tokens to ensure the JSON doesn't get cut off mid-generation
      max_tokens: 1500, 
      temperature: 0.1, // Keep it low for analytical consistency
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(result.choices[0].message.content || "{}");
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Error analyzing statement:", error?.message);
    return NextResponse.json({ error: "Failed to process PDF." }, { status: 500 });
  }
}