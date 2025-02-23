// src/App.js
import React, { useState } from "react";
import MapView from "./Map";
import AllProducts from "./AllProducts";
import BestDeals from "./BestDeals";
import "./App.css"; // Our CSS file

function App() {
  // Track whether user has entered an address
  const [addressEntered, setAddressEntered] = useState(false);
  // Track which tab is active: "map", "all", or "deals"
  const [activeTab, setActiveTab] = useState("map");

  // Called when user successfully searches an address
  const handleAddressSubmit = () => {
    setAddressEntered(true);
  };

  // If no address yet, show only map search with a prompt
  if (!addressEntered) {
    return (
      <div className="app-container">
        <h1>Grocery Price Watch</h1>
        <p>Please enter your address to see products and deals.</p>
        <MapView onAddressSubmit={handleAddressSubmit} />
      </div>
    );
  }

  // Once address is entered, show tab buttons + tab content
  return (
    <div className="app-container">
      <h1>Grocery Price Watch</h1>

      <div className="tab-buttons">
        <button
          onClick={() => setActiveTab("map")}
          disabled={activeTab === "map"}
        >
          Map
        </button>
        <button
          onClick={() => setActiveTab("all")}
          disabled={activeTab === "all"}
        >
          All Products
        </button>
        <button
          onClick={() => setActiveTab("deals")}
          disabled={activeTab === "deals"}
        >
          Best Deals
        </button>
      </div>

      {activeTab === "map" && <MapView />}
      {activeTab === "all" && <AllProducts />}
      {activeTab === "deals" && <BestDeals />}
    </div>
  );
}

export default App;
