const multer = require("multer");
const path = require("path");

// Use memory storage for GCS uploads
const gcsStorage = multer.memoryStorage();

/* ---------- FILE FILTER ---------- */

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG or PDF allowed"), false);
  }
};

/* ---------- EXPORT MULTER ---------- */

exports.uploadImportFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
      "application/vnd.ms-excel", 
      "text/csv"
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel or CSV files allowed"), false);
    }
  }
});

exports.uploadLogo = multer({
  storage: gcsStorage,
  fileFilter
});

exports.uploadSignature = multer({
  storage: gcsStorage,
  fileFilter
});

exports.uploadQRCode = multer({
  storage: gcsStorage,
  fileFilter
});

exports.uploadPurchaseFile = multer({
  storage: gcsStorage,
  fileFilter
});
