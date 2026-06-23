// validators/userSchemas.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: false });
addFormats(ajv);

const updateProfileBodySchema = {
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName: { type: 'string', minLength: 2, maxLength: 12 },
    lastName:  { type: 'string', minLength: 2, maxLength: 12 },
  },
};

export const validateUpdateProfile = ajv.compile(updateProfileBodySchema);

export function formatValidationError(errors) {
  if (errors && errors.length > 0) {
    const err = errors[0];
    return `Invalid ${err.instancePath.replace('/', '') || 'input'}: ${err.message}`;
  }
  return 'Invalid input.';
}