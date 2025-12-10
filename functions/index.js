/**
 * Cloud Functions for Lubowa Morph Registration - QR Check-in System
 * 
 * This file contains two main callable functions:
 * 1. generateServiceQR - Generates encrypted QR code data for current service window
 * 2. encryptUserData - Encrypts user registration data for secure storage
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets from Firebase Secret Manager
const QR_SECRET_KEY = defineSecret("QR_SECRET_KEY");
const USER_DATA_KEY = defineSecret("USER_DATA_KEY");

/**
 * Encryption algorithm configuration
 */
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Service schedule configuration
 * Sunday services at Watoto Church Lubowa
 */
const SERVICE_SCHEDULE = {
  0: [ // Sunday (0 = Sunday in JavaScript Date)
    {service: 1, start: 8, end: 10}, // 8am - 10am
    {service: 2, start: 10, end: 12}, // 10am - 12pm
    {service: 3, start: 12, end: 14}, // 12pm - 2pm
  ],
};

/**
 * Encrypt data using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @param {string} secretKey - The encryption key (32 bytes for AES-256)
 * @return {string} - Encrypted data in format: iv:encryptedData
 */
function encrypt(text, secretKey) {
  try {
    // Ensure the key is 32 bytes for AES-256
    const key = Buffer.from(secretKey.padEnd(32, "0").substring(0, 32));
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return IV + encrypted data (separated by colon)
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new HttpsError("internal", "Encryption failed");
  }
}

/**
 * Decrypt data using AES-256-CBC
 * @param {string} text - The encrypted text in format: iv:encryptedData
 * @param {string} secretKey - The decryption key (32 bytes for AES-256)
 * @return {string} - Decrypted plain text
 */
function decrypt(text, secretKey) {
  try {
    const key = Buffer.from(secretKey.padEnd(32, "0").substring(0, 32));
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new HttpsError("internal", "Decryption failed");
  }
}

/**
 * Determine the current service window based on current time
 * @return {Object|null} - Service object with dateFrom, dateTo, serviceNumber, or null if no service
 */
function getCurrentServiceWindow() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();

  // Check if today has services
  const todayServices = SERVICE_SCHEDULE[dayOfWeek];
  if (!todayServices) {
    return null;
  }

  // Find the active service
  for (const svc of todayServices) {
    if (currentHour >= svc.start && currentHour < svc.end) {
      // Create timestamps for the service window
      const dateFrom = new Date(now);
      dateFrom.setHours(svc.start, 0, 0, 0);

      const dateTo = new Date(now);
      dateTo.setHours(svc.end, 0, 0, 0);

      return {
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        serviceNumber: svc.service,
      };
    }
  }

  return null;
}

/**
 * Cloud Function: generateServiceQR
 * Generates an encrypted QR code payload for the current church service
 * 
 * HTTPS Callable function
 * Returns encrypted string in format suitable for QR code
 */
exports.generateServiceQR = onCall({secrets: [QR_SECRET_KEY]}, async (request) => {
  try {
    // Get current service window
    const serviceWindow = getCurrentServiceWindow();

    if (!serviceWindow) {
      throw new HttpsError(
          "failed-precondition",
          "No active service at this time. Services are on Sundays: 8-10am, 10am-12pm, 12-2pm"
      );
    }

    // Create payload object
    const payload = {
      x: serviceWindow.dateFrom,
      y: serviceWindow.dateTo,
      u: "/qrcode/scan",
      s: serviceWindow.serviceNumber,
    };

    // Convert to JSON string
    const payloadString = JSON.stringify(payload);

    // Encrypt the payload
    const encrypted = encrypt(payloadString, QR_SECRET_KEY.value());

    // Format as x:y:u: for QR code compatibility
    // The encrypted string already contains the IV and data separated by colon
    const qrData = `${encrypted}:${payload.u}:`;

    console.log("QR code generated successfully for service", serviceWindow.serviceNumber);

    return {
      success: true,
      qrData: qrData,
      serviceInfo: {
        serviceNumber: serviceWindow.serviceNumber,
        startTime: serviceWindow.dateFrom,
        endTime: serviceWindow.dateTo,
      },
    };
  } catch (error) {
    console.error("Error generating QR code:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to generate QR code");
  }
});

/**
 * Cloud Function: encryptUserData
 * Encrypts user registration data before storing in IndexedDB
 * 
 * HTTPS Callable function
 * @param {Object} data - The user data to encrypt
 * @param {string} data.userData - JSON string of user registration data
 * Returns encrypted ciphertext
 */
exports.encryptUserData = onCall({secrets: [USER_DATA_KEY]}, async (request) => {
  try {
    // Validate input
    if (!request.data || !request.data.userData) {
      throw new HttpsError("invalid-argument", "userData is required");
    }

    const {userData} = request.data;

    // Validate that userData is a valid JSON string or object
    let dataToEncrypt;
    if (typeof userData === "string") {
      try {
        JSON.parse(userData); // Validate it's valid JSON
        dataToEncrypt = userData;
      } catch (e) {
        throw new HttpsError("invalid-argument", "userData must be valid JSON string");
      }
    } else if (typeof userData === "object") {
      dataToEncrypt = JSON.stringify(userData);
    } else {
      throw new HttpsError("invalid-argument", "userData must be a string or object");
    }

    // Encrypt the user data
    const encrypted = encrypt(dataToEncrypt, USER_DATA_KEY.value());

    console.log("User data encrypted successfully");

    return {
      success: true,
      encryptedData: encrypted,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error encrypting user data:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to encrypt user data");
  }
});

/**
 * Cloud Function: decryptUserData (Helper for admin/debugging)
 * Decrypts previously encrypted user data
 * 
 * HTTPS Callable function
 * @param {Object} data - The encrypted data
 * @param {string} data.encryptedData - Encrypted string
 * Returns decrypted user data
 */
exports.decryptUserData = onCall({secrets: [USER_DATA_KEY]}, async (request) => {
  try {
    if (!request.data || !request.data.encryptedData) {
      throw new HttpsError("invalid-argument", "encryptedData is required");
    }

    const {encryptedData} = request.data;

    // Decrypt the data
    const decrypted = decrypt(encryptedData, USER_DATA_KEY.value());

    return {
      success: true,
      decryptedData: JSON.parse(decrypted),
    };
  } catch (error) {
    console.error("Error decrypting user data:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to decrypt user data");
  }
});

/**
 * Cloud Function: validateQRCode (Helper for validation)
 * Validates and decrypts QR code data
 * 
 * HTTPS Callable function
 * @param {Object} data - The QR code data
 * @param {string} data.qrData - Encrypted QR data string
 * Returns validation result and decoded data
 */
exports.validateQRCode = onCall({secrets: [QR_SECRET_KEY]}, async (request) => {
  try {
    if (!request.data || !request.data.qrData) {
      throw new HttpsError("invalid-argument", "qrData is required");
    }

    const {qrData} = request.data;

    // Extract the encrypted portion (everything before the last two colons)
    const parts = qrData.split(":");
    if (parts.length < 3) {
      throw new HttpsError("invalid-argument", "Invalid QR code format");
    }

    // Reconstruct encrypted data (iv:encryptedData)
    const encryptedPart = parts.slice(0, 2).join(":");

    // Decrypt
    const decrypted = decrypt(encryptedPart, QR_SECRET_KEY.value());
    const payload = JSON.parse(decrypted);

    // Validate time window
    const now = new Date();
    const dateFrom = new Date(payload.x);
    const dateTo = new Date(payload.y);

    const isValid = now >= dateFrom && now <= dateTo;

    return {
      success: true,
      isValid: isValid,
      payload: payload,
      message: isValid ? "QR code is valid" : "QR code has expired",
    };
  } catch (error) {
    console.error("Error validating QR code:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to validate QR code");
  }
});
