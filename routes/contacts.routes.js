// routes/contacts.routes.js
import { addContactHandler } from '../controllers/contactsController.js';
import { validateAddContact, formatValidationError } from '../validators/contactsSchemas.js';
import { AddContactRequest, AddContactResponse } from '../generated/auth.js';
import { authGuard } from '../middleware/authGuard.js';

export default async function contactsRoutes(fastify) {
  fastify.post('/add', {
    preHandler: [
      // 1. Verify JWT (must be logged in)
      authGuard,

      // 2. Decode protobuf
      async (req) => {
        req.body = AddContactRequest.decode(req.body);
      },

      // 3. Validate email
      async (req, reply) => {
        const valid = validateAddContact(req.body);
        if (!valid) {
          const msg = formatValidationError(validateAddContact.errors);
          const buf = AddContactResponse.encode({ success: false, message: msg }).finish();
          return reply.type('application/protobuf').status(400).send(buf);
        }
      },

      // 4. Sanitize email (trim + lowercase)
      async (req) => {
        if (req.body.email) {
          req.body.email = req.body.email.trim().toLowerCase();
        }
      },
    ],
    handler: addContactHandler,
  });
}