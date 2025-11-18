import OpenAI from "openai";

const OPENAI_KEY =
  process.env.REACT_APP_OPENAI_API_KEY ||
  (typeof globalThis !== "undefined" ? globalThis.__VITE_OPENAI_API_KEY : "") ||
  "";

if (!OPENAI_KEY) {
  console.warn("OpenAI API key not set. Set VITE_OPENAI_API_KEY (Vite) or REACT_APP_OPENAI_API_KEY (CRA) in your .env");
}

const client = new OpenAI({
  apiKey: OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

export async function parseIntent(userText) {
  const prompt = `
You are an intent parser for a prediction market.
Convert this user request into structured JSON:
{
  "action": "create_market" | "place_bet",
  "token": string,
  "amount": number,
  "condition": string,
  "target": number,
  "date": string (ISO),
  "outcome": "YES" | "NO"
}

User: "${userText}"
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return only JSON, no explanation." },
      { role: "user", content: prompt },
    ],
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch (e) {
    console.error("Failed to parse intent:", e);
    return null;
  }
}

export async function analyzeMarket(intent, marketData) {
  const prompt = `
You are a market analyst AI. Evaluate this intent using market data.

Intent:
${JSON.stringify(intent, null, 2)}

Market Data:
${JSON.stringify(marketData, null, 2)}

Return JSON:
{
  "confidence": number (0-1),
  "summary": string,
  "suggestedAction": "YES" | "NO" | "SKIP"
}
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return only JSON." },
      { role: "user", content: prompt },
    ],
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch (e) {
    console.error("Failed to parse market analysis:", e);
    return null;
  }
}
