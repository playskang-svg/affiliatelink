#!/usr/bin/env node
/**
 * 제휴링크 중앙 저장소(playskang-svg/affiliatelink)를 이 사이트로 동기화한다.
 *
 * 새 사이트에 붙일 때: 이 파일을 사이트 저장소의 scripts/sync-affiliate-links.mjs로
 * 복사하고, package.json에 다음을 추가한다.
 *
 *   "scripts": {
 *     "sync:affiliate": "node scripts/sync-affiliate-links.mjs",
 *     "predev": "npm run sync:affiliate",
 *     "prebuild": "npm run sync:affiliate"
 *   }
 *
 * 소스: ../affiliatelink/data/affiliate-links.json  (AFFILIATE_SOURCE 로 덮어쓸 수 있음)
 * 대상: data/affiliate-links.json                   (커밋됨 — CI 빌드는 이 사본을 쓴다)
 *
 * 혹시 모를 자격증명 자리표시 블록은 방어적으로 제거하고 복사한다.
 * (중앙 저장소 자체에는 애초에 API 키를 두지 않는 게 원칙 — README.md 참고.)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SENSITIVE_KEYS = ["coupang", "threads", "secrets", "credentials"];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source =
  process.env.AFFILIATE_SOURCE ?? resolve(root, "../affiliatelink/data/affiliate-links.json");
const target = resolve(root, "data/affiliate-links.json");

if (!existsSync(source)) {
  if (existsSync(target)) {
    console.warn(`[affiliate] 소스 없음 (${source}) — 기존 data/affiliate-links.json 사용`);
    process.exit(0);
  }
  console.error(`[affiliate] 소스도 사본도 없음: ${source}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(source, "utf8"));
for (const key of SENSITIVE_KEYS) delete data[key];

if (!Array.isArray(data.links) || data.links.length === 0) {
  console.error("[affiliate] links 배열이 비어 있다. 동기화 중단.");
  process.exit(1);
}

const dupes = data.links.map((l) => l.key).filter((k, i, a) => a.indexOf(k) !== i);
if (dupes.length) {
  console.error(`[affiliate] link_key 중복: ${dupes.join(", ")}`);
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(data, null, 2) + "\n");

const review = data.links.filter((l) => l.status === "review");
console.log(`[affiliate] ${data.links.length}개 링크 동기화 (updated: ${data.updated})`);
if (review.length) {
  console.warn(`[affiliate] 확인 필요 ${review.length}건: ${review.map((l) => l.key).join(", ")}`);
}
