// Vercel serverless function: /api/chat
export default async function handler(req, res) {
  // Set CORS headers
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

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Convert messages to OpenAI-style format that Pollinations expects
    const formattedMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    // Pollinations anonymous text API — no API key required, free
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai", // free anonymous model
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations API Error:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const replyText =
      data?.choices?.[0]?.message?.content || "No text generated.";

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server failed to process request" });
  }
}
