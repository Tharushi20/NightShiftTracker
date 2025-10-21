import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "./ShiftMonitor.css";

function ShiftMonitor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { shift } = location.state || {};

  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextCheckTime, setNextCheckTime] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const popupTimerRef = useRef(null);

  // Testing intervals
  const checkInterval = 1 * 60 * 1000; // 1 minute for testing
  const popupDuration = 10 * 1000; // 10 seconds for testing

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Start the first check-in
  useEffect(() => {
    if (!shift) return;

    scheduleNextCheck();
    return () => clearTimeout(popupTimerRef.current);
    // eslint-disable-next-line
  }, [shift]);

  // Schedule the next check-in popup
  const scheduleNextCheck = () => {
    const next = new Date(new Date().getTime() + checkInterval);
    setNextCheckTime(next);

    popupTimerRef.current = setTimeout(() => {
      showPopup();
    }, checkInterval);
  };

  // Show check-in popup
  const showPopup = () => {
    let recorded = false;

    Swal.fire({
      title: "Check-in Required",
      text: "Please confirm that you’re awake and on shift!",
      icon: "question",
      showCancelButton: false,
      showConfirmButton: true,
      confirmButtonText: "I’m Awake",
      allowOutsideClick: false,
      timer: popupDuration,
      timerProgressBar: true,
      preConfirm: () => {
        if (!recorded) {
          recorded = true;
          recordCheckIn("Active");
          scheduleNextCheck(); 
        }
      },
      didClose: () => {
        if (!recorded) {
          recorded = true;
          recordCheckIn("Inactive");
          scheduleNextCheck(); 
        }
      },
    });
  };

 const recordCheckIn = async (status) => {
  // Convert status to schema enum
  const logStatus = status === "Active" ? "awake" : "missed";

  const newRecord = {
    timestamp: new Date(), // matches backend schema
    status: logStatus,
  };

  // Update local state
  setCheckIns((prev) => [...prev, newRecord]);

  // Update database
  try {
    await axios.patch(`http://localhost:5000/api/shifts/${shift._id}/log`, {
      log: newRecord
    });
  } catch (error) {
    console.error("Failed to update shift log:", error);
  }
};


  // End shift button
  const handleEndShift = () => {
    Swal.fire({
      title: "End Shift?",
      text: "Are you sure you want to end this shift?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, End Shift",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Shift Ended", "The shift has been successfully ended.", "success");
        clearTimeout(popupTimerRef.current);
        navigate("/");
      }
    });
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/shifts/${shift._id}/report`, {
        responseType: "blob", // Important for binary data
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `shift_report_${shift.employeeId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  if (!shift)
    return (
      <div className="monitor-container">
        <p>No shift data available.</p>
      </div>
    );

  return (
    <div className="monitor-container">
      <h2>Shift Monitoring</h2>
      <div className="monitor-card">
        <p>
          <strong>Employee:</strong> {shift.employeeName}
        </p>
        <p>
          <strong>Employee ID:</strong> {shift.employeeId}
        </p>
        <p>
          <strong>Current Time:</strong> {currentTime.toLocaleTimeString()}
        </p>
        <p>
          <strong>Next Check-in Time:</strong>{" "}
          {nextCheckTime ? nextCheckTime.toLocaleTimeString() : "Calculating..."}
        </p>

        <h4>Check-in History</h4>
        <ul>
          {checkIns.map((c, index) => (
            <li key={index}>
              {c.time} -{" "}
              <span style={{ color: c.status === "Active" ? "lightgreen" : "tomato" }}>
                {c.status}
              </span>
            </li>
          ))}
        </ul>

        <button className="end-shift-btn" onClick={handleEndShift}>
          End Shift
        </button>
        <button onClick={handleDownloadReport}>Download Report</button>
      </div>
    </div>
  );
}

export default ShiftMonitor;
