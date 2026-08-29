export function toSundayLabels(d: [number, number, number]) {
  const [y, m, day] = d;
  return {
    shortLabel: `${m}/${day}`,
    fullLabel: `${y}. ${m}. ${day}. (일)`,
  };
}
