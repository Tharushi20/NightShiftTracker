import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "./ShiftMonitor.css";

// Import alarm sound
const ALARM_SOUND_URL = process.env.PUBLIC_URL + '/alarm2.mp3';

function ShiftMonitor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { shift: passedShift } = location.state || {};

  const [shift, setShift] = useState(() => {
    const saved = localStorage.getItem("activeShift");
    return passedShift || (saved ? JSON.parse(saved) : null);
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextCheckTime, setNextCheckTime] = useState(() => {
    const saved = localStorage.getItem("nextCheckTime");
    return saved ? new Date(saved) : null;
  });
  const [hourBoxes, setHourBoxes] = useState(() => {
    const savedBoxes = localStorage.getItem("hourBoxes");
    return savedBoxes ? JSON.parse(savedBoxes) : [];
  });

  const popupTimerRef = useRef(null);
  const currentHourIndexRef = useRef(
    Number(localStorage.getItem("currentHourIndex")) || 0
  );
  const totalHoursRef = useRef(0);
  const alarmRef = useRef(null); // ✅ Audio reference

  const checkInterval = 60 * 60 * 1000; // 1 hour
  const popupDuration = 5 * 60 * 1000; // 10 minutes

  // Update current clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save shift to localStorage
  useEffect(() => {
    if (shift) localStorage.setItem("activeShift", JSON.stringify(shift));
  }, [shift]);

  // Initialize shift boxes
  useEffect(() => {
    if (!shift) return;

    let hours = [];
    if (shift.shift === "10-2") hours = [10, 11, 12, 1];
    if (shift.shift === "2-5") hours = [2, 3, 4, 5];

    if (hourBoxes.length === 0) {
      const boxes = hours.map((h) => ({ hour: h, status: null }));
      setHourBoxes(boxes);
      localStorage.setItem("hourBoxes", JSON.stringify(boxes));
    }

    totalHoursRef.current = hours.length;

    // Resume or handle missed check-ins
    handleMissedOrResume();

    return () => clearTimeout(popupTimerRef.current);
    // eslint-disable-next-line
  }, [shift]);

  // Persist boxes and index
  useEffect(() => {
    if (hourBoxes.length > 0)
      localStorage.setItem("hourBoxes", JSON.stringify(hourBoxes));
    localStorage.setItem(
      "currentHourIndex",
      currentHourIndexRef.current.toString()
    );
  }, [hourBoxes]);

  // Handle missed or resume popup
  const handleMissedOrResume = () => {
    const savedNext = localStorage.getItem("nextCheckTime");

    if (savedNext) {
      const nextTime = new Date(savedNext);
      const now = new Date();

      if (now - nextTime > popupDuration) {
        // ❌ Missed popup: mark inactive
        recordCheckIn("Inactive", currentHourIndexRef.current);
      } else if (now < nextTime) {
        // Resume waiting until next popup
        setNextCheckTime(nextTime);
        const delay = nextTime - now;
        popupTimerRef.current = setTimeout(() => showPopup(), delay);
        return;
      }
    }

    // Otherwise, schedule new check
    scheduleNextCheck();
  };

  // Schedule next check-in popup
  const scheduleNextCheck = () => {
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    if (currentHourIndexRef.current >= totalHoursRef.current) return;

    // Get next hour exactly (HH:00)
    const now = new Date();
    const next = new Date(now);
    next.setHours(now.getHours() + 1, 0, 0, 0);

    const delay = next.getTime() - now.getTime();

    setNextCheckTime(next);
    localStorage.setItem("nextCheckTime", next.toISOString());

    popupTimerRef.current = setTimeout(() => showPopup(), delay);
  };

  // Initialize audio on component mount with user interaction handling
  useEffect(() => {
    const audio = new Audio(ALARM_SOUND_URL);
    audio.loop = true;
    audio.volume = 0.7;
    audio.preload = 'auto';
    alarmRef.current = audio;

    // Function to enable sound after user interaction
    const enableSound = async () => {
      try {
        // Create a short silent audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        await audioContext.resume();
        
        // Try to play and immediately pause to enable future playback
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        
        // Remove the event listeners once successful
        ['click', 'touchstart', 'keydown'].forEach(event => 
          document.removeEventListener(event, enableSound)
        );
      } catch (err) {
        console.log('Audio context setup pending user interaction');
      }
    };

    // Add multiple event listeners for better interaction coverage
    ['click', 'touchstart', 'keydown'].forEach(event => 
      document.addEventListener(event, enableSound)
    );

    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current = null;
      }
      // Clean up event listeners
      ['click', 'touchstart', 'keydown'].forEach(event => 
        document.removeEventListener(event, enableSound)
      );
    };
  }, []);

  // ✅ Show check-in popup with alarm
  const showPopup = () => {
    console.log("🔔 Popup triggered!");
    if (alarmRef.current) {
      alarmRef.current.currentTime = 0;
      alarmRef.current.play().catch((err) => {
        console.warn("Audio play blocked:", err);
        // Show a visual indicator that sound is blocked
        Swal.update({
          text: "Please interact with the page (click/tap) to enable sound notifications.\nPlease confirm that you're awake and on shift!",
        });
      });
    }

    const indexAtPopup = currentHourIndexRef.current;
    if (indexAtPopup >= totalHoursRef.current) return;

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
          recordCheckIn("Active", indexAtPopup);
        }
      },
      willClose: () => {
        if (!recorded) {
          recorded = true;
          recordCheckIn("Inactive", indexAtPopup);
        }
        // ✅ Stop alarm when popup closes
        if (alarmRef.current) {
          alarmRef.current.pause();
          alarmRef.current.currentTime = 0;
        }
      },
    });
  };

  // Record check-in
  const recordCheckIn = async (status, index) => {
    const newRecord = {
      timestamp: new Date(),
      status: status === "Active" ? "Active" : "Inactive",
    };

    setHourBoxes((prev) => {
      const updated = [...prev];
      const safeIndex =
        typeof index === "number" ? index : currentHourIndexRef.current;
      if (safeIndex < updated.length && updated[safeIndex].status === null) {
        updated[safeIndex].status = newRecord.status;
        if (safeIndex >= currentHourIndexRef.current) {
          currentHourIndexRef.current = safeIndex + 1;
        }
      }
      return updated;
    });

    try {
      await axios.patch(`http://localhost:5000/api/shifts/${shift._id}/log`, {
        log: newRecord,
      });
    } catch (error) {
      console.error("Failed to update shift log:", error);
    }

    localStorage.removeItem("nextCheckTime");

    if (currentHourIndexRef.current < totalHoursRef.current) {
      scheduleNextCheck();
    }
  };

  // End shift
  const handleEndShift = () => {
    Swal.fire({
      title: "End Shift?",
      text: "Are you sure you want to end this shift?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, End Shift",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        clearTimeout(popupTimerRef.current);
        localStorage.removeItem("activeShift");
        localStorage.removeItem("hourBoxes");
        localStorage.removeItem("currentHourIndex");
        localStorage.removeItem("nextCheckTime");
        Swal.fire("Shift Ended", "The shift has been successfully ended.", "success");
        navigate("/");
      }
    });
  };

  // Download report
  const handleDownloadReport = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/shifts/${shift._id}/report`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `shift_report_${shift.employeeName}_${shift.shift}.pdf`
      );
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
        <p><strong>Employee:</strong> {shift.employeeName}</p>
        <p><strong>Shift Duration:</strong> {shift.shift}</p>
        <p><strong>Current Time:</strong> {currentTime.toLocaleTimeString()}</p>
        <p>
          <strong>Next Check-in Time:</strong>{" "}
          {nextCheckTime ? nextCheckTime.toLocaleTimeString() : "Calculating..."}
        </p>

        <h4>Shift Hours</h4>
        <div style={{ display: "flex", gap: "10px" }}>
          {hourBoxes.map((box, idx) => (
            <div
              key={idx}
              style={{
                width: "50px",
                height: "50px",
                border: "2px solid #333",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "18px",
                backgroundColor:
                  box.status === "Active"
                    ? "lightgreen"
                    : box.status === "Inactive"
                    ? "tomato"
                    : "#eee",
              }}
            >
              {box.hour}{" "}
              {box.status === "Active"
                ? "✅"
                : box.status === "Inactive"
                ? "❌"
                : ""}
            </div>
          ))}
        </div>

        <button className="end-shift-btn" onClick={handleEndShift}>
          End Shift
        </button>
        <button onClick={handleDownloadReport}>Download Report</button>
      </div>
    </div>
  );
}

export default ShiftMonitor;
