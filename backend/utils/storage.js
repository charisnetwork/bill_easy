/**
 * Google Cloud Storage Utility
 * Handles file uploads to GCS for shop logos, signatures, and QR codes
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Configuration from environment variables
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID;
const GCS_CLIENT_EMAIL = process.env.GCS_CLIENT_EMAIL;
const GCS_PRIVATE_KEY = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'bill-easy-assets';

// Check if GCS is configured with all required credentials
const isGCSConfigured = !!(GCS_PROJECT_ID && GCS_CLIENT_EMAIL && GCS_PRIVATE_KEY);

let storage;
let bucket;

if (isGCSConfigured) {
  try {
    storage = new Storage({
      projectId: GCS_PROJECT_ID,
      credentials: {
        client_email: GCS_CLIENT_EMAIL,
        private_key: GCS_PRIVATE_KEY,
      },
    });

    bucket = storage.bucket(GCS_BUCKET_NAME);
    console.log(`[GCS] Connected to bucket: ${GCS_BUCKET_NAME}`);
    console.log(`[GCS] Using service account: ${GCS_CLIENT_EMAIL}`);
  } catch (error) {
    console.error('[GCS] Failed to initialize:', error.message);
  }
} else {
  console.log('[GCS] Not configured. Set GCS_PROJECT_ID, GCS_CLIENT_EMAIL, and GCS_PRIVATE_KEY env vars.');
}

/**
 * Upload an image buffer to Google Cloud Storage
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} filename - Original filename
 * @param {string} folder - Folder path within bucket (e.g., 'company/logos')
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadImage = async (buffer, filename, folder = 'uploads', mimetype = 'image/jpeg') => {
  if (!bucket) {
    throw new Error('GCS not configured. Check environment variables.');
  }

  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const ext = path.extname(filename) || '.jpg';
    const baseName = path.basename(filename, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const gcsFileName = `${folder}/${sanitizedBaseName}_${timestamp}${ext}`;

    const file = bucket.file(gcsFileName);

    // Upload the buffer
    await file.save(buffer, {
      contentType: mimetype,
      resumable: false,
      metadata: {
        contentDisposition: 'inline',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Return the public URL
    const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${gcsFileName}`;
    
    console.log(`[GCS] Uploaded: ${gcsFileName} -> ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('[GCS] Upload failed:', error.message);
    throw new Error(`Failed to upload to GCS: ${error.message}`);
  }
};

/**
 * Delete a file from GCS by URL
 * @param {string} fileUrl - Full GCS URL of the file to delete
 */
const deleteImage = async (fileUrl) => {
  if (!bucket || !fileUrl) return;

  try {
    // Extract file path from URL
    const urlPattern = new RegExp(`https://storage.googleapis.com/${GCS_BUCKET_NAME}/(.+)`);
    const match = fileUrl.match(urlPattern);
    
    if (match && match[1]) {
      const fileName = match[1];
      await bucket.file(fileName).delete();
      console.log(`[GCS] Deleted: ${fileName}`);
    }
  } catch (error) {
    console.error('[GCS] Delete failed:', error.message);
    // Don't throw - deletion failures shouldn't break the app
  }
};

/**
 * Check if GCS is properly configured and connected
 * @returns {boolean}
 */
const isConnected = () => {
  return !!bucket;
};

module.exports = {
  uploadImage,
  deleteImage,
  isConnected,
  isGCSConfigured,
};
