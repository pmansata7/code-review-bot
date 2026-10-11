export const REPOS: readonly string[] = [
  "pmansata7/brainstack",
  "pmansata7/ember-app",
  "pmansata7/insightstack",
  "pmansata7/Jobstack",
  "pmansata7/lawstack",
  "pmansata7/notestack.fyi",
  "pmansata7/promeet-me",
  "pmansata7/protolink.site",
  // Optional: add design repos for design-repo PRs, e.g. "pmansata7/Insightstack_Design"
];

export function watches(fullName: string): boolean {
  return REPOS.some((repo) => repo.toLowerCase() === fullName.toLowerCase());
}
