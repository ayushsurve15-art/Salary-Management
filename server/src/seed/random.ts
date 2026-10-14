export type Random = {
  /** Uniform float in [0, 1). */
  next: () => number;
  /** Uniform integer in [min, max]. */
  int: (min: number, max: number) => number;
  /** Uniform float in [min, max). */
  between: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  weighted: <T>(items: readonly { value: T; weight: number }[]) => T;
};

/** Mulberry32: tiny, fast and good enough for realistic-looking demo data. Same seed, same data. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    between: (min, max) => min + next() * (max - min),
    pick: (items) => {
      const item = items[int(0, items.length - 1)];
      if (item === undefined) throw new Error('Cannot pick from an empty list');
      return item;
    },
    weighted: (items) => {
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      let remaining = next() * total;
      for (const item of items) {
        remaining -= item.weight;
        if (remaining < 0) return item.value;
      }
      const last = items.at(-1);
      if (last === undefined) throw new Error('Cannot pick from an empty list');
      return last.value;
    },
  };
}
