/** Shared text helpers for brief/asset generation (URL-safe clips, claim cleanup). */

export function stripUrls(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/** Truncate without splitting http(s) URLs mid-token. */
export function safeClip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let cut = max;
  const urlStart = t.lastIndexOf("http", cut);
  if (urlStart > 20 && urlStart < cut) cut = urlStart;
  return t.slice(0, cut).replace(/[\s/._-]+$/g, "").trimEnd();
}

export function clipWithEllipsis(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let cut = max - 1;
  const urlStart = t.lastIndexOf("http", cut);
  if (urlStart > 40 && urlStart < cut) cut = urlStart;
  let slice = t.slice(0, cut).trimEnd();
  slice = slice.replace(/[\s/._-]+$/g, "").trimEnd();
  return slice + "…";
}

/** One-line founder-facing claim without links (for angles / hooks). */
export function shortClaim(claim: string, max = 140): string {
  return safeClip(stripUrls(claim), max);
}

/** Drop proof points that are near-duplicates of the claim or each other. */
export function dedupeLines(lines: string[], claim: string): string[] {
  const claimKey = stripUrls(claim).toLowerCase().slice(0, 80);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = stripUrls(line).toLowerCase().slice(0, 80);
    if (!key || key === claimKey) continue;
    if (seen.has(key)) continue;
    // skip if mostly the same as claim
    if (claimKey && key.includes(claimKey.slice(0, 40))) continue;
    seen.add(key);
    out.push(line.trim());
  }
  return out;
}
