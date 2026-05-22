export const EVICTION_NAMES = [
  'Rhythdm',
  'SYMPHONIX',
  'Baritorn',
  'VAXXIE',
  'ALFRED GREATNESS',
  'ELEBACHI',
]

export function filterEviction<T extends { stageName: string }>(contestants: T[]): T[] {
  return contestants.filter(c =>
    EVICTION_NAMES.some(name => c.stageName.trim().toUpperCase() === name.trim().toUpperCase())
  )
}
