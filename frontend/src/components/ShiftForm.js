
import React, { useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import './ShiftForm.css';


function ShiftForm() {
    const [employeeName, setEmployeeName] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        const shiftData = { employeeName, employeeId, startTime, endTime, logs: [] };

        try {
            const response = await axios.post("http://localhost:5000/api/shifts", shiftData);
            Swal.fire({
                icon: 'success',
                title: 'Shift Added',
                text: 'The shift was successfully created!'
            });
            navigate('/monitor', { state: { shift: response.data } });
            setEmployeeName("");
            setEmployeeId("");
            setStartTime("");
            setEndTime("");
            
        } catch (error) {
            console.error("Error creating shift:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was a problem creating the shift.'
            });
        }
    };

    return (
        <div className="form-container">
            <div className="form-wrapper">
                <h2 className="form-title">New Shift</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Employee Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter Name"
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Employee ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter Employee ID"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            required
                        />
                    </div>

                    {/* Shift Time */}
                    <div className="form-group">
                        <label className="form-label">Start Time</label>
                        <input
                            type="datetime-local"
                            className="form-input"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input
                            type="datetime-local"
                            className="form-input"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="form-button">
                        Start Shift
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ShiftForm;
