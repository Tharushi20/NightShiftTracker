const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    employeeName: { type: String, required: true },  // selected from dropdown
    shift: { type: String, enum: ['10-2', '2-5'], required: true }, // shift dropdown
    date: { type: String, required: true },
    shiftStartTime: { type: Date},
    logs: [
        {
            timestamp: { type: Date, default: Date.now },
            status: { type: String, enum: ['Active', 'Inactive'], required: true }
        }
    ],
}, { timestamps: true });

const Shift = mongoose.model('Shift', ShiftSchema);
module.exports = Shift;
