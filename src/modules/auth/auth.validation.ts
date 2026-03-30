import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  first_name: Joi.string().min(2).max(100).required().messages({
    "string.min": "First name must be at least 2 characters",
    "any.required": "First name is required",
  }),
  last_name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Last name must be at least 2 characters",
    "any.required": "Last name is required",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});
