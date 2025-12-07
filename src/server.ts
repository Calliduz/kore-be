import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { globalRateLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import routes from './routes/index.js';

/**
 * Create Express application
 */
const app = express();

/**
 * Security Middleware Stack (Order matters!)
 *
 * 1. Helmet - Sets various HTTP headers for security
 * 2. CORS - Cross-Origin Resource Sharing
 * 3. Rate Limiter - Prevent abuse
 * 4. Mongo Sanitize - Prevent NoSQL injection
 * 5. Body parsers
 * 6. Cookie parser
 */

// 1. Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS - Allow frontend origin
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Rate Limiter - Global rate limiting
app.use(globalRateLimiter);

// 4. Mongo Sanitize - Prevent NoSQL injection attacks
app.use(mongoSanitize());

// 5. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Cookie parser
app.use(cookieParser());

/**
 * Trust proxy (for rate limiting behind reverse proxy)
 */
app.set('trust proxy', 1);

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * 404 Handler
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Graceful Shutdown Handler
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Close database connection
  await disconnectDB();

  console.log('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(env.PORT, () => {
      console.log(`\n🚀 Server running on port ${env.PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Base URL: http://localhost:${env.PORT}`);
      console.log(`❤️  Health Check: http://localhost:${env.PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
