import { CONFIG } from "./config";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const PROMPT = `You are a municipal waste-sorting assistant for an Indian city cleanliness app.
Look at this photo of waste/garbage in a public place and respond with ONLY a JSON object
(no markdown, no code fences) with these exact keys:
{
  "waste_type": "short name of the waste, e.g. 'Mixed plastic and food waste'",
  "category": "one of: Biodegradable, Non-biodegradable, Hazardous, Construction debris, E-waste, Mixed",
  "suggested_bin": "which color dustbin it should go in (India norm: Green = wet/biodegradable, Blue = dry/recyclable, Red = hazardous/biomedical, Black = domestic hazardous)",
  "hazard_tips": "one short sentence on any handling precaution, or 'None' if not needed",
  "description": "one short sentence describing the scene, written as if a citizen reported it"
}`;

export async function analyzeWasteImage(file) {
  if (!CONFIG.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not set (VITE_GEMINI_API_KEY in .env)");
  }
  const base64 = await fileToBase64(file);
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: file.type || "image/jpeg", data: base64 } },
        ],
      },
    ],
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error("Gemini API error: " + t.slice(0, 200));
  }
  const data = await resp.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  text = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(text);
}
