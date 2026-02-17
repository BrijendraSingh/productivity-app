import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';

/**
 * Runs an array of express-validator chains and, if any fail,
 * returns a 400 response with the validation errors.
 * Use as middleware: `validate([body('email').isEmail(), ...])`.
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: errors.array(),
      });
      return;
    }

    next();
  };
}
