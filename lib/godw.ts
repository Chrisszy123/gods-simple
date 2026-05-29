// Edit this list to change which contestants appear on the GODW page.
export const GODW_NAMES = [
  'Hero',
  'Eric',
  'Street Brothers',
  'Thelordsmouthpiece',
  'DeeplyDan',
  'Team Unlimited',
]

export function filterGodw<T extends { stageName: string }>(contestants: T[]): T[] {
  return contestants.filter(c =>
    GODW_NAMES.some(name => c.stageName.trim().toUpperCase() === name.trim().toUpperCase())
  )
}
