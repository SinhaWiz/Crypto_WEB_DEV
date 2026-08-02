import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';
import { toPublicUser } from '../utils/toPublicUser.js';

const ALLOWED_FIELDS = ['name', 'difficulty'];

export async function updateMe(req, res) {
  const updates = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body?.[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No updatable fields provided', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }

  res.json({ user: toPublicUser(user) });
}
