import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

type RequestPart = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: Record<string, unknown> = {};

    const parts: RequestPart[] = ['body', 'query', 'params'];

    for (const part of parts) {
      const schema = schemas[part];
      if (schema) {
        const result = schema.safeParse(req[part]);
        if (!result.success) {
          errors[part] = formatZodError(result.error);
        } else {
          req[part] = result.data;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw ApiError.validation('Error de validación', errors);
    }

    next();
  };
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
