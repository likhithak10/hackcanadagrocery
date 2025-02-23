// MapView.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css"; // or any CSS file you prefer

function MapView({ onAddressSubmit, onLocationChange }) {
  const [map, setMap] = useState(null);
  const markersRef = useRef([]); // Store references to markers

  useEffect(() => {
    // Dynamically load Google Maps script
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

      // Autocomplete for the input
      const input = document.getElementById("location-input");
      const searchBox = new window.google.maps.places.SearchBox(input);

      // Bias results toward current map's viewport
      m.addListener("bounds_changed", () => {
        searchBox.setBounds(m.getBounds());
      });

      // When user selects an autocomplete prediction
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Recenter the map
        m.setCenter(place.geometry.location);
        m.setZoom(13);

        // Clear old markers + store list
        clearMarkers();
        clearStoreList();

        // Search for Walmart, Sobeys, No Frills near the new location
        performNearbySearch(place.geometry.location);

        // Inform parent
        if (onLocationChange) onLocationChange(place.geometry.location);
        if (onAddressSubmit) onAddressSubmit();
      });
    }
  }, [onAddressSubmit, onLocationChange]);

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  // Clear the store list <ul>
  const clearStoreList = () => {
    const ul = document.getElementById("stores-ul");
    if (ul) ul.innerHTML = "";
  };

  // Add a store line to the list
  const addStoreToList = (chainName, place) => {
    const ul = document.getElementById("stores-ul");
    if (!ul) return;
    const li = document.createElement("li");
    li.innerHTML = `<strong>${chainName}</strong>: ${
      place.name || "Not found"
    } - ${place.vicinity || "N/A"}`;
    ul.appendChild(li);
  };

  // Search for a specific chain near the given location
  const searchForStore = (chainName, userLocation) => {
    if (!map) return;
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: userLocation,
      rankBy: window.google.maps.places.RankBy.DISTANCE,
      keyword: chainName,
    };

    service.nearbySearch(request, (results, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        results &&
        results.length
      ) {
        // Optionally filter strictly by chain name
        const filtered = results.filter((p) =>
          p.name.toLowerCase().includes(chainName.toLowerCase())
        );
        const place = filtered.length > 0 ? filtered[0] : results[0];

        // Create a marker
        const marker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: `${chainName}: ${place.name}`,
        });
        markersRef.current.push(marker);

        // Info window
        const infowindow = new window.google.maps.InfoWindow({
          content: `<strong>${chainName}</strong><br>${place.name}<br>${place.vicinity}`,
        });
        marker.addListener("click", () => {
          infowindow.open(map, marker);
        });

        // Add to store list
        addStoreToList(chainName, place);
      } else {
        console.log(`No results found for ${chainName}`);
        addStoreToList(chainName, { name: "Not found", vicinity: "N/A" });
      }
    });
  };

  // Search for Walmart, No Frills, Sobeys near userLocation
  const performNearbySearch = (userLocation) => {
    clearMarkers();
    clearStoreList();
    ["Walmart", "No Frills", "Sobeys"].forEach((chain) =>
      searchForStore(chain, userLocation)
    );
  };

  // Manual search button (alternative to autocomplete)
  const handleSearchClick = () => {
    const address = document.getElementById("location-input").value;
    if (!address) {
      alert("Please enter a location.");
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const userLocation = results[0].geometry.location;
        if (map) {
          clearMarkers();
          clearStoreList();
          map.setCenter(userLocation);
          map.setZoom(13);
        }
        performNearbySearch(userLocation);

        if (onLocationChange) onLocationChange(userLocation);
        if (onAddressSubmit) onAddressSubmit();
      } else {
        alert("Geocode was not successful: " + status);
      }
    });
  };

  return (
    <div className="map-view">
      <div id="search-container">
        <input id="location-input" type="text" placeholder="Enter a location" />
        <button id="search-btn" onClick={handleSearchClick}>
          Search
        </button>
      </div>

      <div id="map" className="map-container"></div>

      <div id="store-list">
        <h2>Nearest Grocery Stores</h2>
        <ul id="stores-ul"></ul>
      </div>
    </div>
  );
}

export default MapView;
