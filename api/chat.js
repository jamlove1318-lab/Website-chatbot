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

    const formattedMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai-fast", // lighter free model, less congested
            messages: formattedMessages,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data?.choices?.[0]?.message?.content || "No text generated.";
          return res.status(200).json({ reply: replyText });
        }

        lastError = await response.text();

        // Only retry on 402/429/5xx — no point retrying a bad request
        if (![402, 429, 500, 502, 503].includes(response.status)) {
          return res.status(response.status).json({ error: lastError });
        }
      } catch (fetchErr) {
        lastError = fetchErr.message;
      }

      // wait a bit before retrying (500ms, 1000ms)
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }

    console.error("Pollinations failed after retries:", lastError);
    return res.status(503).json({
      error: "The free AI service is temporarily overloaded. Please try again in a moment.",
    });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server failed to process request" });
  }
}
