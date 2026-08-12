import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';
import { toPublicUser } from '../utils/toPublicUser.js';
import { writeAdminAudit } from '../services/auditService.js';

const VALID_USER_STATUSES = ['active', 'suspended'];
const VALID_SESSION_STATUSES = ['active', 'paused'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export async function listAdminUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 }).limit(200);
  res.json({ users: users.map(toPublicUser) });
}

export async function updateUserStatus(req, res) {
  const { status } = req.body;

  if (!VALID_USER_STATUSES.includes(status)) {
    throw new AppError('Invalid user status', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { returnDocument: 'after', runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }

  await writeAdminAudit({
    actorId: req.user.id,
    action: 'user.status.update',
    targetUserId: user._id,
    message: `User status changed to ${status}`,
    metadata: { status },
  });

  res.json({ user: toPublicUser(user) });
}

