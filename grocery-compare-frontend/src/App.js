import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css"; // Import our CSS file

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch items whenever the location or manual input changes.
  useEffect(() => {
    setIsLoading(true);
    let url = "http://localhost:3001/api/items";
    if (coords) {
      url += `?lat=${coords.lat}&lng=${coords.lng}`;
    } else if (userLocation) {
      url += `?location=${encodeURIComponent(userLocation)}`;
    }
    axios
      .get(url)
      .then((response) => {
        setItems(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setIsLoading(false);
      });
  }, [coords, userLocation]);

  // Use browser geolocation API to get current location.
  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching geolocation:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  // Filter items based on the search term.
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group items by name for best-price logic.
  const groupedItems = filteredItems.reduce((acc, item) => {
    const key = item.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  // For each group, determine the best deal.
  const itemsWithBestPrice = Object.keys(groupedItems).map((name) => {
    const storeEntries = groupedItems[name];
    const available = storeEntries.filter(
      (entry) => entry.availability !== "Out of Stock"
    );
    if (available.length === 0) {
      return {
        name,
        bestStore: null,
        bestPrice: null,
        availability: "Out of Stock Everywhere",
        allStores: storeEntries,
        image: storeEntries[0]?.image || "https://via.placeholder.com/150",
      };
    }
    available.sort((a, b) => a.price - b.price);
    const best = available[0];
    return {
      name,
      bestStore: best.store,
      bestPrice: best.price,
      availability:
        available.length === 1
          ? `Exclusive at ${best.store}`
          : `Available at multiple stores`,
      allStores: storeEntries,
      image: best.image || "https://via.placeholder.com/150",
    };
  });

  // Toggle dark mode.
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      <header className="header">
        <h1>Grocery Price Watch</h1>
        <div className="header-controls">
          <h2>Best Deals of Today Near You</h2>
          <button className="mode-toggle" onClick={toggleDarkMode}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        {/* Flying Leaves Animation */}
        <div className="leaves-container">
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
        </div>
      </header>

      <section className="location-section">
        <div className="location-input">
          <input
            type="text"
            placeholder="Enter your location..."
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
          />
          <button onClick={fetchCurrentLocation}>
            Use My Current Location
          </button>
        </div>
        <div className="search-input">
          <input
            type="text"
            placeholder="Search item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Best Deals Gallery Section */}
          <section className="deals-gallery">
            <h2>Best Deals Gallery</h2>
            <div className="gallery-grid">
              {itemsWithBestPrice.map((item) => (
                <div key={item.name} className="gallery-card">
                  <img src={item.image} alt={item.name} />
                  <div className="deal-info">
                    <h4>{item.name}</h4>
                    {item.bestPrice !== null ? (
                      <p>
                        Only ${item.bestPrice} at {item.bestStore}
                      </p>
                    ) : (
                      <p>{item.availability}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed Items Section */}
          <section className="items-section">
            {itemsWithBestPrice.map((item) => (
              <div key={item.name} className="item-card">
                <h3>{item.name}</h3>
                {item.bestPrice !== null ? (
                  <>
                    <p>
                      <span className="label">Best Price:</span> ${item.bestPrice}{" "}
                      <span className="store-name">at {item.bestStore}</span>
                    </p>
                    <p className="availability">{item.availability}</p>
                    <details className="details">
                      <summary>Show all store prices</summary>
                      <ul>
                        {item.allStores.map((s, idx) => (
                          <li key={idx}>
                            {s.store}: ${s.price} ({s.availability})
                          </li>
                        ))}
                      </ul>
                    </details>
                  </>
                ) : (
                  <p className="availability">{item.availability}</p>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      <footer className="footer">
        <p>&copy; 2025 Grocery Price Watch. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
