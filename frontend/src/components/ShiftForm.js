import React, { useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import './ShiftForm.css';

function ShiftForm() {
    const [employeeName, setEmployeeName] = useState("");
    const [shiftTime, setShiftTime] = useState("");

    const navigate = useNavigate();

    // Example employees for dropdown
    const employees = ["Savinda", "Induwara", "Navod", "Dinuk","Divanka","Hansa","Isuka","Savin","Viraj","Madhawa","Esara"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const shiftData = { employeeName, shift: shiftTime, logs: [] };

        try {
            const response = await axios.post("http://localhost:5000/api/shifts", shiftData);

            // ✅ Save active shift flag in localStorage
            localStorage.setItem("activeShift", "true");

            // ✅ Show success alert
            Swal.fire({
                icon: 'success',
                title: 'Shift Added',
                text: 'The shift was successfully started!'
            });

            // ✅ Redirect to Monitor page with shift data
            navigate('/monitor', { state: { shift: response.data } });

        } catch (error) {
            console.error("Error creating shift:", error);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was a problem starting the shift.'
            });
        }
    };

    return (
        <div className="form-container">
            <div className="form-wrapper">
                <h2 className="form-title">Start New Shift</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Employee Name</label>
                        <select
                            className="form-input"
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            required
                        >
                            <option value="">Select Employee</option>
                            {employees.map((emp, index) => (
                                <option key={index} value={emp}>{emp}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Shift</label>
                        <select
                            className="form-input"
                            value={shiftTime}
                            onChange={(e) => setShiftTime(e.target.value)}
                            required
                        >
                            <option value="">Select Shift</option>
                            <option value="10-2">10-2</option>
                            <option value="2-5">2-5</option>
                        </select>
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
