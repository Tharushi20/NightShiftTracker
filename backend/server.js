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





//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});