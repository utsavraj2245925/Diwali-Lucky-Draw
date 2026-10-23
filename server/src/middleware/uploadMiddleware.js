const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|xlsx|xls/;
    const extname = filetype = path.extname(file.originalname).toLowerCase();
    if (filetypes.test(extname)) {
      return cb(null, true);
    }
    cb(new Error('Only CSV and XLSX files are allowed!'));
  }
});

module.exports = upload;
