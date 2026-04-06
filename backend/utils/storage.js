/**
 * Google Cloud Storage Utility
 * Handles file uploads to GCS for shop logos, signatures, and QR codes
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Configuration - supports both JSON key file and env vars
const GCS_KEY_FILE_PATH = process.env.GCS_KEY_FILE || '/etc/secrets/billeasy_bucket';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;

let gcsCredentials = null;
let gcsProjectId = null;
let gcsBucketName = null;

// Try to load credentials from JSON key file
const loadGCSCredentials = () => {
  try {
    // Check if the secret file exists (Render mounts secrets to /etc/secrets/)
    const possiblePaths = [
      GCS_KEY_FILE_PATH,
      '/etc/secrets/billeasy_bucket',
      './billeasy_bucket',
      path.join(__dirname, '../../billeasy_bucket')
    ];
    
    for (const keyPath of possiblePaths) {
      if (fs.existsSync(keyPath)) {
        console.log(`[GCS] Found key file at: ${keyPath}`);
        const keyFileContent = fs.readFileSync(keyPath, 'utf8');
        gcsCredentials = JSON.parse(keyFileContent);
        
        // Extract project_id and bucket name from the key file
        gcsProjectId = gcsCredentials.project_id;
        
        // Bucket name can be in the key file or env var
        gcsBucketName = GCS_BUCKET_NAME || gcsCredentials.bucket_name || `billeasy-${gcsProjectId}`;
        
        console.log(`[GCS] Loaded credentials for project: ${gcsProjectId}`);
        return true;
      }
    }
    
    // Fallback to individual env vars if no file found
    gcsProjectId = process.env.GCS_PROJECT_ID;
    gcsBucketName = GCS_BUCKET_NAME;
    
    if (gcsProjectId && gcsBucketName) {
      console.log('[GCS] Using environment variables for configuration');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[GCS] Error loading credentials:', error.message);
    return false;
  }
};

// Check if GCS is configured
const isGCSConfigured = loadGCSCredentials();

let storage;
let bucket;

if (isGCSConfigured) {
  try {
    if (gcsCredentials) {
      // Use credentials from JSON file
      storage = new Storage({
        projectId: gcsProjectId,
        credentials: {
          client_email: gcsCredentials.client_email,
          private_key: gcsCredentials.private_key,
        },
      });
    } else {
      // Use key file path from env
      storage = new Storage({
        projectId: gcsProjectId,
        keyFilename: GCS_KEY_FILE_PATH,
      });
    }
    
    bucket = storage.bucket(gcsBucketName);
    console.log(`[GCS] Connected to bucket: ${gcsBucketName}`);
  } catch (error) {
    console.error('[GCS] Failed to initialize:', error.message);
  }
} else {
  console.log('[GCS] Not configured. Set GCS credentials file or env vars.');
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
    throw new Error('GCS not configured. Check credentials file or environment variables.');
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
    const publicUrl = `https://storage.googleapis.com/${gcsBucketName}/${gcsFileName}`;
    
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
    const urlPattern = new RegExp(`https://storage.googleapis.com/${gcsBucketName}/(.+)`);
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
