// src/AllProducts.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function AllProducts() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get("http://localhost:3001/api/items")
      .then((res) => {
        setItems(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching all products:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p>Loading all products...</p>;

  return (
    <div className="all-products-section">
      <h2>All Products</h2>
      {items.map((item, index) => (
        <div key={index} className="product-card">
          <h3>{item.name}</h3>
          <p>Store: {item.store}</p>
          <p>Price: ${item.price}</p>
          <p>Availability: {item.availability}</p>
        </div>
      ))}
    </div>
  );
}

export default AllProducts;
