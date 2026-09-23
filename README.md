# affiliatelink — 제휴링크 중앙 저장소

애드블스 함대(isatipsadbles, teogisa 등 adbles.com 계열 사이트)가 공유하는 **제휴링크 단일 소스**.

## 이 저장소로 옮긴 이유

기존에는 맥 로컬 `~/dev/A-factory/affiliate-links.json` 한 곳에만 있었다. 그래서:

- 맥이 아니면(클라우드 세션, 다른 기기) 수정할 수 없었다
- git 이력이 없어 언제 뭐가 왜 바뀌었는지 추적이 안 됐다
- 사이트마다 로컬 파일을 `cp`로만 동기화해, 로컬 파일이 지워지면 그걸로 끝이었다

이제 이 저장소가 원본이다. 각 사이트는 이 저장소를 pull해서 자기 `data/affiliate-links.json`으로 복사해 쓴다.

## 구조

- `data/affiliate-links.json` — 제휴링크 전체. 필드: `key`(영구불변 link_key) · `label` · `cta` · `url` · `network` · `category` · `status`(`active`/`collected`/`review`/`retired`) · `keywords` · `payout` 등 캠페인 메타.
- `topic_map` — 슬러그 끝 토픽 id → link_key 매핑 규칙(이사준비백서 자동생성 페이지용). 실제 매칭 구현은 각 사이트의 `lib/affiliate-match.ts`.

## 어떤 링크든 다 여기로

출처를 가리지 않는다. 다음 전부 같은 스키마(`data/affiliate-links.json`의 `links` 배열)로 들어온다.

- 쿠팡파트너스 같은 **오픈API로 생성**한 딥링크
- 크롬 확장 등 **브라우저 확장프로그램으로 만든** 단축 링크
- 링크프라이스·DB벤스·애드픽·텐핑 같은 **네트워크 대시보드에서 수동 발급**한 링크
- 그 외 어떤 방식으로 받았든 상관없다

새 네트워크가 생기면 `network` 필드에 그 이름을 자유롭게 새로 쓰면 된다 — 정해진 목록이 아니다. 어떻게 만들었는지는 `source` 필드에 남긴다(`coupang-api` / `browser-extension` / `network-dashboard` / `manual`).

### 새 링크 추가 템플릿

```json
{
  "key": "고유-link-key-소문자-하이픈",
  "category": "moving | repair | vpn | gift | ...",
  "label": "사람이 보는 이름",
  "cta": "버튼/링크에 쓸 문구",
  "url": "실제 제휴 URL",
  "network": "coupang | linkprice | dbvence | adpick | tenping | ...",
  "source": "coupang-api | browser-extension | network-dashboard | manual",
  "status": "active",
  "keywords": ["이 링크를 붙일 키워드"],
  "collected_at": "YYYY-MM-DD",
  "updated": "YYYY-MM-DD"
}
```

`key`는 한 번 쓰면 영구불변(아래 규칙 참고). `merchant`/`payout`/`conversion`/`campaign_id` 등은 네트워크가 CPA/CPS 캠페인이면 채워둔다 — 스키마는 `data/affiliate-links.json` 안 `schema_note` 참고.

## 규칙

- **link_key는 영구불변.** 이미 배포된 페이지가 이 key로 링크를 조회한다. 이름을 바꾸지 않는다.
- **폐기 시 지우지 않는다.** JSON에서 항목을 삭제하면 그 key를 참조하던 사이트 빌드가 깨진다. `status: "retired"` + `issue`에 사유를 남긴다.
- **실제 API 자격증명은 여기 넣지 않는다.** 쿠팡 파트너스 `access_key`/`secret_key`, Threads 액세스 토큰 같은 진짜 시크릿은 절대 커밋하지 않는다. 이 저장소는 여러 사이트가 clone해 쓰므로, 키가 들어가면 그만큼 노출 표면이 늘어난다. 자격증명은 계속 각 사이트의 `wrangler secret` / 로컬 전용 파일로만 관리한다.
  - `nutrifit`, `baro-battery`는 지금도 로컬 `~/dev/A-factory/affiliate-links.json`의 `coupang` 블록에서 API 키를 읽는다. 그 파일은 이 저장소와 별개로 맥에만 남겨둔다 — 이번 이관은 **링크 카탈로그**만 대상이다.

## 사이트에서 쓰는 법 (여기서 다시 웹사이트로 뿌리기)

지금 붙은 사이트는 전부 정적 export(Next.js `output:'export'` / Vinext / Astro → Cloudflare Workers·Pages, Vercel)라 페이지 요청마다 이 저장소를 실시간으로 불러오지 않는다. 대신 **빌드 시점에 이 저장소 내용을 그 사이트의 `data/affiliate-links.json`으로 복사**해 커밋해두고, 코드는 그 사본을 `link_key`로 조회한다. 그래서 이 저장소를 고치고 push하는 것만으로 사이트가 자동으로 바뀌지는 않는다 — 아래 3번(사이트에서 sync 실행)까지 해야 반영된다.

1. `templates/sync-affiliate-links.mjs`를 새 사이트의 `scripts/sync-affiliate-links.mjs`로 복사 (이미 있는 사이트는 손댈 필요 없음)
2. `templates/lib-affiliate.example.ts`를 참고해 그 사이트의 `lib/affiliate.ts`에 `getLink(key)` / `linkUrl(key)` 헬퍼를 둔다 — 글이나 버튼에서 URL을 하드코딩하지 않고 이 함수로 가져온다
3. 형제 폴더로 이 저장소를 clone해두면 기본 경로로 바로 동작한다:

```bash
git clone https://github.com/playskang-svg/affiliatelink ~/dev/affiliatelink

cd ~/dev/isatipsadbles   # 또는 teogisa, 또는 새로 붙인 사이트
npm run sync:affiliate    # predev/prebuild 때 자동 실행됨 — data/affiliate-links.json 갱신
git add data/affiliate-links.json && git commit -m "chore: 제휴링크 동기화"
```

4. 그 사이트를 배포하면 새 링크가 반영된다.

## 링크 추가·수정 절차

1. 이 저장소를 pull
2. `data/affiliate-links.json` 수정 (link_key 중복 금지 — 동기화 스크립트가 검사해서 중복이면 빌드를 막는다)
3. commit & push
4. 각 사이트에서 `npm run sync:affiliate` 실행 → 바뀐 `data/affiliate-links.json` 사본을 그 사이트에서 커밋 (CI 빌드는 사이트 저장소에 커밋된 사본을 쓰지, 이 중앙 저장소를 직접 fetch하지 않는다)

## 현재 반영 사이트

- `isatipsadbles` (이사준비백서)
- `teogisa` (애드블스)

다른 사이트도 필요해지면 같은 `scripts/sync-affiliate-links.mjs` 패턴을 그대로 복사해 넣으면 된다.
