import { Transaction } from '../models/Transaction.js';

export async function getTransactions(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments({ userId: req.user.id }),
  ]);

  res.json({
    transactions,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
