/**
 * Validates that all required environment variables are present and correctly formatted.
 * This should be called as early as possible in the application bootstrap process.
 */
export function validateEnv() {
  const missing: string[] = [];
  const invalid: string[] = [];

  // 1. Required Variables
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  required.forEach((key) => {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nPlease check your .env file.`
    );
  }

  // 2. Format Validation
  const validations: Record<string, (val: string) => boolean> = {
    VITE_FIREBASE_AUTH_DOMAIN: (val) => val.includes('.'),
    VITE_CODEKARO_API_URL: (val) => {
      if (!val) return true; // Optional
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    VITE_SENTRY_DSN: (val) => {
      if (!val) return true; // Optional
      return val.startsWith('https://');
    },
  };

  Object.entries(validations).forEach(([key, validator]) => {
    const value = import.meta.env[key];
    // Only validate if value exists (unless it was required and caught above)
    if (value && !validator(value)) {
      invalid.push(`${key}: Invalid format`);
    }
  });

  if (invalid.length > 0) {
    throw new Error(
      `Invalid environment variables:\n${invalid.join('\n')}\n\nPlease check your .env file.`
    );
  }

  // 3. Optional Variables Warnings
  const optional = ['VITE_CODEKARO_API_URL', 'VITE_SENTRY_DSN'];
  optional.forEach((key) => {
    if (!import.meta.env[key]) {
      console.warn(`[Env] Optional variable ${key} is not set.`);
    }
  });

  // Success
  console.log('✅ Environment variables validated');
}
