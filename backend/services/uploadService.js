const multer = require("multer");
const path = require("path");

/* ---------- LOGO STORAGE ---------- */

const logoStorage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/company/logos");
  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname);

    const filename = "logo_" + Date.now() + ext;

    cb(null, filename);

  }

});

/* ---------- SIGNATURE STORAGE ---------- */

const signatureStorage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/company/signatures");
  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname);

    const filename = "signature_" + Date.now() + ext;

    cb(null, filename);

  }

});

/* ---------- QR CODE STORAGE ---------- */

const qrCodeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/company/qrcodes");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = "qrcode_" + Date.now() + ext;
    cb(null, filename);
  }
});

/* ---------- FILE FILTER ---------- */

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG or PDF allowed"), false);
  }
};

/* ---------- PURCHASE STORAGE ---------- */

const purchaseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/purchases");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = "purchase_" + Date.now() + ext;
    cb(null, filename);
  }
});

/* ---------- IMPORT STORAGE ---------- */

const importStorage = multer.memoryStorage();

const importFileFilter = (req, file, cb) => {
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
};

/* ---------- EXPORT MULTER ---------- */

exports.uploadImportFile = multer({
  storage: importStorage,
  fileFilter: importFileFilter
});

exports.uploadLogo = multer({
  storage: logoStorage,
  fileFilter
});

exports.uploadSignature = multer({
  storage: signatureStorage,
  fileFilter
});

exports.uploadQRCode = multer({
  storage: qrCodeStorage,
  fileFilter
});

exports.uploadPurchaseFile = multer({
  storage: purchaseStorage,
  fileFilter
});
