export const EVICTION_NAMES = [
  'Emmanuella',
  '12 Men',
  'Hero',
  'Rhythdm',
  'Sophiya',
  'Collins Sax',
  'Manuel Ace',
  'Thelordsmouthpiece',
]

export const EVICTED_NAMES = [
  'Baritorn',
  'Elebachi',
  'Vaxxie',
  'Alfred Greatness',
  'Azu Expressions',
  'Ugochukwu Nwinya',
  'Arigem',
]

export function filterEviction<T extends { stageName: string }>(contestants: T[]): T[] {
  return contestants.filter(c =>
    EVICTION_NAMES.some(name => c.stageName.trim().toUpperCase() === name.trim().toUpperCase())
  )
}
