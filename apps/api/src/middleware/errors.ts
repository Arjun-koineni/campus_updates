import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const notFound: RequestHandler = (_req, res) => res.status(404).json({ error: 'Not found' });

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.message });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'A record with these details already exists' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  }
  if (error?.status === 400) return res.status(400).json({ error: 'Invalid request body' });
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong' });
};
