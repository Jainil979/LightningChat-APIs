// models/userModel.js

import sql from '../db/connection.js';

export async function emailExists(email) {
  const rows = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  return rows.length > 0;
}

export async function createUser({ firstName, lastName, email, pwdHash }) {
  await sql`
    INSERT INTO users (first_name, last_name, email, pwd_hash)
    VALUES (${firstName}, ${lastName}, ${email}, ${pwdHash})
  `;
}

export async function findUserByEmail(email) {
  const rows = await sql`
    SELECT user_id, email, pwd_hash, first_name, last_name, token_version
    FROM users
    WHERE email = ${email}
  `;
  return rows[0];
}

export async function findUserById(userId) {
  const rows = await sql`
    SELECT user_id, email, first_name, last_name
    FROM users
    WHERE user_id = ${userId}
  `;
  return rows[0];
}

export async function getUserTokenVersion(userId) {
  const rows = await sql`
    SELECT token_version FROM users WHERE user_id = ${userId}
  `;
  return rows[0]?.token_version;
}

export async function incrementTokenVersion(userId) {
  await sql`
    UPDATE users SET token_version = token_version + 1
    WHERE user_id = ${userId}
  `;
}


export async function updateUserProfile(userId, firstName, lastName) {
  const rows = await sql`
    UPDATE users
    SET first_name = ${firstName}, last_name = ${lastName}
    WHERE user_id = ${userId}
    RETURNING first_name, last_name
  `;
  return rows[0];
}