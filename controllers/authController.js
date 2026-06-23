// controllers/authController.js

import bcrypt from 'bcrypt';
import * as userModel from '../models/userModel.js';
import {
  SignupResponse,
  LoginResponse,
  UserResponse,
  AuthStatusResponse,
  VerifyResponse,
} from '../generated/auth.js';


function getCookieOptions(maxAge, path = '/') {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path,
    maxAge,
  };
}


// ---------- Signup ----------
export async function signupHandler(req, reply) {
  const { firstName, lastName, email, password } = req.body;

  if (await userModel.emailExists(email)) {
    const buf = SignupResponse.encode({
      success: false,
      message: 'An account with this email already exists.',
    }).finish();
    return reply.type('application/protobuf').status(409).send(buf);
  }

  const pwdHash = await bcrypt.hash(password, 10);
  await userModel.createUser({ firstName, lastName, email, pwdHash });

  const buf = SignupResponse.encode({
    success: true,
    message: 'Account created successfully.',
  }).finish();
  return reply.type('application/protobuf').status(201).send(buf);
}


// ---------- Login ----------
export async function loginHandler(req, reply) {
  const { email, password } = req.body;

  const user = await userModel.findUserByEmail(email);
  if (!user) {
    const buf = AuthStatusResponse.encode({
      success: false,
      message: 'Invalid email or password.',
      code: 3,
    }).finish();
    return reply.type('application/protobuf').status(401).send(buf);
  }

  const valid = await bcrypt.compare(password, user.pwd_hash);
  if (!valid) {
    const buf = AuthStatusResponse.encode({
      success: false,
      message: 'Invalid email or password.',
      code: 3,
    }).finish();
    return reply.type('application/protobuf').status(401).send(buf);
  }

  // Current token version from DB – used for both tokens
  const tokenVersion = user.token_version;

  // Access token – 15 min
  const accessToken = await reply.jwtSign(
    { userId: user.user_id, type: 'access', tokenVersion },
    { expiresIn: '15m' }
  );

  // Refresh token – 7 days, signed with separate secret
  const refreshToken = await reply.jwtSign(
    { userId: user.user_id, type: 'refresh', tokenVersion },
    { expiresIn: '7d', key: process.env.REFRESH_JWT_SECRET }
  );

  reply.setCookie('token', accessToken, getCookieOptions(15 * 60));
  reply.setCookie('refresh_token', refreshToken, getCookieOptions(7 * 24 * 60 * 60, '/api/auth'));

  const buf = AuthStatusResponse.encode({
    success: true,
    message: 'Login successful.',
    code: 0,
  }).finish();
  return reply.type('application/protobuf').status(200).send(buf);
}


// ---------- Refresh ----------
export async function refreshHandler(req, reply) {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    const buf = AuthStatusResponse.encode({
      success: false,
      message: 'No refresh token provided.',
      code: 2,
    }).finish();
    return reply.type('application/protobuf').status(401).send(buf);
  }

  try {
    const payload = req.server.jwt.verify(refreshToken, {
      secret: process.env.REFRESH_JWT_SECRET,
      algorithms: ['HS256'],
    });

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check token version against database
    const currentVersion = await userModel.getUserTokenVersion(payload.userId);
    if (currentVersion === undefined || payload.tokenVersion !== currentVersion) {
      throw new Error('Token version mismatch');
    }

    // Issue new access token
    const accessToken = await reply.jwtSign(
      { userId: payload.userId, type: 'access', tokenVersion: currentVersion },
      { expiresIn: '15m' }
    );

    reply.setCookie('token', accessToken, getCookieOptions(15 * 60));

    const buf = AuthStatusResponse.encode({
      success: true,
      message: 'Access token refreshed.',
      code: 0,
    }).finish();
    return reply.type('application/protobuf').status(200).send(buf);
  } catch (err) {
    const buf = AuthStatusResponse.encode({
      success: false,
      message: 'Refresh token expired or invalid.',
      code: 2,
    }).finish();
    return reply.type('application/protobuf').status(401).send(buf);
  }
}


// ---------- Me (protected) ----------
// export async function meHandler(req, reply) {
//   // Read the access token cookie manually
//   const token = req.cookies.token;

//   // No token → not authenticated, but return 200 (avoid console noise)
//   if (!token) {
//     const buf = UserResponse.encode({
//       success: false,
//       message: 'Not authenticated.',
//     }).finish();
//     return reply.type('application/protobuf').status(200).send(buf);
//   }

//   // Token present – verify it
//   try {
//     await req.jwtVerify();          // sets req.user if valid
//   } catch (err) {
//     // Token expired or invalid → return 401 (so the client knows to refresh)
//     const buf = AuthStatusResponse.encode({
//       success: false,
//       message: 'Access token expired or invalid.',
//       code: 1,
//     }).finish();
//     return reply.type('application/protobuf').status(401).send(buf);
//   }

//   // Token valid – fetch user data
//   const { userId } = req.user;
//   const user = await userModel.findUserById(userId);

//   if (!user) {
//     const buf = AuthStatusResponse.encode({
//       success: false,
//       message: 'User not found.',
//       code: 4,
//     }).finish();
//     return reply.type('application/protobuf').status(404).send(buf);
//   }

//   const buf = UserResponse.encode({
//     success: true,
//     message: 'Authenticated.',
//     userId: user.user_id,
//     email: user.email,
//     firstName: user.first_name,
//     lastName: user.last_name,
//   }).finish();
//   return reply.type('application/protobuf').status(200).send(buf);
// }





// ---------- Me (protected) ----------
export async function meHandler(req, reply) {
  let userId = null;

  // 1. Try access token
  try {
    await req.jwtVerify();
    userId = req.user.userId;
  } catch {
    // expired or missing
  }

  // 2. If access token failed, try refresh token (self‑healing)
  if (userId === null) {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      try {
        const payload = req.server.jwt.verify(refreshToken, {
          secret: process.env.REFRESH_JWT_SECRET,
          algorithms: ['HS256'],
        });
        if (payload.type === 'refresh' && payload.userId) {
          const currentVersion = await userModel.getUserTokenVersion(payload.userId);
          if (currentVersion !== undefined && payload.tokenVersion === currentVersion) {
            const newAccessToken = await reply.jwtSign(
              { userId: payload.userId, type: 'access', tokenVersion: currentVersion },
              { expiresIn: '15m' }
            );
            reply.setCookie('token', newAccessToken, getCookieOptions(15 * 60));
            userId = payload.userId;
          }
        }
      } catch {
        // refresh token invalid
      }
    }
  }

  // 3. No valid user – return 200 with success: false (no console noise)
  if (userId === null) {
    const buf = UserResponse.encode({
      success: false,
      message: 'Not authenticated.',
    }).finish();
    return reply.type('application/protobuf').status(200).send(buf);
  }

  // 4. Fetch user data
  const user = await userModel.findUserById(userId);
  if (!user) {
    const buf = UserResponse.encode({
      success: false,
      message: 'User not found.',
    }).finish();
    return reply.type('application/protobuf').status(200).send(buf);
  }

  const buf = UserResponse.encode({
    success: true,
    message: 'Authenticated.',
    userId: user.user_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  }).finish();
  return reply.type('application/protobuf').status(200).send(buf);
}


// ---------- Logout (always succeeds) ----------
export async function logoutHandler(req, reply) {
  // Try to identify the user via refresh token
  try {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      const payload = req.server.jwt.verify(refreshToken, {
        secret: process.env.REFRESH_JWT_SECRET,
        algorithms: ['HS256'],
      });
      if (payload.type === 'refresh' && payload.userId) {
        // Invalidate all refresh tokens by incrementing version
        await userModel.incrementTokenVersion(payload.userId);
      }
    }
  } catch {
    // refresh token invalid/expired – version not incremented, but that's fine
    // because it's already invalid
  }

  // Always clear cookies (even if both tokens are dead)
  reply.clearCookie('token', { path: '/' });

  reply.clearCookie('refresh_token', { path: '/api/auth' });

  const buf = AuthStatusResponse.encode({
    success: true,
    message: 'Logged out successfully.',
    code: 0,
  }).finish();
  return reply.type('application/protobuf').status(200).send(buf);
}


// ---------- Verify Acces Token ----------------
export async function verifyHandler(req, reply) {
  try {
    await req.jwtVerify();                     // throws if invalid / expired
    const buf = VerifyResponse.encode({ valid: true }).finish();
    return reply.type('application/protobuf').send(buf);
  } catch (err) {
    const buf = VerifyResponse.encode({ valid: false }).finish();
    return reply.type('application/protobuf').send(buf);
  }
}