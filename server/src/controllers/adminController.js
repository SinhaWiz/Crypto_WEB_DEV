import { User } from '../models/User.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';
import { toPublicUser } from '../utils/toPublicUser.js';
import { createSimulationSeed } from '../services/simulation/engine.js';
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

export async function updateSimulation(req, res) {
  const updates = {};
  const userUpdates = {};

  if (req.body.status !== undefined) {
    if (!VALID_SESSION_STATUSES.includes(req.body.status)) {
      throw new AppError('Invalid simulation status', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    updates.status = req.body.status;
  }

  if (req.body.difficulty !== undefined) {
    if (!VALID_DIFFICULTIES.includes(req.body.difficulty)) {
      throw new AppError('Invalid simulation difficulty', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    updates.difficulty = req.body.difficulty;
    userUpdates.difficulty = req.body.difficulty;
  }

  if (req.body.resetSeeds === true) {
    const sessions = await SimulationSession.find();
    await Promise.all(
      sessions.map((session) =>
        SimulationSession.updateOne({ _id: session._id }, { $set: { ...updates, seed: createSimulationSeed(session.userId) } })
      )
    );
  } else if (Object.keys(updates).length > 0) {
    await SimulationSession.updateMany({}, { $set: updates });
  } else {
    throw new AppError('No simulation changes provided', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (Object.keys(userUpdates).length > 0) {
    await User.updateMany({}, { $set: userUpdates });
  }

  const summary = {
    active: await SimulationSession.countDocuments({ status: 'active' }),
    paused: await SimulationSession.countDocuments({ status: 'paused' }),
  };

  await writeAdminAudit({
    actorId: req.user.id,
    action: 'simulation.update',
    message: 'Simulation settings updated',
    metadata: { updates, resetSeeds: req.body.resetSeeds === true, summary },
  });

  res.json({ simulation: { ...summary, updates } });
}
