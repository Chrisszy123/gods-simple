// Set to false on weeks with no GODW vote — the page will show the last winner instead.
export const GODW_ACTIVE_THIS_WEEK = false
export const LAST_GODW_WINNER = 'Deeplydan'

// Edit this list to change which contestants appear on the GODW page.
export const GODW_NAMES = [
  'Anasemi',
  'GAGS',
  'Street Brothers',
  'Deeplydan',
  'Clinton',
  'Elite Empire',
]

export function filterGodw<T extends { stageName: string }>(contestants: T[]): T[] {
  return contestants.filter(c =>
    GODW_NAMES.some(name => c.stageName.trim().toUpperCase() === name.trim().toUpperCase())
  )
}
