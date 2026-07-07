import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'FRONTEND_URL',

  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_USER',
  'MYSQL_DATABASE',

  'ADMIN_SECURITY_CODE'
] as const;

// Check only if variable is completely missing
requiredVars.forEach((key) => {
  if (process.env[key] === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  // ==========================
  // Server
  // ==========================
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV as 'development' | 'production',

  // ==========================
  // JWT
  // ==========================
  jwtSecret: process.env.JWT_SECRET!,

  // ==========================
  // Frontend
  // ==========================
  frontendUrl: process.env.FRONTEND_URL!,

  // ==========================
  // Logger
  // ==========================
  enableHttpLogs: process.env.ENABLE_HTTP_LOGS === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',

  // ==========================
  // SMTP (Optional)
  // ==========================
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',

  // ==========================
  // Admin
  // ==========================
  adminSecurityCode: process.env.ADMIN_SECURITY_CODE!,

  // ==========================
  // MySQL
  // ==========================
  mysql: {
    host: process.env.MYSQL_HOST!,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE!,
  },
};