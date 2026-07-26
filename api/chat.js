// Vercel serverless function: /api/chat
// Uses Google's Gemini API (free tier) instead of the paid Claude API.
// Your Gemini API key stays here on the server, never exposed to visitors.

const GEMINI_MODEL = "gemini-flash-latest"; // always points to Google's current stable Flash model

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Gemini uses "user"/"model" roles. Each message can carry text and/or
    // an attached photo/video, sent from the frontend as base64 + mimeType.
    const contents = messages.map((m) => {
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      if (m.file) {
        parts.push({
          inlineData: {
            mimeType: m.file.mimeType,
            data: m.file.data, // base64 string, no data: prefix
          },
        });
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
