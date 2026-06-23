import { updateProfileHandler } from '../controllers/userController.js';
import { validateUpdateProfile, formatValidationError } from '../validators/userSchemas.js';
import { UpdateProfileRequest, UpdateProfileResponse } from '../generated/auth.js';
import { authGuard } from '../middleware/authGuard.js';

function sanitizeUpdateProfile(body) {
  if (body.firstName) {
    body.firstName = body.firstName.trim();
    if (body.firstName.length > 0) {
      body.firstName = body.firstName.charAt(0).toUpperCase() + body.firstName.slice(1).toLowerCase();
    }
  }
  if (body.lastName) {
    body.lastName = body.lastName.trim();
    if (body.lastName.length > 0) {
      body.lastName = body.lastName.charAt(0).toUpperCase() + body.lastName.slice(1).toLowerCase();
    }
  }
}

export default async function userRoutes(fastify) {
  fastify.put('/profile', {
    preHandler: [
      authGuard,
      async (req) => { req.body = UpdateProfileRequest.decode(req.body); },
      async (req, reply) => {
        const valid = validateUpdateProfile(req.body);
        if (!valid) {
          const msg = formatValidationError(validateUpdateProfile.errors);
          const buf = UpdateProfileResponse.encode({ success: false, message: msg }).finish();
          return reply.type('application/protobuf').status(400).send(buf);
        }
      },
      async (req) => { sanitizeUpdateProfile(req.body); },
    ],
    handler: updateProfileHandler,
  });
}