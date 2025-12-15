import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';

export async function baseImagesRoutes(app: FastifyInstance) {
  // List all base images
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const baseImages = await prisma.baseImage.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return reply.send({
      success: true,
      data: baseImages,
    });
  });

  // Get single base image
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const baseImage = await prisma.baseImage.findUnique({
      where: { id },
    });

    if (!baseImage) {
      return reply.status(404).send({
        success: false,
        error: 'Base image not found',
      });
    }

    return reply.send({
      success: true,
      data: baseImage,
    });
  });
}
