export const REPOS: readonly string[] = [
  "pmansata7/insightstack",
  // Optional: add "pmansata7/Insightstack_Design" for design-repo PRs
];

export function watches(fullName: string): boolean {
  return REPOS.some((repo) => repo.toLowerCase() === fullName.toLowerCase());
}
