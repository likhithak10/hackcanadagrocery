import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./App.css"; // Import our CSS file

// MapView Component: Renders a Google Map with an autocomplete location input.
// When a location is searched (via autocomplete or Search button), it clears old markers and store list,
// then searches for the closest Walmart, No Frills, and Sobeys and pins them on the map.
function MapView({ onLocationChange, coords }) {
  const [map, setMap] = useState(null);
  const markersRef = useRef([]); // useRef to store markers without triggering re-renders

  // Load Google Maps API and initialize the map.
  useEffect(() => {
    const googleScript = document.createElement("script");
    // Replace with your actual API key
    googleScript.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyCodFuwZnIn1sJu08OdpieZsr2RH49kWG4&libraries=places";
    googleScript.async = true;
    googleScript.defer = true;
    googleScript.onload = initMap;
    document.head.appendChild(googleScript);

    function initMap() {
      const m = new window.google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.6532, lng: -79.3832 }, // Default: Toronto
        zoom: 13,
      });
      setMap(m);

      // Create a search box tied to the input element.
      const input = document.getElementById("location-input");
      const searchBox = new window.google.maps.places.SearchBox(input);

      // Bias results toward the current map's viewport.
      m.addListener("bounds_changed", () => {
        searchBox.setBounds(m.getBounds());
      });

      // When a user selects a prediction from the autocomplete dropdown.
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Clear old markers and store list.
        clearMarkers();
        clearStoreList();

        // Recenter the map.
        m.setCenter(place.geometry.location);
        m.setZoom(13);

        // Update parent's coordinates.
        if (onLocationChange) {
          onLocationChange(place.geometry.location);
        }
        // Perform nearby search for specific chains.
        performNearbySearch(place.geometry.location);
      }
    
    );

      
    }
  }, [onLocationChange]);
  //blonde
  // When parent's coords update, recenter the map.
  useEffect(() => {
    if (map && coords) {
      map.setCenter(coords);
      map.setZoom(13);
    }
  }, [map, coords]);

  // Remove existing markers from the map.
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  // Clear the store list.
  const clearStoreList = () => {
    const ul = document.getElementById("stores-ul");
    if (ul) ul.innerHTML = "";
  };

  // Append store details to the store list.
  const addStoreToList = (chainName, place) => {
    const ul = document.getElementById("stores-ul");
    if (ul) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${chainName}</strong>: ${place.name} - ${place.vicinity}`;
      ul.appendChild(li);
    }
  };

  // Search for a specific grocery chain near the given location.
  const searchForStore = (storeName, userLocation) => {
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: userLocation,
      rankBy: window.google.maps.places.RankBy.DISTANCE,
      keyword: storeName,
    };

    service.nearbySearch(request, (results, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        results &&
        results.length
      ) {
        // Filter results strictly to include the chain name.
        const filteredResults = results.filter((place) =>
          place.name.toLowerCase().includes(storeName.toLowerCase())
        );
        const place = filteredResults.length > 0 ? filteredResults[0] : results[0];

        const marker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: `${storeName}: ${place.name}`,
        });
        markersRef.current.push(marker);

        const infowindow = new window.google.maps.InfoWindow({
          content: `<strong>${storeName}</strong><br>${place.name}<br>${place.vicinity}`,
        });
        marker.addListener("click", () => {
          infowindow.open(map, marker);
        });

        addStoreToList(storeName, place);
      } else {
        console.log("No results found for " + storeName);
        addStoreToList(storeName, { name: "Not found", vicinity: "N/A" });
      }
    });
  };

  // Perform nearby search for the closest Walmart, No Frills, and Sobeys.
  const performNearbySearch = (userLocation) => {
    clearMarkers();
    clearStoreList();
    ["Walmart", "No Frills", "Sobeys"].forEach((chain) =>
      searchForStore(chain, userLocation)
    );
  };

  // Handler for the Search button click (manual address input).
  const handleSearchClick = () => {
    const address = document.getElementById("location-input").value;
    if (!address) {
      alert("Please enter a location.");
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const userLocation = results[0].geometry.location;
        clearMarkers();
        clearStoreList();
        map.setCenter(userLocation);
        map.setZoom(13);
        ["Walmart", "No Frills", "Sobeys"].forEach((chain) =>
          searchForStore(chain, userLocation)
        );
        if (onLocationChange) {
          onLocationChange(userLocation);
        }
      } else {
        alert("Geocode was not successful: " + status);
      }
    });
  };

  return (
    <div className="map-view">
      <div id="search-container">
        <input
          id="location-input"
          type="text"
          placeholder="Enter a location"
        />
        <button id="search-btn" onClick={handleSearchClick}>
          Search
        </button>
      </div>
      <div id="map"></div>
      <div id="store-list">
        <h2>Nearest Grocery Stores</h2>
        <ul id="stores-ul"></ul>
      </div>
    </div>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coords, setCoords] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch items from backend whenever coordinates change.
  useEffect(() => {
    setIsLoading(true);
    let url = "http://localhost:3001/api/items";
    if (coords) {
      url += `?lat=${coords.lat}&lng=${coords.lng}`;
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
  }, [coords]);

  // Use browser geolocation to update coordinates.
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

  // Filter items based on product search term.
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered items by name.
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
        image:
          storeEntries[0]?.image || "https://via.placeholder.com/150",
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
        <div className="leaves-container">
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
        </div>
      </header>

      <section className="location-section">
      <p className="app-description">
          Discover the cheapest prices for your essential groceries at the 3 most popular, money-saving grocery stores nearest to you.
        </p>
      </section>

      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
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

      {/* Render MapView with autocomplete and specific grocery chain search */}
      <MapView onLocationChange={setCoords} coords={coords} />

      <footer className="footer">
        <p>&copy; 2025 Grocery Price Watch. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
