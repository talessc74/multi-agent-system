// Env vars must be set before any module that reads them at import time (e.g. stripe.server.ts)
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder_vitest';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder_vitest';
process.env.GEMINI_API_KEY = 'test_gemini_key';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIItest\n-----END PRIVATE KEY-----';
process.env.APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
