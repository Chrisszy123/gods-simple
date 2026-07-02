// Nigeria is WAT = UTC+1
// 6:00 PM Lagos = 17:00 UTC | 12:00 PM Lagos = 11:00 UTC
export const VOTING_OPENS_AT  = '2026-07-02T20:25:00.000Z'
export const VOTING_CLOSES_AT = '2026-07-02T20:28:00.000Z'

export function isVotingOpen(): boolean {
  const now = new Date()
  return now >= new Date(VOTING_OPENS_AT) && now < new Date(VOTING_CLOSES_AT)
}
