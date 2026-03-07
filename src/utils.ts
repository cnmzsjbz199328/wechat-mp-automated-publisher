/**
 * Picks one item from an array using the current day-of-year as a seed.
 * Returns the same item for every call within the same calendar day,
 * so Cron retries stay idempotent. Rotates automatically each day.
 */
export function pickByDate<T>(items: T[]): T {
    if (items.length === 0) throw new Error('pickByDate: empty array');
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
    return items[dayOfYear % items.length];
}
