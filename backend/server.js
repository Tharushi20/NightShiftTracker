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


// //nodemailer
// const transporter = nodemailer.createTransport({
//   service: 'gmail', 
//   auth: {
//     user: 'tharushilad@gmail.com',
//     pass: 'agah ulww xvrf ixkt' 
//   }
// });

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

// // Cron job: runs every minute
// cron.schedule('* * * * *', async () => {
//   try {
//     const now = new Date();
//     const today = now.toISOString().split('T')[0];

//     const shifts = await Shift.find({ date: today });

//     for (const shift of shifts) {
//       let hours = [];
//       if (shift.shift === '10-2') hours = [10, 11, 12, 1]; // handle next day for 1
//       if (shift.shift === '2-5') hours = [14, 15, 16, 17]; // convert to 24-hour format

//       for (const h of hours) {
//         // Create the exact datetime for this shift hour
//         let shiftHourDate = new Date(today);
//         if (h < 10) {
//           // Handle early hours (after midnight)
//           shiftHourDate.setDate(shiftHourDate.getDate() + 1);
//         }
//         shiftHourDate.setHours(h, 10, 0, 0); // 10 minutes past the hour

//         // Create a unique key for this hour
//         const hourKey = `${shiftHourDate.getFullYear()}-${shiftHourDate.getMonth() + 1}-${shiftHourDate.getDate()}-${shiftHourDate.getHours()}`;

//         // Check if already logged
//         const logExists = shift.logs.some(log => log.hourKey === hourKey);
//         if (!logExists && now >= shiftHourDate) {
//           // Mark as Inactive
//           shift.logs.push({ timestamp: new Date(), status: 'Inactive', hourKey });
//           await shift.save();

//           // Send email
//           const mailOptions = {
//             from: 'tharushilad@gmail.com',
//             to: 'tharushilad@icloud.com',
//             subject: `Missed Check-in Alert for ${shift.employeeName}`,
//             text: `Employee ${shift.employeeName} missed check-in for shift ${shift.shift} at hour ${h}.`
//           };

//           transporter.sendMail(mailOptions, (err, info) => {
//             if (err) console.error('Email error:', err);
//             else console.log('⚠️ Auto email sent:', info.response);
//           });
//         }
//       }
//     }
//   } catch (err) {
//     console.error('Cron error:', err);
//   }
// });




//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});