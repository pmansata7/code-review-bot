export const REPOS: readonly string[] = ["your-org/service-a", "your-org/service-b"];

export function watches(fullName: string): boolean {
  return REPOS.some((repo) => repo.toLowerCase() === fullName.toLowerCase());
}
