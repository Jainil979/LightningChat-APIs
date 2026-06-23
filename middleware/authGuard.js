import { AuthStatusResponse } from '../generated/auth.js';

export async function authGuard(req, reply) {
  try {
    await req.jwtVerify();
  } catch (err) {
    const buf = AuthStatusResponse.encode({
      success: false,
      message: 'Access token expired or invalid.',
      code: 1,   // ACCESS_TOKEN_EXPIRED
    }).finish();
    return reply.type('application/protobuf').status(401).send(buf);
  }
}