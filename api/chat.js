// Vercel serverless function: /api/chat
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY environment variable is not set" });
    }

    const formattedMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API Error:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const replyText = data?.choices?.[0]?.message?.content || "No text generated.";

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server failed to process request" });
  }
}
