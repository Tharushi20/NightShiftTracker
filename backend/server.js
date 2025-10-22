const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const shiftRoutes = require('./routes/shiftRoutes');
const cors = require('cors');
const cron = require('node-cron');
const Shift = require('./models/Shift');
const nodemailer = require('nodemailer');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



//MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
});

//Routes
app.use('/api/shifts', shiftRoutes);

async function sendMissedCheckInEmails() {
    let transporter = nodemailer.createTransport({
        host: "live.smtp.mailtrap.io",
        port: 587,
        secure: false,
        auth: {
            user:"api",
            pass:"48aa7404077d48afeea329a8305b017a",
        },
    });

    let info = await transporter.sendMail({
        from: 'tdomain.com',
        to: "tharushilad@gmail.com",
        subject: "Missed Check-in Alert",
        text: "An employee has missed a check-in during their shift.",
        html: "<b>An employee has missed a check-in during their shift.</b>",
    });
    console.log("⚠️ Auto email sent: %s", info.messageId);
}

// Cron job — check every 5 minutes
// cron.schedule('*/5 * * * *', async () => {
//   try {
//     const now = new Date();
//     const today = now.toISOString().split('T')[0];
//     const shifts = await Shift.find({ date: today });

//     for (const shift of shifts) {
//       // Determine shift hours
//       let hours = [];
//       if (shift.shift === '10-2') hours = [10, 11, 12, 13];
//       if (shift.shift === '2-5') hours = [14, 15, 16, 17];

//       for (const h of hours) {
//         const hourStart = new Date(now);
//         hourStart.setHours(h, 0, 0, 0);
//         const hourEnd = new Date(hourStart);
//         hourEnd.setMinutes(59, 59, 999);

//         // Check if log already exists for this hour
//         const hourLogs = shift.logs.filter(log =>
//           new Date(log.timestamp) >= hourStart && new Date(log.timestamp) <= hourEnd
//         );

//         // If past 10 minutes and no Active log exists, mark inactive
//         if (now.getHours() === h && now.getMinutes() >= 10 && hourLogs.length === 0) {
//           console.log(`⏰ ${shift.employeeName} missed check-in for hour ${h}`);
//           shift.logs.push({ timestamp: now, status: 'Inactive' });
//           await shift.save();

//           // Send alert email
//           await sendMissedCheckInEmails(shift.employeeName, shift.shift, h);
//         }
//       }
//     }
//   } catch (err) {
//     console.error("Cron error:", err);
//   }
// });



//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});