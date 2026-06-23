// server.js

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';

import './db/connection.js';
import authRoutes from './routes/auth.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import userRoutes from './routes/user.routes.js';

import wsTicketRoutes from './routes/wsTicket.routes.js';


const app = Fastify({
  logger: false,
  trustProxy: true,
  connectionTimeout: 5000,
  keepAliveTimeout: 60000,
  routerOptions: { maxParamLength: 100 },
});

// ---------- Plugins ----------
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  // origin: process.env.CORS_ORIGIN || '*',
  methods: ['POST', 'GET', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Slow down, please.',
  }),
});

await app.register(formbody);

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
});

// JWT plugin – default for access tokens
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'access-secret-change-me',
  sign: { algorithm: 'HS256' },
  verify: { algorithms: ['HS256'] },    // enforce algorithm
  cookie: {
    cookieName: 'token',
    signed: false,
  },
});

// ---------- Global protobuf parser ----------
app.addContentTypeParser('application/protobuf', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

await app.register(authRoutes, { prefix: '/api/auth' });

await app.register(contactsRoutes, { prefix: '/api/contacts' });

await app.register(userRoutes, { prefix: '/api/user' });

await app.register(wsTicketRoutes, { prefix: '/api/ws' });


export async function start() {
  try {
    const port = process.env.PORT || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}