// validators/authSchemas.js

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: false });
addFormats(ajv);

export const signupBodySchema = {
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'password'],
  properties: {
    firstName: { type: 'string', minLength: 1, maxLength: 100 },
    lastName:  { type: 'string', minLength: 1, maxLength: 100 },
    email:     { type: 'string', format: 'email', maxLength: 254 },
    password:  { type: 'string', minLength: 8, maxLength: 128 },
  },
};

export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email:    { type: 'string', format: 'email', maxLength: 254 },
    password: { type: 'string', minLength: 1, maxLength: 128 },
  },
};

export const validateSignup = ajv.compile(signupBodySchema);
export const validateLogin  = ajv.compile(loginBodySchema);

export function formatValidationError(errors) {
  if (errors && errors.length > 0) {
    const err = errors[0];
    return `Invalid ${err.instancePath.replace('/', '') || 'input'}: ${err.message}`;
  }
  return 'Invalid input.';
}