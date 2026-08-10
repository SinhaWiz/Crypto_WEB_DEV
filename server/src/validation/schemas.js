import { z } from 'zod';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const symbolSchema = z.string().transform((value) => value.toUpperCase()).pipe(z.enum(SUPPORTED_SYMBOLS));
const positiveNumberSchema = z.coerce.number().positive();

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    password: z.string().min(8),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
});

export const tradeSchema = z.object({
  body: z.object({
    symbol: symbolSchema,
    quantity: positiveNumberSchema,
  }),
});

export const predictionSchema = z.object({
  body: z.object({
    symbol: symbolSchema,
    direction: z.enum(['up', 'down']),
    pointsStaked: z.coerce.number().int().min(1).max(10000),
    durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['active', 'suspended']) }),
});

export const updateSimulationSchema = z.object({
  body: z
    .object({
      status: z.enum(['active', 'paused']).optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      resetSeeds: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'At least one simulation change is required'),
});
