const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());

// ------------------ Load Mock Data ------------------
const dataPath = path.join(__dirname, "groceryData.json");
let groceryData = [];

try {
  const rawData = fs.readFileSync(dataPath, "utf-8");
  groceryData = JSON.parse(rawData);
  console.log("Loaded data:", groceryData);
} catch (error) {
  console.error("Error loading groceryData.json:", error);
}

// ------------------ Basic Endpoint ------------------
app.get("/api/items", (req, res) => {
  // Returns the entire array of items
  res.json(groceryData);
});

// ------------------ Best Deals Endpoint ------------------
app.get("/api/best-deals", (req, res) => {
  // 1. Group items by name
  const grouped = {};
  groceryData.forEach((item) => {
    // Exclude out-of-stock if you want (optional)
    if (item.availability === "Out of Stock") return;
    
    if (!grouped[item.name]) {
      grouped[item.name] = [];
    }
    grouped[item.name].push(item);
  });

  // 2. For each group, find the best price (lowest), check if exclusive or multiple
  const bestDeals = [];

  for (const itemName in grouped) {
    const storeEntries = grouped[itemName];

    // Sort by ascending price
    storeEntries.sort((a, b) => a.price - b.price);

    // The best deal is the first in the sorted array
    const best = storeEntries[0];

    if (storeEntries.length === 1) {
      // Exclusive: Only one store in stock
      bestDeals.push({
        name: itemName,
        bestStore: best.store,
        bestPrice: best.price,
        exclusive: true,
        message: `Exclusive at ${best.store}`
      });
    } else {
      // Multiple stores
      const secondBest = storeEntries[1];
      const priceDifference = secondBest.price - best.price;

      bestDeals.push({
        name: itemName,
        bestStore: best.store,
        bestPrice: best.price,
        exclusive: false,
        secondBestStore: secondBest.store,
        secondBestPrice: secondBest.price,
        priceDifference: priceDifference.toFixed(2),
        message: `Best price at ${best.store} ($${best.price}). Next best: ${secondBest.store} ($${secondBest.price})`
      });
    }
  }

  res.json(bestDeals);
});

// ------------------ Root Route (Optional) ------------------
app.get("/", (req, res) => {
  res.send("Welcome to the Grocery Compare API!");
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
