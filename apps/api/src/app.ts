import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import { prisma } from './db/client.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { templatesRoutes } from './routes/templates.js';
import { applicationsRoutes } from './routes/applications.js';
import { businessUnitsRoutes } from './routes/business-units.js';
import { contactsRoutes } from './routes/contacts.js';
import { auditRoutes } from './routes/audit.js';
import { exportRoutes } from './routes/export.js';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    timeWindow: '1 minute',
  });

  // JWT authentication
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  await app.register(jwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '8h',
    },
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(templatesRoutes, { prefix: '/api/templates' });
  await app.register(applicationsRoutes, { prefix: '/api/applications' });
  await app.register(businessUnitsRoutes, { prefix: '/api/business-units' });
  await app.register(contactsRoutes, { prefix: '/api/contacts' });
  await app.register(auditRoutes, { prefix: '/api/audit' });
  await app.register(exportRoutes, { prefix: '/api/export' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.validation,
      });
    }

    // Handle JWT errors
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
        error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Generic error response
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
    });
  });

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await prisma.$disconnect();
      await app.close();
      process.exit(0);
    });
  });

  return app;
}
