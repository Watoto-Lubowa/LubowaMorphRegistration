/**
 * Helper script to test Cloud Functions locally
 * Run with: node test-functions.js
 */

const crypto = require('crypto');

// Simulate the encryption function
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function encrypt(text, secretKey) {
  const key = Buffer.from(secretKey.padEnd(32, '0').substring(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text, secretKey) {
  const key = Buffer.from(secretKey.padEnd(32, '0').substring(0, 32));
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Test encryption/decryption
console.log('🔐 Testing Encryption/Decryption\n');

// Generate a test key
const testKey = crypto.randomBytes(32).toString('hex');
console.log('Test Key:', testKey);

// Test data
const testData = JSON.stringify({
  x: new Date().toISOString(),
  y: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  u: '/qrcode/scan',
  s: 1
});

console.log('\nOriginal Data:', testData);

// Encrypt
const encrypted = encrypt(testData, testKey);
console.log('\nEncrypted:', encrypted);

// Decrypt
const decrypted = decrypt(encrypted, testKey);
console.log('\nDecrypted:', decrypted);

// Verify
console.log('\n✅ Match:', testData === decrypted);

// Generate keys for Firebase Secret Manager
console.log('\n' + '='.repeat(60));
console.log('🔑 Generate these keys for Firebase Secret Manager:');
console.log('='.repeat(60));
console.log('\nQR_SECRET_KEY:');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('\nUSER_DATA_KEY:');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('\n' + '='.repeat(60));
