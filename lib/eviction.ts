export const EVICTION_NAMES = [
  '12 Men',
  'Alfred Greatness',
  'Anasemi',
  'Gags',
  'Clinton',
  'Rhythdm',
  'Ugochukwu Nwinya',
  'Emmanuella',
  'Elite Empire',
  'Symphonix',
  'Azu Expressions',
  'Manuel Ace',
  'Arigem',
  'Reiy',
]

export const EVICTED_NAMES = [
  'Baritorn',
  'Elebachi',
  'Vaxxie',
]

export function filterEviction<T extends { stageName: string }>(contestants: T[]): T[] {
  return contestants.filter(c =>
    EVICTION_NAMES.some(name => c.stageName.trim().toUpperCase() === name.trim().toUpperCase())
  )
}
