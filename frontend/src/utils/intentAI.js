import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // only for local dev — use backend proxy in prod
});

// Step 1: Parse user intent into JSON
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
    console.error("⚠️ Failed to parse intent:", e);
    return null;
  }
}

// Step 2: AI market analysis
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
    console.error("⚠️ Failed to parse market analysis:", e);
    return null;
  }
}
