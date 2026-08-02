export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    difficulty: user.difficulty,
    status: user.status,
    createdAt: user.createdAt,
  };
}
