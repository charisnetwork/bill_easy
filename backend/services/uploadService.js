const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const fs = require('fs');

/* -------------------------------------------------------------------------
   STORAGE STRATEGY (Priority Order):
   1. Google Cloud Storage (GCS) - Uses memoryStorage(), controller handles GCS upload
   2. Cloudinary - If CLOUDINARY_URL is present
   3. Local Disk Storage - Development fallback (imports only)
   
   Note: Logo/Signature/QR uploads ALWAYS use memoryStorage to avoid ENOENT errors.
   The controller uploads directly to GCS. Local disk is only used for imports.
-------------------------------------------------------------------------- */

// Helper to check if GCS is configured
const checkGCSConfig = () => {
  // Check for environment variables (Railway way)
  if (process.env.GCS_PROJECT_ID && process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY) {
    console.log('[UploadService] Using GCS env vars');
    return true;
  }
  
  return false;
};

const isGCSActive = checkGCSConfig();
const isCloudinaryActive = !!process.env.CLOUDINARY_URL;

console.log(`[UploadService] GCS Active: ${isGCSActive}, Cloudinary Active: ${isCloudinaryActive}`);

// Memory storage for GCS uploads (logo, signature, qr) - always uses memory
// This avoids ENOENT errors from diskStorage trying to create local directories
const memoryStorage = multer.memoryStorage();

// Configure Cloudinary if active (and GCS is not)
if (isCloudinaryActive && !isGCSActive) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
}

// Ensure local upload directories exist (for fallback)
const ensureUploadDir = (folderPath) => {
  const fullPath = path.join(__dirname, '..', folderPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`[UploadService] Created directory: ${fullPath}`);
  }
};

const getStorage = (folderName) => {
  // If GCS is active, use memory storage (controller will handle GCS upload)
  if (isGCSActive) {
    console.log(`[UploadService] Using memory storage for ${folderName} (GCS mode)`);
    return multer.memoryStorage();
  }
  
  // If Cloudinary is active, use Cloudinary storage
  if (isCloudinaryActive) {
    console.log(`[UploadService] Using Cloudinary storage for ${folderName}`);
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
  console.log(`[UploadService] Using local disk storage for ${folderName}`);
  const uploadPath = `uploads/${folderName}`;
  ensureUploadDir(uploadPath);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const destPath = path.join(__dirname, '..', uploadPath);
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      // Use a simple filename without duplicating folder name
      cb(null, `file_${timestamp}${ext}`);
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

// Logo, Signature, QR uploads: ALWAYS use memoryStorage
// Controller handles uploading to GCS - no local disk storage
exports.uploadLogo = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadSignature = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadQRCode = multer({
  storage: memoryStorage,
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
