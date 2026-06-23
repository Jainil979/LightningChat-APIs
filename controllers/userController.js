import * as userModel from '../models/userModel.js';
import { UpdateProfileResponse } from '../generated/auth.js';

export async function updateProfileHandler(req, reply) {
  const { userId } = req.user;
  const { firstName, lastName } = req.body;

  const updated = await userModel.updateUserProfile(userId, firstName, lastName);

  const buf = UpdateProfileResponse.encode({
    success: true,
    message: 'Profile updated successfully.',
    firstName: updated.first_name,
    lastName: updated.last_name,
  }).finish();
  return reply.type('application/protobuf').status(200).send(buf);
}