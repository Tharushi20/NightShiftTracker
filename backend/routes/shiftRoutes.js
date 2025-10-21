const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const { parse } = require('dotenv');
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

//GET
router.get('/', async (req, res) => {
    try {
        const shifts = await Shift.find();
        res.json(shifts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//POST
router.post('/', async (req, res) => {
    const shift = new Shift({
        employeeName: req.body.employeeName,    
        employeeId: req.body.employeeId,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        logs: req.body.logs
    });
    try {
        const newShift = await shift.save();
        res.status(201).json(newShift);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//PUT
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await Shift.findOneAndUpdate({id}, req.body);
        res.status(200).json({ message: 'Shift updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}); 
            

//DELETE
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await Shift.findOneAndDelete({id});
        res.status(200).json({ message: 'Shift deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// // PATCH /api/shifts/:id/log
// router.patch('/:id/log', async (req, res) => {
//   const { log } = req.body; // expects a single log object

//   try {
//     const updatedShift = await Shift.findByIdAndUpdate(
//       req.params.id,
//       { $push: { logs: log } }, // push log into logs array
//       { new: true }
//     );
//     res.status(200).json(updatedShift);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

router.patch('/:id/log', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    shift.logs.push(req.body.log); // push new log object
    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ✅ Download Shift Report
router.get("/:id/report", async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `shift_report_${shift.employeeId}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");

    // Convert PDF to stream
    const stream = new Readable().wrap(doc);
    stream.pipe(res);

    // Title
    doc.fontSize(20).text("Shift Report", { align: "center" });
    doc.moveDown();

    // Shift Details
    doc.fontSize(12).text(`Employee Name: ${shift.employeeName}`);
    doc.text(`Employee ID: ${shift.employeeId}`);
    doc.text(`Start Time: ${new Date(shift.startTime).toLocaleString()}`);
    doc.text(`End Time: ${new Date(shift.endTime).toLocaleString()}`);
    doc.moveDown();

    // Logs
    doc.fontSize(14).text("Shift Activity Log:");
    doc.moveDown(0.5);

    if (shift.logs.length === 0) {
      doc.fontSize(12).text("No activity recorded.");
    } else {
      shift.logs.forEach((log, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${log.timestamp} — ${log.status}`,
            { indent: 20 }
          );
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating report" });
  }
});





module.exports = router;