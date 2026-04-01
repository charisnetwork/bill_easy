const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

/* -------------------------------------------------------------------------
   CONFIG & STRATEGY
   If CLOUDINARY_URL is present, we use Cloudinary (Production).
   Otherwise, we use Local Disk Storage (Development).
-------------------------------------------------------------------------- */

const isCloudinaryActive = !!process.env.CLOUDINARY_URL;

if (isCloudinaryActive) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
}

const getStorage = (folderName) => {
  if (isCloudinaryActive) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: `billeasy/${folderName}`,
        allowed_formats: ["jpg", "png", "jpeg", "pdf"],
        resource_type: "auto"
      }
    });
  } else {
    // Local Fallback Strategy
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, `uploads/${folderName}`);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${folderName}_${Date.now()}${ext}`);
      }
    });
  }
};

/* ---------- FILE FILTER ---------- */

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG or PDF allowed"), false);
  }
};

/* ---------- MULTER EXPORTS ---------- */

exports.uploadLogo = multer({
  storage: getStorage("company/logos"),
  fileFilter
});

exports.uploadSignature = multer({
  storage: getStorage("company/signatures"),
  fileFilter
});

exports.uploadQRCode = multer({
  storage: getStorage("company/qrcodes"),
  fileFilter
});

exports.uploadPurchaseFile = multer({
  storage: getStorage("company/purchases"),
  fileFilter
});

// Import storage remains in memory for performance
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
