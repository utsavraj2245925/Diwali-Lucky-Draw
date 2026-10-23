const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');
const { AppError } = require('../middleware/errorMiddleware');
const Employee = require('../models/Employee');
const Card = require('../models/Card');
const ImportJob = require('../models/ImportJob');

exports.uploadAndPreview = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return next(new AppError('The uploaded file is empty', 400));
    }

    const headers = Object.keys(data[0]);
    const preview = data.slice(0, 10).map((row, index) => ({
      rowIndex: index + 2,
      data: row
    }));

    // Create a pending import job record to track this attempt
    const job = await ImportJob.create({
      filePath: req.file.path,
      totalRows: data.length,
      status: 'PENDING'
    });

    res.status(200).json({
      status: 'success',
      jobId: job._id,
      headers,
      preview,
      totalRows: data.length
    });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(err);
  }
};

exports.confirmImport = async (req, res, next) => {
  try {
    const { jobId, mapping, categoryMethod, categoryRanges } = req.body;
    
    if (!jobId || !mapping) {
      return next(new AppError('Missing jobId or column mapping', 400));
    }

    const job = await ImportJob.findById(jobId);
    if (!job) return next(new AppError('Import job not found', 404));
    if (job.status === 'COMPLETED') return next(new AppError('This job has already been completed', 400));

    const filePath = job.filePath;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    job.status = 'PROCESSING';
    await job.save();

    const results = { imported: 0, rejected: 0, duplicates: 0, invalid: 0, errors: [] };
    const employeesToInsert = [];
    const cardsToInsert = [];

    const existingIds = await Employee.find().distinct('employeeId');
    const existingCardNumbers = await Card.find().distinct('cardNumber');

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2;

      const empId = row[mapping.employeeId];
      const name = row[mapping.name];
      const dept = row[mapping.department];
      const desig = row[mapping.designation];
      const catValue = row[mapping.category];
      const cardNum = row[mapping.cardNumber];

      if (!empId || !name) {
        results.invalid++;
        results.errors.push({ rowIndex, error: 'Missing required Employee ID or Name' });
        continue;
      }

      if (existingIds.includes(empId) || employeesToInsert.some(e => e.employeeId === empId)) {
        results.duplicates++;
        results.errors.push({ rowIndex, error: `Duplicate Employee ID ${empId}` });
        continue;
      }

      let finalCategory;
      if (categoryMethod === 'column' && mapping.category) {
        finalCategory = catValue;
      } else if (categoryMethod === 'equal') {
        const cats = ['Manager', 'Company Staff', 'Company Worker'];
        finalCategory = cats[i % 3];
      } else if (categoryMethod === 'ranges' && categoryRanges) {
        for (const [cat, range] of Object.entries(categoryRanges)) {
          if (i >= range[0] && i < range[1]) {
            finalCategory = cat;
            break;
          }
        }
      }

      if (!['Manager', 'Company Staff', 'Company Worker'].includes(finalCategory)) {
        results.invalid++;
        results.errors.push({ rowIndex, error: `Invalid category: ${finalCategory}` });
        continue;
      }

      if (cardNum) {
        if (existingCardNumbers.includes(cardNum) || cardsToInsert.some(c => c.cardNumber === cardNum)) {
          results.invalid++;
          results.errors.push({ rowIndex, error: `Duplicate card number ${cardNum}` });
          continue;
        }
      }

      employeesToInsert.push({
        employeeId: empId,
        name,
        department: dept,
        designation: desig,
        category: finalCategory,
        isWinner: false // Ensure not eligible for previous draws
      });

      if (cardNum) {
        cardsToInsert.push({
          cardNumber: cardNum,
          employeeId: empId, // Temp store for linking
          status: 'assigned'
        });
      }
    }

    // COMMIT PHASE
    try {
      // 1. Insert Employees first
      if (employeesToInsert.length > 0) {
        await Employee.insertMany(employeesToInsert, { ordered: false });
      }

      // 2. Link Cards to Employees
      for (const cardData of cardsToInsert) {
        const emp = await Employee.findOne({ employeeId: cardData.employeeId });
        if (emp) {
          await Card.create({
            cardNumber: cardData.cardNumber,
            employee: emp._id,
            status: 'assigned',
            qrToken: crypto.randomBytes(32).toString('hex')
          });
        }
      }

      results.imported = employeesToInsert.length;
      job.status = 'COMPLETED';
      job.importedCount = results.imported;
      job.failedCount = results.invalid + results.duplicates;
      job.errors = results.errors;
      job.completedAt = new Date();
    } catch (dbErr) {
      job.status = 'FAILED';
      console.error('Commit error:', dbErr);
      throw new AppError('Database commit failed. Import partially completed. Please check Audit Logs.', 500);
    }

    await job.save();
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({ status: 'success', summary: results });
  } catch (err) {
    next(err);
  }
};
