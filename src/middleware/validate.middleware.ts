import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { HttpError } from "../utils/http-error";

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      throw new HttpError(400, message);
    }

    next();
  };
}
