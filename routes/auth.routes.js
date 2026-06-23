// routes/auth.routes.js

import {
  validateSignup,
  validateLogin,
  formatValidationError,
} from '../validators/authSchemas.js';

import {
  signupHandler,
  loginHandler,
  refreshHandler,
  meHandler,
  logoutHandler,
  verifyHandler,
} from '../controllers/authController.js';

import { sanitizeSignupBody, sanitizeLoginBody } from '../middleware/sanitizers.js';
import { authGuard } from '../middleware/authGuard.js';
import { SignupRequest, LoginRequest, LoginResponse, VerifyResponse } from '../generated/auth.js';


export default async function authRoutes(fastify) {
  // Signup
  fastify.post('/signup', {
    preHandler: [
      async (req) => { req.body = SignupRequest.decode(req.body); },
      async (req, reply) => {
        const valid = validateSignup(req.body);
        if (!valid) {
          const msg = formatValidationError(validateSignup.errors);
          const buf = LoginResponse.encode({ success: false, message: msg }).finish();
          return reply.type('application/protobuf').status(400).send(buf);
        }
      },
      async (req) => { sanitizeSignupBody(req.body); },
    ],
    handler: signupHandler,
  });

  // Login
  fastify.post('/login', {
    preHandler: [
      async (req) => { req.body = LoginRequest.decode(req.body); },
      async (req, reply) => {
        const valid = validateLogin(req.body);
        if (!valid) {
          const msg = formatValidationError(validateLogin.errors);
          const buf = LoginResponse.encode({ success: false, message: msg }).finish();
          return reply.type('application/protobuf').status(400).send(buf);
        }
      },
      async (req) => { sanitizeLoginBody(req.body); },
    ],
    handler: loginHandler,
  });

  // Refresh
  fastify.post('/refresh', { handler: refreshHandler });

  // Me (protected)
  fastify.get('/me', {
    handler: meHandler,
  });

  // Logout (always returns 200, clears cookies)
  fastify.post('/logout', { handler: logoutHandler });


  // inside authRoutes function
  fastify.get('/verify', { handler: verifyHandler });
}