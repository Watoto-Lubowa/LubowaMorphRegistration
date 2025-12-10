/**
 * Cloudflare Worker for Lubowa Morph QR Check-in System
 * Handles QR generation and user data encryption
 */

// Type definitions
interface Env {
  QR_SECRET_KEY: string
  USER_DATA_KEY: string
  CACHE_SECRET_KEY: string
  ALLOWED_ORIGINS: string
}

interface ServiceWindow {
  dateFrom: string
  dateTo: string
  serviceNumber: number
}

interface QRPayload {
  x: string // dateFrom
  y: string // dateTo
  u: string // URL path
  s: number // service number
}

interface ServiceScheduleEntry {
  service: number
  start: number
  end: number
}

interface ServiceSchedule {
  [day: number]: ServiceScheduleEntry[]
}

// Service schedule configuration
const SERVICE_SCHEDULE: ServiceSchedule = {
  0: [ // Sunday (0 = Sunday in JavaScript Date)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 14 },  // 12pm - 2pm
  ],
  1: [ // Monday (for testing)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 20 },  // 12pm - 8pm (extended for testing)
  ],
  2: [ // Tuesday (for testing)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 20 },  // 12pm - 8pm (extended for testing)
  ],
  3: [ // Wednesday (for testing)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 20 },  // 12pm - 8pm (extended for testing)
  ],
  4: [ // Thursday (for testing)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 20 },  // 12pm - 8pm (extended for testing)
  ],
  5: [ // Friday (for testing)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 20 },  // 12pm - 8pm (extended for testing)
  ],
  6: [ // Saturday (for testing)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 20 },  // 12pm - 8pm (extended for testing)
  ],
};

/**
 * CORS headers for allowing requests from Firebase domain
 */
function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin') || '*'
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*']
  
  const corsOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*')
    ? origin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle CORS preflight requests
 */
function handleOptions(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  })
}

/**
 * Encrypt data using Web Crypto API (AES-GCM)
 */
async function encrypt(plaintext: string, secretKey: string): Promise<string> {
  try {
    // Convert secret key to CryptoKey
    const keyMaterial = new TextEncoder().encode(secretKey);
    const key = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', keyMaterial),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encodedText = new TextEncoder().encode(plaintext);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Return base64-encoded string
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error((error instanceof Error ? error.message : 'Encryption failed'));
  }
}

/**
 * Derive encryption key from UID and secret using PBKDF2
 */
async function deriveKey(uid: string, secret: string): Promise<CryptoKey> {
  // Combine UID with secret to create salt
  const saltString = `${uid}:${secret}`
  const salt = new TextEncoder().encode(saltString)
  
  // Use the secret as password material
  const passwordMaterial = new TextEncoder().encode(secret)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordMaterial,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derive a 256-bit AES key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Decrypt data using Web Crypto API (AES-GCM)
 */
async function decrypt(encryptedBase64: string, secretKey: string): Promise<string> {
  try {
    // Convert secret key to CryptoKey
    const keyMaterial = new TextEncoder().encode(secretKey)
    const key = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', keyMaterial),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // Decode base64 and separate IV and data
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const encryptedData = combined.slice(12)

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    )

    return new TextDecoder().decode(decryptedData)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error((error instanceof Error ? error.message : 'Decryption failed'))
  }
}

/**
 * Determine the current service window
 */
function getCurrentServiceWindow(): ServiceWindow | null {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();

  console.log(`[DEBUG] Current time: ${now.toISOString()}, Day: ${dayOfWeek}, Hour: ${currentHour}`);

  const todayServices = SERVICE_SCHEDULE[dayOfWeek];
  if (!todayServices) {
    console.log(`[DEBUG] No services scheduled for day ${dayOfWeek}`);
    return null;
  }

  console.log(`[DEBUG] Services for day ${dayOfWeek}:`, todayServices);

  for (const svc of todayServices) {
    console.log(`[DEBUG] Checking service ${svc.service}: ${svc.start} <= ${currentHour} < ${svc.end}`);
    if (currentHour >= svc.start && currentHour < svc.end) {
      const dateFrom = new Date(now);
      dateFrom.setHours(svc.start, 0, 0, 0);

      const dateTo = new Date(now);
      dateTo.setHours(svc.end, 0, 0, 0);

      console.log(`[DEBUG] Found active service ${svc.service}`);
      return {
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        serviceNumber: svc.service,
      };
    }
  }

  console.log(`[DEBUG] No active service found for current hour ${currentHour}`);

  return null;
}

/**
 * Handle GET /generate-qr
 * Generate encrypted QR code for current service
 */
async function handleGenerateQR(request: Request, env: Env): Promise<Response> {
  try {
    const serviceWindow = getCurrentServiceWindow();
    
    if (!serviceWindow) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active service at this time. Services are on Sundays: 8-10am, 10am-12pm, 12-2pm',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      );
    }

    // Create payload
    const payload = {
      x: serviceWindow.dateFrom,
      y: serviceWindow.dateTo,
      u: '/qrcode/scan',
      s: serviceWindow.serviceNumber,
    };

    // Encrypt payload
    const encrypted = await encrypt(
      JSON.stringify(payload),
      env.QR_SECRET_KEY
    );

    return new Response(
      JSON.stringify({
        success: true,
        qrData: encrypted,
        serviceInfo: {
          serviceNumber: serviceWindow.serviceNumber,
          startTime: serviceWindow.dateFrom,
          endTime: serviceWindow.dateTo,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to generate QR code'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  }
}

/**
 * Handle POST /encrypt-user-data
 * Encrypt user registration data
 */
async function handleEncryptUserData(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { userData: any }
    const { userData } = body
    
    if (!userData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'userData is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      );
    }

    // Convert to JSON string if it's an object
    const dataToEncrypt = typeof userData === 'string'
      ? userData
      : JSON.stringify(userData);

    // Encrypt the data
    const encrypted = await encrypt(dataToEncrypt, env.USER_DATA_KEY);

    return new Response(
      JSON.stringify({
        success: true,
        encryptedData: encrypted,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to encrypt user data'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  }
}

/**
 * Handle POST /secure-encrypt (Server-side encryption with UID-derived key)
 * Request body: { uid: string, userData: object }
 */
async function handleSecureEncrypt(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { uid: string; userData: any }
    const { uid, userData } = body
    
    if (!uid || !userData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'uid and userData are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      )
    }

    // Derive encryption key from UID + server secret
    const key = await deriveKey(uid, env.CACHE_SECRET_KEY)
    
    // Convert to JSON string
    const dataToEncrypt = JSON.stringify(userData)
    const encodedText = new TextEncoder().encode(dataToEncrypt)
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedData), iv.length)
    
    // Return base64-encoded string
    const encrypted = btoa(String.fromCharCode(...combined))

    return new Response(
      JSON.stringify({
        success: true,
        encryptedData: encrypted,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    )
  } catch (error) {
    console.error('Secure encrypt error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to encrypt data securely'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    )
  }
}

/**
 * Handle POST /secure-decrypt (Server-side decryption with UID-derived key)
 * Request body: { uid: string, encryptedData: string }
 */
async function handleSecureDecrypt(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { uid: string; encryptedData: string }
    const { uid, encryptedData } = body
    
    if (!uid || !encryptedData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'uid and encryptedData are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      )
    }

    // Derive decryption key from UID + server secret
    const key = await deriveKey(uid, env.CACHE_SECRET_KEY)
    
    // Decode base64 and separate IV and data
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const encryptedBytes = combined.slice(12)
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBytes
    )
    
    const decrypted = new TextDecoder().decode(decryptedData)

    return new Response(
      JSON.stringify({
        success: true,
        decryptedData: JSON.parse(decrypted),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    )
  } catch (error) {
    console.error('Secure decrypt error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to decrypt data securely'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    )
  }
}

/**
 * Handle POST /decrypt-user-data (Helper for debugging)
 * Decrypt user data
 */
async function handleDecryptUserData(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { encryptedData: string }
    const { encryptedData } = body
    if (!encryptedData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'encryptedData is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      );
    }

    const decrypted = await decrypt(encryptedData, env.USER_DATA_KEY);

    return new Response(
      JSON.stringify({
        success: true,
        decryptedData: JSON.parse(decrypted),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to decrypt user data'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  }
}

/**
 * Handle POST /validate-qr (Helper for validation)
 * Validate and decrypt QR code
 */
async function handleValidateQR(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { qrData: string }
    const { qrData } = body

    if (!qrData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'qrData is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      );
    }

    // The qrData might be URL-encoded when passed as query parameter
    // Decode it first to get the proper base64 string
    let decodedQrData = qrData
    try {
      decodedQrData = decodeURIComponent(qrData)
    } catch (e) {
      // If decoding fails, use original (might already be decoded)
      console.log('QR data is not URL encoded, using as-is')
    }

    const decrypted = await decrypt(decodedQrData, env.QR_SECRET_KEY)
    const payload = JSON.parse(decrypted) as QRPayload

    // Validate time window
    const now = new Date()
    const dateFrom = new Date(payload.x)
    const dateTo = new Date(payload.y)
    const isValid = now >= dateFrom && now <= dateTo

    return new Response(
      JSON.stringify({
        success: true,
        isValid,
        payload,
        message: isValid ? 'QR code is valid' : 'QR code has expired',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to validate QR code'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  }
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env)
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Route requests
    if (path === '/generate-qr' && request.method === 'GET') {
      return handleGenerateQR(request, env)
    }

    if (path === '/secure-encrypt' && request.method === 'POST') {
      return handleSecureEncrypt(request, env)
    }

    if (path === '/secure-decrypt' && request.method === 'POST') {
      return handleSecureDecrypt(request, env)
    }

    if (path === '/encrypt-user-data' && request.method === 'POST') {
      return handleEncryptUserData(request, env)
    }

    if (path === '/decrypt-user-data' && request.method === 'POST') {
      return handleDecryptUserData(request, env)
    }

    if (path === '/validate-qr' && request.method === 'POST') {
      return handleValidateQR(request, env)
    }

    // Root path - API info
    if (path === '/' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          name: 'Lubowa Morph QR Worker',
          version: '1.0.0',
          status: 'running',
          endpoints: {
            'GET /generate-qr': 'Generate encrypted QR code for current service',
            'POST /secure-encrypt': 'Securely encrypt data with UID-derived key',
            'POST /secure-decrypt': 'Securely decrypt data with UID-derived key',
            'POST /encrypt-user-data': 'Encrypt user registration data (legacy)',
            'POST /validate-qr': 'Validate QR code (helper)',
            'POST /decrypt-user-data': 'Decrypt user data (helper)',
          },
          documentation: 'https://github.com/Watoto-Lubowa/LubowaMorphRegistration',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request, env),
          },
        }
      )
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Not found',
        availableRoutes: [
          'GET /',
          'GET /generate-qr',
          'POST /secure-encrypt',
          'POST /secure-decrypt',
          'POST /encrypt-user-data',
          'POST /decrypt-user-data',
          'POST /validate-qr',
        ],
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    )
  },
}
