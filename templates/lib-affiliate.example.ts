// 새 사이트에서 이 저장소의 data/affiliate-links.json을 쓰는 최소 예시.
// isatipsadbles/lib/affiliate.ts를 일반화한 것 — 그대로 복사해 import 경로만
// 프로젝트 alias(@/data/... 또는 상대경로)에 맞게 고치면 된다.
// 프레임워크 무관(Next.js/Astro/Vite 어디서든 JSON import만 되면 동작).

import data from "../data/affiliate-links.json"; // 프로젝트 경로에 맞게 수정

export type AffiliateLink = {
  key: string;
  category: string;
  label: string;
  cta: string;
  url: string;
  network: string;
  status: "active" | "collected" | "review" | "retired";
  issue?: string;
  updated: string;
};

const links = data.links as AffiliateLink[];
const byKey = new Map(links.map((l) => [l.key, l]));

/** link_key로 링크를 가져온다. 없거나 폐기된 키는 빌드/런타임에서 즉시 드러나도록 throw. */
export function getLink(key: string): AffiliateLink {
  const link = byKey.get(key);
  if (!link) throw new Error(`[affiliate] unknown link_key: ${key}`);
  if (link.status === "retired") {
    throw new Error(`[affiliate] retired link_key: ${key} (${link.issue ?? "사용 중단"})`);
  }
  return link;
}

/** url만 필요할 때 (버튼 href 등) */
export function linkUrl(key: string): string {
  return getLink(key).url;
}

export function getLinksByCategory(category: string): AffiliateLink[] {
  return links.filter((l) => l.category === category);
}

/** 제휴링크 앵커에 항상 붙여야 하는 속성 (구글 애드센스/검색 정책) */
export const affiliateRel = "sponsored nofollow noopener noreferrer";
export const affiliateTarget = "_blank";

/**
 * 이 URL이 등록된 제휴 링크의 호스트인지 판정한다.
 * 본문 마크다운 링크에 rel="sponsored"를 자동으로 붙일지 결정할 때 쓴다.
 */
export const affiliateHosts = new Set(
  links
    .map((l) => {
      try {
        return new URL(l.url).host.toLowerCase();
      } catch {
        return "";
      }
    })
    .filter(Boolean),
);

export function isAffiliateUrl(href: string): boolean {
  try {
    return affiliateHosts.has(new URL(href).host.toLowerCase());
  } catch {
    return false;
  }
}
