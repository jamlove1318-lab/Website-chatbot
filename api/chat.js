import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS Headers
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
    }

    // Initialize Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Separate conversation history from the latest prompt
    const historyMessages = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1];

    // Format history for the SDK
    const formattedHistory = historyMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Start chat session with formatted history
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send latest message
    const result = await chat.sendMessage(latestMessage.content);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (err) {
    console.error("Gemini SDK Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate response" });
  }
}
