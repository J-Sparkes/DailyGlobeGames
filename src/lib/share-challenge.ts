export function sweepChallengeLine(streak: number): string {
  if (streak === 0) {
    return "Tough sweep today — can you do better?";
  }
  const noun = streak === 1 ? "country" : "countries";
  return `I swept ${streak} ${noun} today — can you beat me?`;
}

export function tapChallengeLine(score: number, maxScore: number): string {
  return `I scored ${score}/${maxScore} on Daily Tap — can you beat me?`;
}

export function huntChallengeLine(score: number, won: boolean): string {
  if (won) {
    return `I found today's country on Daily Hunt — can you beat my score of ${score}?`;
  }
  return `Daily Hunt got me today — can you find the hidden country?`;
}
