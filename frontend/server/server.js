import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
// import * as chrono from "chrono-node"; 

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// helper: extract JSON from completion text (handles ```json blocks or plain JSON)
function extractJsonFromText(text) {
  if (!text || typeof text !== "string") throw new Error("No text to parse");
  // first look for fenced JSON block: ```json ... ``` or ``` ... ```
  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = text.match(fenceRe);
  const candidate = m ? m[1].trim() : text.trim();
  // try direct JSON.parse, else try to find first {...} substring
  try {
    return JSON.parse(candidate);
  } catch (err) {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw err;
  }
}


// ✅ 1. Intent route
app.post("/api/intent", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text input" });

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
Extract market creation intent from this text: "${text}"
Return JSON fields:
{ "question": string, "yesName": string, "noName": string, "expiry": unix timestamp, "asset": string, "comparator": string, "value": number, "rawText": string }
      `,
      text: { format: { type: "text" } },
    });

    const rawText = completion.output_text ?? completion.output?.map(o => o.content?.map(c => c.text || "").join("") ).join("\n") ?? "";
    const result = extractJsonFromText(rawText);
    return res.json({ intent: result });
  } catch (err) {
    console.error("❌ Intent parsing failed:", err);
    res.status(500).json({ error: "Failed to parse intent" });
  }
});

// ✅ 2. AI Market Analysis route
app.post("/api/analyze", async (req, res) => {
  try {
    const { asset, question } = req.body;

    if (!asset && !question) {
      return res.status(400).json({ error: "Missing asset or question" });
    }

    const prompt = `
You are an on-chain AI analyst.
Analyze short-term market sentiment and prediction for ${asset || "this asset"}.
Focus on:
1. Trend direction (bullish, bearish, or neutral)
2. Key reasons (on-chain activity, price trend, sentiment)
3. 1-sentence summary for a prediction market user.

Question: "${question}"
Return a JSON object like:
{ "trend": "bullish", "confidence": 0.83, "summary": "ETH likely to rise above $3000 by December due to strong network momentum." }
`;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: { type: "text" } },
    });

    const rawText = completion.output_text ?? completion.output?.map(o => o.content?.map(c => c.text || "").join("") ).join("\n") ?? "";
    const analysis = extractJsonFromText(rawText);
    res.json({ analysis });
  } catch (err) {
    console.error("❌ AI analysis failed:", err);
    res.status(500).json({ error: "AI analysis failed" });
  }
  
});

// ✅ 3. Start the server
app.listen(5000, () => console.log("✅ Server running on port 5000"));
