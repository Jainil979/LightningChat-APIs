// validators/contactsSchemas.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: false });
addFormats(ajv);

const addContactBodySchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
  },
};

export const validateAddContact = ajv.compile(addContactBodySchema);

export function formatValidationError(errors) {
  if (errors && errors.length > 0) {
    const err = errors[0];
    return `Invalid ${err.instancePath.replace('/', '') || 'input'}: ${err.message}`;
  }
  return 'Invalid input.';
}