// src/BestDeals.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function BestDeals() {
  const [bestDeals, setBestDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get("http://localhost:3001/api/best-deals")
      .then((res) => {
        setBestDeals(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching best deals:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p>Loading best deals...</p>;

  return (
    <div className="best-deals-section">
      <h2>Best Deals</h2>
      {bestDeals.map((deal, index) => (
        <div key={index} className="deal-card">
          <h3>{deal.name}</h3>
          <p>
            Best Price: ${deal.bestPrice} at {deal.bestStore}
          </p>
          {deal.exclusive ? (
            <p>Exclusive deal!</p>
          ) : (
            <>
              <p>
                Second Best: ${deal.secondBestPrice} at {deal.secondBestStore}
              </p>
              <p>You save ${deal.priceDifference} compared to the next best.</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default BestDeals;
