const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    employeeName: { type: String, required: true },    
    employeeId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    logs: [{ timestamp: { type: Date, required: true }, status: { type: String, enum: ['awake','missed'], required: true } }]

}, { timestamps: true });   

const Shift =mongoose.model('Shift', ShiftSchema);
module.exports = mongoose.model('Shift', ShiftSchema);