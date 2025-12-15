import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../services/audit.service.js';
import { loginSchema, changePasswordSchema } from '@avdmanager/shared';

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const { email, password } = result.data;

    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
      },
    });

    // Update last login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Audit log
    await createAuditLog({
      adminId: user.id,
      action: 'LOGIN',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  });

  // Logout
  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'LOGOUT',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Get current user
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.adminUser.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return reply.send({
      success: true,
      data: user,
    });
  });

  // Change password
  app.put('/password', { preHandler: [authenticate] }, async (request, reply) => {
    const result = changePasswordSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const { currentPassword, newPassword } = result.data;

    const user = await prisma.adminUser.findUnique({
      where: { id: request.user!.userId },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return reply.status(400).send({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await createAuditLog({
      adminId: user.id,
      action: 'PASSWORD_CHANGED',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  });
}
