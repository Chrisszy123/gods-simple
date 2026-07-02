export const EVICTION_NAMES = [
  'Rhythdm',
  'Sophiya',
  'symphonix',
  'Elite Empire',
  'Clinton',
  'Reiy',
  'Eric',
]

export const EVICTED_NAMES = [
  'Baritorn',
  'Elebachi',
  'Vaxxie',
  'Alfred Greatness',
  'Azu Expressions',
  'Ugochukwu Nwinya',
  'Arigem',
  'Team Unlimited',
  'Manuel Ace',
  'Emmanuella',
  'Collins Sax',
  '12 Men',
  'Rhythdm',
  'Sophiya',
  'symphonix',
  'Elite Empire',
  'Clinton',
  'Reiy',
  'Eric',
]

export function filterEviction<T extends { stageName: string }>(contestants: T[]): T[] {
  return contestants.filter(c =>
    EVICTION_NAMES.some(name => c.stageName.trim().toUpperCase() === name.trim().toUpperCase())
  )
}
