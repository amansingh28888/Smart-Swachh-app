import { CONFIG } from "./config";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();

    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;

    r.readAsDataURL(file);
  });
}


// ===============================
// IMAGE WASTE ANALYSIS PROMPT
// ===============================

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
    throw new Error(
      "Gemini API key is not set (VITE_GEMINI_API_KEY in .env)"
    );
  }

  const base64 = await fileToBase64(file);

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },

          {
            inline_data: {
              mime_type: file.type || "image/jpeg",
              data: base64,
            },
          },
        ],
      },
    ],
  };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  const resp = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text();

    throw new Error(
      "Gemini API error: " + t.slice(0, 200)
    );
  }

  const data = await resp.json();

  let text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "{}";

  text = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(text);
}


// ==========================================
// SMARTSWACHH AI CHATBOT
// ==========================================

const CHATBOT_PROMPT = `
You are SmartSwachh AI Assistant, an intelligent waste management assistant
for SmartSwachh, an Indian smart waste management platform.

Your role is to help citizens understand:

- Waste segregation
- Recycling
- Plastic waste
- Wet and dry waste
- E-waste
- Medical waste
- Hazardous waste
- Composting
- Proper waste disposal
- Cleanliness and sustainability
- How to report waste using the SmartSwachh platform

Important rules:

1. Give accurate, simple and practical answers.
2. Focus mainly on Indian waste management practices.
3. Keep answers concise and easy to understand.
4. Use emojis occasionally to make answers friendly.
5. Do not provide dangerous instructions.
6. If someone asks something unrelated to waste management,
politely tell them that you specialize in waste management.
7. Do not claim to be a human.

You are helpful, friendly and environmentally conscious.
`;


// Local intelligent fallback engine when offline or API key isn't provided
const getLocalWasteAdvice = (query) => {
  const q = query.toLowerCase();

  if (q.includes("plastic") || q.includes("bottle") || q.includes("wrapper") || q.includes("polythene")) {
    return `### 🔵 Dry Waste / Recyclable (Blue Bin)
- **Bottles & Containers**: Rinse thoroughly, crush, and place in the **Blue Bin** 🔵.
- **Single-use plastics**: Avoid where possible. Thin polythene bags should be bundled clean for municipal plastic recycling.
- **Milk Packets**: Wash with a splash of water, dry, and put into dry recyclables.
💡 *Tip: Clean, dry plastic has 10x higher chance of being mechanically recycled!*`;
  }

  if (q.includes("wet") || q.includes("food") || q.includes("kitchen") || q.includes("organic") || q.includes("peel") || q.includes("vegetable") || q.includes("fruit")) {
    return `### 🟢 Wet / Biodegradable Waste (Green Bin)
- **Kitchen Scraps**: Vegetable and fruit peels, tea leaves, eggshells, and leftover cooked food go into the **Green Bin** 🟢.
- **Garden Waste**: Fallen leaves, grass clippings, and small twigs can also be composted.
- **Important**: Do NOT throw plastics, wrappers, or foil inside the green bin.
🌱 *Tip: Starting a home compost pit turns this waste into nutrient-rich organic fertilizer in 4-6 weeks!*`;
  }

  if (q.includes("medical") || q.includes("syringe") || q.includes("needle") || q.includes("medicine") || q.includes("bandage") || q.includes("hazard") || q.includes("chemical") || q.includes("paint")) {
    return `### 🔴 Hazardous & Medical Waste (Red Bin)
- **Medical Sharps**: Used needles & syringes must be placed in puncture-proof containers and handed over for biomedical disposal in the **Red Bin** 🔴.
- **Expired Medicines**: Never flush pills into sinks or toilets! Return them to pharmacies with medicine take-back or mark as domestic hazardous.
- **Paints & Insecticides**: Must be handed over separately to prevent ground and water toxicity.
⚠️ *Precaution: Always wrap contaminated dressings safely to protect our sanitation heroes.*`;
  }

  if (q.includes("e-waste") || q.includes("ewaste") || q.includes("phone") || q.includes("laptop") || q.includes("battery") || q.includes("charger") || q.includes("bulb") || q.includes("electronic")) {
    return `### ⚡ Electronic Waste (E-Waste Facility)
- **Batteries & Gadgets**: Batteries leak lithium, lead, and acid! Store them safely in a dry cardboard box.
- **Old Phones & Chargers**: Hand them over at authorised municipal E-Waste collection centers or deposit kiosks.
- **Fluorescent & LED Bulbs**: Contain sensitive circuitry and trace metals—deposit at certified e-waste bins.
♻️ *Fact: 1 million recycled smartphones can recover over 35,000 lbs of copper and 770 lbs of silver!*`;
  }

  if (q.includes("report") || q.includes("complaint") || q.includes("how to report") || q.includes("app") || q.includes("smartswachh")) {
    return `### 📸 How to Report Waste on SmartSwachh:
1. Tap the **"Report Waste"** button on your Citizen Dashboard.
2. Snap or upload a photo of the garbage pile.
3. Our **AI Detection** instantly recognizes the waste type and suggests the proper bin!
4. Confirm your GPS location and hit **Submit**.
5. You can track municipal worker assignment in real-time until resolution! 🚚✨`;
  }

  if (q.includes("compost") || q.includes("khad")) {
    return `### 🌿 Quick Home Composting Guide:
1. **Layer Brown & Green**: Mix green waste (fruit peels, tea leaves) with brown waste (dry leaves, shredded cardboard).
2. **Moisture Balance**: Keep it damp like a wrung-out sponge, but never dripping wet.
3. **Aeration**: Stir once a week to let oxygen reach beneficial aerobic microbes.
4. In 30–45 days, you'll have dark, earthy organic compost for your plants!`;
  }

  return `### ♻️ SmartSwachh Waste Segregation Guidelines:
- 🟢 **Green Bin (Wet Waste)**: Kitchen leftovers, fruit peels, eggshells, fallen leaves.
- 🔵 **Blue Bin (Dry Waste)**: Cardboard, paper, clean plastics, glass, metals.
- 🔴 **Red Bin (Hazardous/Medical)**: Syringes, expired medicines, sanitary waste, chemical containers.
- ⚡ **E-Waste**: Electronics, cables, batteries, and chargers.

What specific item would you like to sort today? Just type the item name (e.g., *"pizza box"*, *"milk pouch"*, *"AA battery"*)!`;
};

export async function askWasteAssistant(question, history = []) {
  if (!CONFIG.GEMINI_API_KEY) {
    // Provide comprehensive intelligent fallback when API key is unconfigured
    return getLocalWasteAdvice(question);
  }

  const historyContext = history.slice(-6).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");

  const body = {
    contents: [
      {
        parts: [
          {
            text: `${CHATBOT_PROMPT}

Previous Conversation Context:
${historyContext || "None"}

Current User Question:
${question}

Provide an engaging, helpful, and concise answer with Markdown headings and bullet points. Highlight the correct bin (🟢 Green Bin, 🔵 Blue Bin, 🔴 Red Bin, or ⚡ E-Waste) where applicable.

Answer:`,
          },
        ],
      },
    ],
  };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.warn("Gemini API call returned non-OK, using intelligent fallback.");
      return getLocalWasteAdvice(question);
    }

    const data = await resp.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return getLocalWasteAdvice(question);
    }

    return answer.trim();
  } catch (err) {
    console.warn("Gemini API error, falling back to local waste intelligence:", err);
    return getLocalWasteAdvice(question);
  }
}

// ==========================================
// PREDICTIVE AI ANALYTICS (ADMIN)
// ==========================================

export async function generatePredictiveInsights(reports) {
  if (!CONFIG.GEMINI_API_KEY) {
    return "Gemini API key is required for predictive insights. Please configure VITE_GEMINI_API_KEY in your .env file.";
  }

  // Summarize recent active reports to send to Gemini
  const activeReports = reports.filter(r => r.status !== 'completed' && r.status !== 'approved');
  const summary = activeReports.slice(0, 20).map(r => 
    `- Category: ${r.category}, Status: ${r.status}, Location: Lat ${r.location_lat?.toFixed(4)}, Lng ${r.location_lng?.toFixed(4)}`
  ).join("\n");

  const prompt = `You are an AI Analytics engine for SmartSwachh waste management platform.
Analyze the following active waste reports and provide a short, single-paragraph predictive insight (max 3 sentences) for the municipal admin. 
Identify any critical clusters or patterns, and suggest an actionable priority.

Recent Active Reports Data:
${summary || "No active reports."}

Insight:`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error("Failed to fetch insights");
    }

    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Predictive AI error:", error);
    return "Predictive analytics temporarily unavailable due to a connection error.";
  }
}