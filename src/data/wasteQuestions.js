const createQuestions = (items, correct, explanation, categoryName, ecoFact) =>
  items.map((item) => ({
    id: `${correct}-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
    item: item.icon,
    name: item.name,
    correct,
    categoryName,
    explanation: item.fact ? `${explanation} ${item.fact}` : explanation,
    ecoFact: item.fact || ecoFact,
  }));

// 🟢 WET / BIODEGRADABLE WASTE (Green Bin)
const greenItems = [
  { icon: "🍌", name: "Banana Peel", fact: "Banana peels decompose in 2-5 weeks and enrich soil with potassium & phosphorus!" },
  { icon: "🍎", name: "Apple Core", fact: "Fruit scraps break down into nutrient-rich compost within 1-2 months." },
  { icon: "🍊", name: "Orange Peel", fact: "Citrus peels add natural oils and nutrients to organic compost heaps." },
  { icon: "🥔", name: "Potato Peel", fact: "Kitchen vegetable peels are 100% biodegradable organic waste." },
  { icon: "🥬", name: "Vegetable Peels", fact: "Raw vegetable scraps decompose rapidly and make ideal organic fertilizer." },
  { icon: "🍞", name: "Leftover Food", fact: "Cooked food scraps should go to wet waste or community bio-gas digesters." },
  { icon: "🥚", name: "Egg Shells", fact: "Eggshells provide essential calcium to compost and garden soil!" },
  { icon: "☕", name: "Coffee Grounds", fact: "Coffee grounds add nitrogen to soil and attract beneficial earthworms." },
  { icon: "🍵", name: "Used Tea Leaves", fact: "Natural tea leaves decompose quickly without harming natural ecosystems." },
  { icon: "🍂", name: "Fallen Leaves", fact: "Dry garden leaves break down into humus, enriching soil structure." },
  { icon: "🌸", name: "Dead Flowers", fact: "Floral waste is organic and can be composted into natural fertilizer." },
  { icon: "🥜", name: "Peanut Shells", fact: "Nut shells act as natural carbon sources for healthy compost balance." },
];

// 🔵 DRY / RECYCLABLE WASTE (Blue Bin)
const blueItems = [
  { icon: "📰", name: "Newspaper", fact: "Recycling 1 ton of newspaper saves 17 mature trees and 7,000 gallons of water!" },
  { icon: "📦", name: "Cardboard Box", fact: "Cardboard can be recycled up to 7 times to manufacture new packaging." },
  { icon: "🧴", name: "Plastic Bottle", fact: "A plastic bottle takes up to 450 years to decompose in landfills if not recycled!" },
  { icon: "🥫", name: "Aluminium Can", fact: "Aluminium can be recycled indefinitely without losing any quality!" },
  { icon: "🫙", name: "Glass Bottle", fact: "Glass is 100% recyclable and can be melted down endlessly into new glass products." },
  { icon: "🥤", name: "Clean Plastic Cup", fact: "Rinse plastic containers before recycling so they don't contaminate paper bins." },
  { icon: "📖", name: "Old Books", fact: "Paper from books can be processed into recycled paper napkins and tissues." },
  { icon: "🧃", name: "Clean Juice Carton", fact: "Juice cartons contain paper fibers and plastic coatings processed in special plants." },
  { icon: "👕", name: "Old Clothes", fact: "Textiles can be recycled into new yarn, insulation, or donated for re-use." },
  { icon: "🛍️", name: "Clean Plastic Bag", fact: "Clean plastic bags are melted into plastic pellets to make eco-bricks or pipes." },
];

// 🔴 HAZARDOUS / MEDICAL WASTE (Red Bin)
const redItems = [
  { icon: "💉", name: "Used Syringe", fact: "Medical sharps MUST go in red bins to prevent accidental needle pricks and infection." },
  { icon: "🩹", name: "Used Bandage", fact: "Contaminated medical dressings require bio-hazard incineration." },
  { icon: "💊", name: "Expired Medicine", fact: "Never flush old pills down the drain! They contaminate rivers and drinking water." },
  { icon: "😷", name: "Medical Mask", fact: "Used face masks carry germs and pathogens, requiring special medical disposal." },
  { icon: "🧪", name: "Chemical Waste", fact: "Household chemicals can leak toxic heavy metals into soil if dumped in normal bins." },
  { icon: "☠️", name: "Pesticide Container", fact: "Pesticide bottles leave toxic residue and must be handled by hazardous waste facilities." },
  { icon: "🎨", name: "Paint Can", fact: "Oil-based paints release dangerous volatile organic compounds (VOCs)." },
  { icon: "🌡️", name: "Broken Thermometer", fact: "Mercury thermometers contain toxic liquid metal that damages the nervous system." },
];

// ⚡ E-WASTE (Yellow/Purple Bin)
const ewasteItems = [
  { icon: "💻", name: "Old Laptop", fact: "E-waste contains valuable gold, silver, and copper alongside hazardous lead!" },
  { icon: "📱", name: "Broken Smartphone", fact: "Recycling 1 million smartphones recovers 35,000 lbs of copper & 772 lbs of silver!" },
  { icon: "🔋", name: "Electronic Battery", fact: "Batteries leak lithium, cadmium, and acid into groundwater if thrown in regular trash!" },
  { icon: "🔌", name: "Power Charger", fact: "Copper cables inside chargers are highly recyclable at designated e-waste centers." },
  { icon: "💡", name: "LED Bulb", fact: "Fluorescent and LED lights contain electronic circuits that require e-waste recycling." },
  { icon: "🎧", name: "Broken Headphones", fact: "Headphones contain neodymium magnets and wiring that can be reclaimed." },
  { icon: "🖥️", name: "Computer Monitor", fact: "Monitors contain heavy metals and circuit boards that pollute soil when dumped." },
  { icon: "🖨️", name: "Printer Cartridge", fact: "Printer cartridges can be refilled or recycled to reduce plastic micro-waste." },
];

const greenQuestions = createQuestions(
  greenItems,
  "green",
  "This is organic / wet waste. It can be converted into bio-compost or biogas.",
  "Green Bin (Wet / Organic)",
  "Composting organic kitchen waste reduces landfill methane gas emissions!"
);

const blueQuestions = createQuestions(
  blueItems,
  "blue",
  "This is dry / recyclable waste. Keep it clean and dry so it can be re-processed into new products.",
  "Blue Bin (Dry / Recyclable)",
  "Recycling paper and plastic conserves natural raw materials and energy!"
);

const redQuestions = createQuestions(
  redItems,
  "red",
  "This is hazardous / medical waste. Requires special handling to prevent pollution and infection.",
  "Red Bin (Hazardous / Medical)",
  "Proper disposal of medical & chemical waste protects sanitation workers from harm!"
);

const ewasteQuestions = createQuestions(
  ewasteItems,
  "ewaste",
  "This is electronic waste (E-Waste). Take it to authorised e-waste collection centers.",
  "E-Waste Bin (Electronics)",
  "E-waste recycling prevents toxic heavy metal contamination in rivers and soil!"
);

export const wasteItems = [
  ...greenQuestions,
  ...blueQuestions,
  ...redQuestions,
  ...ewasteQuestions,
];

export default wasteItems;