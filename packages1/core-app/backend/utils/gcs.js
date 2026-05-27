const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize GCS
// Helper to format private key properly
const formatPrivateKey = (key) => {
  if (!key) return undefined;
  return key
    .replace(/\\n/g, '\n')      // Replace \\n with actual newlines
    .replace(/^"+|"+$/g, '')     // Remove surrounding double quotes
    .replace(/^'+|'+$/g, '')     // Remove surrounding single quotes
    .trim();                      // Trim any whitespace
};

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: formatPrivateKey(process.env.GCS_PRIVATE_KEY),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME;
let bucket;

if (bucketName) {
  bucket = storage.bucket(bucketName);
  // GCS initialized
} else {
  // GCS bucket not configured
}

/**
 * Uploads a buffer to GCS
 * @param {Buffer} buffer - File buffer
 * @param {string} destination - Path in bucket
 * @param {string} mimetype - Content type
 * @returns {Promise<string>} - Public URL
 */
const uploadToGCS = (buffer, destination, mimetype) => {
  return new Promise((resolve, reject) => {
    if (!bucket) {
      return reject(new Error('Cloud Storage is not configured. Please check GCS_BUCKET_NAME environment variable.'));
    }
    const file = bucket.file(destination);
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimetype,
      },
      resumable: false,
    });

    stream.on('error', (err) => {
      // Upload error logged
      reject(err);
    });

    stream.on('finish', async () => {
      // Option 1: Return public URL (requires bucket to be public or signed URL)
      // For simplicity in this app, we'll return a path that our backend can handle or a direct GCS link
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      resolve(publicUrl);
    });

    stream.end(buffer);
  });
};

module.exports = {
  uploadToGCS,
  bucket
};
