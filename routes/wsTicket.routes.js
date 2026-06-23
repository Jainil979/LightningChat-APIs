// routes/wsTicket.routes.js
import { authGuard } from '../middleware/authGuard.js';

export default async function wsTicketRoutes(fastify) {
  fastify.post('/ticket', {
    preHandler: [authGuard],          // requires valid access token cookie
    handler: async (req, reply) => {
      const { userId } = req.user;    // set by authGuard after jwtVerify()

      const ticket = await reply.jwtSign(
        { userId, type: 'ws_ticket' },
        { expiresIn: '60s' }          // short‑lived, single‑use
      );

      return { ticket };              // plain JSON response
    },
  });
}