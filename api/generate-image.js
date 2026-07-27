// Vercel serverless function: /api/generate-image
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A text prompt is required" });
    }

    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

    const response = await fetch(imageUrl);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations Image API Error:", errText);
      return res.status(response.status).json({ error: "Image generation failed" });
    }

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    return res.status(200).json({ data: base64Data, mimeType });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server failed to generate image" });
  }
}
