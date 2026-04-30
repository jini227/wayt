export function withCountLabels(options: readonly string[], counts: readonly number[]) {
  return options.map((option, index) => {
    const count = counts[index];
    if (typeof count !== "number" || !Number.isFinite(count)) {
      return option;
    }

    return `${option} ${Math.max(0, Math.trunc(count))}`;
  });
}
