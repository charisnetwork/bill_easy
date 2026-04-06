const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

/* -------------------------------------------------------------------------
   STORAGE STRATEGY (Priority Order):
   1. Google Cloud Storage (GCS) - If GCS env vars are configured
   2. Cloudinary - If CLOUDINARY_URL is present
   3. Local Disk Storage - Development fallback
   
   Note: For GCS, we use memoryStorage() and upload from the controller
-------------------------------------------------------------------------- */

const fs = require('fs');

// Check for GCS credentials (file or env vars)
const gcsKeyFileExists = fs.existsSync('/etc/secrets/billeasy_bucket') || 
                         fs.existsSync('./billeasy_bucket') ||
                         fs.existsSync(process.env.GCS_KEY_FILE || '');
const isGCSActive = gcsKeyFileExists || !!(process.env.GCS_PROJECT_ID && process.env.GCS_BUCKET_NAME);
const isCloudinaryActive = !!process.env.CLOUDINARY_URL;

// Configure Cloudinary if active
if (isCloudinaryActive && !isGCSActive) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
}

const getStorage = (folderName) => {
  // If GCS is active, use memory storage (controller will handle GCS upload)
  if (isGCSActive) {
    return multer.memoryStorage();
  }
  
  // If Cloudinary is active, use Cloudinary storage
  if (isCloudinaryActive) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: `billeasy/${folderName}`,
        allowed_formats: ["jpg", "png", "jpeg", "pdf"],
        resource_type: "auto"
      }
    });
  }
  
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
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadSignature = multer({
  storage: getStorage("company/signatures"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadQRCode = multer({
  storage: getStorage("company/qrcodes"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadPurchaseFile = multer({
  storage: getStorage("company/purchases"),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB for purchase files
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

// Export config flags for controllers
exports.isGCSActive = isGCSActive;
exports.isCloudinaryActive = isCloudinaryActive;
