const MEDALS = ["🥇", "🥈", "🥉"];

export default function rankDisplay(rank: number) {
  const medal = MEDALS[rank - 1];
  if (medal) return medal;
  return `#${rank.toString()}`;
}
