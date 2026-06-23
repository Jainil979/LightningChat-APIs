
// controllers/contactsController.js

import * as userModel from '../models/userModel.js';
import { AddContactResponse } from '../generated/auth.js';

/**
 * POST /api/contacts/add
 * Protected by authGuard – only authenticated users can add contacts.
 */
export async function addContactHandler(req, reply) {
  // req.user is set by authGuard (jwtVerify)
  const currentUserId = req.user.userId;
  const { email } = req.body;   // already trimmed & lowercased

  // Blazing‑fast lookup by email (unique index)
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    const buf = AddContactResponse.encode({
      success: false,
      message: 'No user found with this email address.',
    }).finish();
    return reply.type('application/protobuf').status(404).send(buf);
  }

  // Prevent self‑addition
  if (user.user_id === currentUserId) {
    const buf = AddContactResponse.encode({
      success: false,
      message: 'You cannot add yourself as a contact.',
    }).finish();
    return reply.type('application/protobuf').status(400).send(buf);
  }

  // Success – return the contact’s user ID and full name
  const buf = AddContactResponse.encode({
    success: true,
    message: 'Contact found.',
    userId: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
  }).finish();
  return reply.type('application/protobuf').status(200).send(buf);
}