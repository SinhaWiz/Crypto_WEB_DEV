const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

export function parseDurationMs(value) {
  if (typeof value === 'number') {
    return value * 1000;
  }

  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}
