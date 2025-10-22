const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const PDFDocument = require("pdfkit");


// ========================
// POST - create a new shift for single employee
// ========================
router.post('/', async (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const shift = new Shift({
    employeeName: req.body.employeeName,
    shift: req.body.shift,
    date: today,
    logs: []
  });

  try {
    const newShift = await shift.save();
    res.status(201).json(newShift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ========================
// PATCH - add a check-in log
// ========================
router.patch('/:id/log', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    shift.logs.push(req.body.log);
    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// DELETE - delete a shift
// ========================
router.delete('/:id', async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// GET - all unique dates with shifts
// ========================
router.get('/dates', async (req, res) => {
  try {
    const shifts = await Shift.find().select('date -_id');

    const formattedDates = shifts.map(s => {
      const d = new Date(s.date);
      return !isNaN(d) ? d.toISOString().split('T')[0] : s.date;
    });

    const uniqueDates = [...new Set(formattedDates)].sort((a, b) => new Date(b) - new Date(a));
    res.json(uniqueDates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching dates" });
  }
});

// ========================
// GET - daily shift report PDF for a specific date
// ========================
router.get('/report/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const shifts = await Shift.find({ date });

    if (!shifts.length)
      return res.status(404).json({ message: "No shifts for this date" });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `daily_shift_report_${date}.pdf`;

    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    // Header with gradient effect
    doc.rect(0, 0, 612, 100).fill('#667eea');
    
    // Title
    doc.fillOpacity(1)
       .fontSize(26)
       .fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .text("Daily Shift Report", 50, 30, { align: "center" });
    
    // Date
    doc.fontSize(13)
       .fillColor("#FFFFFF")
       .font("Helvetica")
       .text(`Date: ${date}`, 50, 65, { align: "center" });

    doc.moveDown(2.5);

    // Loop through each shift
    for (let idx = 0; idx < shifts.length; idx++) {
      const shift = shifts[idx];
      const startY = doc.y + 10;
      
      const sectionHeight = 180;

      // Check if we need a new page
      if (startY + sectionHeight > 750) {
        doc.addPage();
      }

      // Card border
      doc.rect(40, startY - 10, 520, sectionHeight)
         .fillOpacity(1)
         .fill('#FFFFFF')
         .strokeColor("#667eea")
         .lineWidth(2)
         .stroke();

      // Employee info section background
      doc.rect(40, startY - 10, 520, 55)
         .fillOpacity(0.1)
         .fill('#667eea');

      // Employee name
      doc.fillOpacity(1)
         .fontSize(16)
         .fillColor("#333333")
         .font("Helvetica-Bold")
         .text(`Employee: ${shift.employeeName}`, 60, startY + 5);
      
      // Shift time
      doc.fontSize(13)
         .font("Helvetica")
         .fillColor("#555555")
         .text(`Shift: ${shift.shift}`, 60, startY + 28);

      // Hours header
      doc.fontSize(11)
         .fillColor("#667eea")
         .font("Helvetica-Bold")
         .text("Hourly Activity Status", 60, startY + 65);

      let hours = [];
      if (shift.shift === "10-2") hours = [10, 11, 12, 1];
      if (shift.shift === "2-5") hours = [2, 3, 4,5];

      const hourStatus = hours.map((_, idx) => {
        const log = shift.logs[idx];
        return log ? log.status : "Inactive";
      });

      const boxWidth = 120;
      const boxHeight = 40;
      const tableTop = startY + 90;

      // Draw hour labels
      doc.font("Helvetica-Bold").fontSize(11);
      hours.forEach((h, i) => {
        const x = 60 + i * boxWidth;
        
        // Hour box header
        doc.rect(x, tableTop, boxWidth, boxHeight)
           .fillOpacity(1)
           .fill('#667eea')
           .strokeColor("#667eea")
           .lineWidth(1)
           .stroke();
        
        doc.fillOpacity(1)
           .fillColor("#FFFFFF")
           .text(`${h}:00`, x + boxWidth/2 - 15, tableTop + 13);
      });

      // Draw status boxes
      doc.font("Helvetica").fontSize(10);
      hourStatus.forEach((status, i) => {
        const x = 60 + i * boxWidth;
        
        // Simple color scheme
        if (status === "Active") {
          doc.fillOpacity(1).fill("#2ecc71"); // Green
        } else if (status === "Inactive") {
          doc.fillOpacity(1).fill("#e74c3c"); // Red
        } else {
          doc.fillOpacity(1).fill("#ecf0f1"); // Light gray
        }

        doc.rect(x, tableTop + boxHeight, boxWidth, boxHeight)
           .fillAndStroke()
           .strokeColor("#cccccc")
           .lineWidth(1);

        // Status text
        doc.fillOpacity(1)
           .fillColor("#FFFFFF")
           .font("Helvetica-Bold")
           .text(status, x + boxWidth/2 - 20, tableTop + boxHeight + 13);
      });

      doc.y = startY + sectionHeight + 15;
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .fillColor("#999999")
         .font("Helvetica")
         .text(
           `Night Shift Tracker | Generated: ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
           50,
           doc.page.height - 40,
           { align: "center" }
         );
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating daily report" });
  }
});

// ========================
// GET - single shift report PDF
// ========================
router.get('/:id/report', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `shift_report_${shift.employeeName.replace(/\s+/g, '_')}.pdf`;

    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 612, 120).fill('#667eea');
    
    // Title
    doc.fillOpacity(1)
       .fontSize(28)
       .fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .text("Shift Report", 50, 35, { align: "center" });
    
    // Subtitle
    doc.fontSize(12)
       .fillColor("#FFFFFF")
       .font("Helvetica")
       .text("Individual Employee Performance", 50, 75, { align: "center" });

    doc.moveDown(3.5);

    // Employee details card
    const cardTop = doc.y;
    doc.rect(40, cardTop, 520, 110)
       .fillOpacity(1)
       .fill('#FFFFFF')
       .strokeColor("#667eea")
       .lineWidth(2)
       .stroke();

    // Card header
    doc.rect(40, cardTop, 520, 35)
       .fillOpacity(0.15)
       .fill('#667eea');

    doc.fillOpacity(1)
       .fontSize(14)
       .fillColor("#333333")
       .font("Helvetica-Bold")
       .text("Shift Information", 60, cardTop + 10);

    // Employee details
    doc.fontSize(12)
       .fillColor("#555555")
       .font("Helvetica")
       .text(`Employee Name: ${shift.employeeName}`, 60, cardTop + 50);
    
    doc.text(`Shift Time: ${shift.shift}`, 60, cardTop + 68);
    
    doc.text(`Date: ${shift.date}`, 60, cardTop + 86);

    doc.moveDown(3);

    // Activity section
    doc.fontSize(14)
       .fillColor("#667eea")
       .font("Helvetica-Bold")
       .text("Hourly Activity Status", 40);
    
    doc.moveDown(1);

    let hours = [];
    if (shift.shift === "10-2") hours = [10, 11, 12, 1];
    if (shift.shift === "2-5") hours = [2, 3, 4,5];

    const hourStatus = hours.map((_, idx) => {
      const log = shift.logs[idx];
      return log ? log.status : "Inactive";
    });

    const tableTop = doc.y;
    const boxWidth = 120;
    const boxHeight = 45;

    // Draw hour headers
    doc.font("Helvetica-Bold").fontSize(12);
    hours.forEach((h, i) => {
      const x = 50 + i * boxWidth;
      
      doc.rect(x, tableTop, boxWidth, boxHeight)
         .fillOpacity(1)
         .fill('#667eea')
         .strokeColor("#667eea")
         .lineWidth(1)
         .stroke();
      
      doc.fillOpacity(1)
         .fillColor("#FFFFFF")
         .text(`${h}:00`, x + boxWidth/2 - 15, tableTop + 15);
    });

    // Draw status boxes
    doc.font("Helvetica-Bold").fontSize(11);
    hourStatus.forEach((status, i) => {
      const x = 50 + i * boxWidth;
      
      if (status === "Active") {
        doc.fillOpacity(1).fill("#2ecc71"); // Green
      } else if (status === "Inactive") {
        doc.fillOpacity(1).fill("#e74c3c"); // Red
      } else {
        doc.fillOpacity(1).fill("#ecf0f1"); // Light gray
      }

      doc.rect(x, tableTop + boxHeight, boxWidth, boxHeight)
         .fillAndStroke()
         .strokeColor("#cccccc")
         .lineWidth(1);

      doc.fillOpacity(1)
         .fillColor("#FFFFFF")
         .text(status, x + boxWidth/2 - 20, tableTop + boxHeight + 15);
    });

    // Summary section
    doc.moveDown(5);
    const activeCount = hourStatus.filter(s => s === "Active").length;
    const inactiveCount = hourStatus.filter(s => s === "Inactive").length;

    const summaryTop = doc.y;
    doc.rect(40, summaryTop, 520, 70)
       .fillOpacity(0.1)
       .fill('#667eea')
       .strokeColor("#667eea")
       .lineWidth(2)
       .stroke();

    doc.fillOpacity(1)
       .fontSize(13)
       .fillColor("#333333")
       .font("Helvetica-Bold")
       .text("Summary", 60, summaryTop + 12);

    doc.fontSize(11)
       .fillColor("#2ecc71")
       .font("Helvetica")
       .text(`Active Hours: ${activeCount}`, 60, summaryTop + 35);

    doc.fillColor("#e74c3c")
       .text(`Inactive Hours: ${inactiveCount}`, 300, summaryTop + 35);

    // Footer
    doc.fontSize(8)
       .fillColor("#999999")
       .font("Helvetica")
       .text(
         `Night Shift Tracker | Generated: ${new Date().toLocaleString()}`,
         50,
         doc.page.height - 40,
         { align: "center" }
       );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating report" });
  }
});

// ========================
// GET all shifts
// ========================
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;