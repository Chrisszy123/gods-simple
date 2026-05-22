// Set this to when voting should open. Both GODW and Eviction check this.
// Nigeria is WAT = UTC+1, so 6:00 PM Lagos = 17:00 UTC.
export const VOTING_OPENS_AT = '2026-05-22T17:00:00.000Z'

export function isVotingOpen(): boolean {
  return new Date() >= new Date(VOTING_OPENS_AT)
}
