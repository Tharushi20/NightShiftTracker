import React, { useEffect, useState } from "react";
import axios from "axios";
import './Home.css';

function Home() {
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/shifts/dates");
        setDates(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDates();
  }, []);

  const handleDownload = (date) => {
    window.open(`http://localhost:5000/api/shifts/report/${date}`, "_blank");
  };

  return (
    <main className="home-hero">
      <h1>Welcome to Night Shift Tracker</h1>
      <h2>Available Reports</h2>
      {dates.length === 0 ? (
        <p>No reports yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {dates.map((date) => (
            <li key={date} style={{ marginBottom: "15px" }}>
              <span style={{ marginRight: "20px", fontSize: "18px" }}>{date}</span>
              <button
                onClick={() => handleDownload(date)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Download Report
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default Home;
