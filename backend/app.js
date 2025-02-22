const express = require('express');
const app = express();

// Your static test data
const testData = [
  {
    "name": "Milk 2L",
    "store": "Store A",
    "price": 3.49,
    "availability": "In Stock"
  },
  {
    "name": "Chocolate Milk 2L",
    "store": "Store A",
    "price": 4.80,
    "availability": "In Stock"
  },
  {
    "name": "Milk 2L",
    "store": "Store B",
    "price": 3.49,
    "availability": "In Stock"
  },
  {
    "name": "Milk 2L",
    "store": "Store C",
    "price": 3.29,
    "availability": "In Stock"
  }
];

// Define a GET endpoint that returns the test data
app.get('/api/items', (req, res) => {
  res.json(testData);
});

// Start the server on port 3001 (or your preferred port)
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
