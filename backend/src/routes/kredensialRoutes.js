const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const kredensialController = require('../controllers/kredensialController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/str'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `str-${req.params.dokterId}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.get('/str/:dokterId', kredensialController.getSTR);
router.post('/str/:dokterId', upload.single('file'), kredensialController.uploadSTR);
router.get('/str/file/:filename', kredensialController.getSTRFile);

module.exports = router;
