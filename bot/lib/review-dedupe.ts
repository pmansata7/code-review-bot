import type { HostKvApi } from "@cursor/bdk/kv";

export function reviewDoneKey(fullName: string, prNumber: number, headSha: string): string {
  return `review-done:${fullName}#${prNumber}:${headSha}`;
}

export async function alreadyReviewedHead(
  kv: HostKvApi,
  fullName: string,
  prNumber: number,
  headSha: string,
): Promise<boolean> {
  const value = await kv.get(reviewDoneKey(fullName, prNumber, headSha));
  return value !== undefined;
}

export async function markReviewedHead(
  kv: HostKvApi,
  fullName: string,
  prNumber: number,
  headSha: string,
): Promise<void> {
  await kv.put(reviewDoneKey(fullName, prNumber, headSha), {
    reviewedAt: Date.now(),
    headSha,
  });
}
