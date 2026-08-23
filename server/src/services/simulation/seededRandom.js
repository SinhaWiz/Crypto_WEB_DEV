import crypto from 'crypto';

/**
 * Deterministic seeded unit value in [0,1] using SHA-256.
 */
export function seededUnit(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
}

/**
 * Standard normal sample via Box-Muller from a seeded hash.
 */
export function seededNormal(seed) {
  const u1 = Math.max(seededUnit(`${seed}:a`), Number.EPSILON);
  const u2 = Math.max(seededUnit(`${seed}:b`), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
