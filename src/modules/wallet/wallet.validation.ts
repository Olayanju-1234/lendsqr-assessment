import Joi from "joi";

const amountField = Joi.number()
  .positive()
  .precision(2)
  .max(10000000)
  .required()
  .messages({
    "number.positive": "Amount must be a positive number",
    "number.max": "Amount cannot exceed 10,000,000",
    "any.required": "Amount is required",
  });

export const fundSchema = Joi.object({
  amount: amountField,
});

export const transferSchema = Joi.object({
  recipient_email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid recipient email",
    "any.required": "Recipient email is required",
  }),
  amount: amountField,
});

export const withdrawSchema = Joi.object({
  amount: amountField,
});
