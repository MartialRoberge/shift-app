import { z } from 'zod';

/**
 * Schémas de validation Zod pour les requêtes API
 */

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['worker', 'employer', 'admin']),
  xrpl_address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  password: z.string().optional(),
}).refine((data) => data.email || data.name, {
  message: 'Either email or name is required',
});

export const startShiftSchema = z.object({
  employer_id: z.string().uuid('Invalid employer ID'),
  job_type: z.string().optional(),
});

export const endShiftSchema = z.object({
  work_session_id: z.string().uuid('Invalid work session ID'),
});

export const validateShiftSchema = z.object({
  hourly_rate: z.number().positive().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  adjustments: z.any().optional(),
});

/**
 * Middleware de validation générique
 */
export function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

