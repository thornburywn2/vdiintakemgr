import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db/client.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<{ userId: string; email: string; name: string }>();

    // Verify user still exists and is active
    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        error: 'User not found or inactive',
      });
    }

    request.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}
