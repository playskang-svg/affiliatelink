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

## 규칙

- **link_key는 영구불변.** 이미 배포된 페이지가 이 key로 링크를 조회한다. 이름을 바꾸지 않는다.
- **폐기 시 지우지 않는다.** JSON에서 항목을 삭제하면 그 key를 참조하던 사이트 빌드가 깨진다. `status: "retired"` + `issue`에 사유를 남긴다.
- **실제 API 자격증명은 여기 넣지 않는다.** 쿠팡 파트너스 `access_key`/`secret_key`, Threads 액세스 토큰 같은 진짜 시크릿은 절대 커밋하지 않는다. 이 저장소는 여러 사이트가 clone해 쓰므로, 키가 들어가면 그만큼 노출 표면이 늘어난다. 자격증명은 계속 각 사이트의 `wrangler secret` / 로컬 전용 파일로만 관리한다.
  - `nutrifit`, `baro-battery`는 지금도 로컬 `~/dev/A-factory/affiliate-links.json`의 `coupang` 블록에서 API 키를 읽는다. 그 파일은 이 저장소와 별개로 맥에만 남겨둔다 — 이번 이관은 **링크 카탈로그**만 대상이다.

## 사이트에서 쓰는 법

각 사이트의 `scripts/sync-affiliate-links.mjs`가 `AFFILIATE_SOURCE` 환경변수(기본값: 형제 폴더 `../affiliatelink/data/affiliate-links.json`)를 읽어 자기 `data/affiliate-links.json`으로 복사한다.

```bash
# ~/dev/ 밑에 이 저장소를 형제 폴더로 clone해두면 기본값으로 바로 동작한다
git clone https://github.com/playskang-svg/affiliatelink ~/dev/affiliatelink

cd ~/dev/isatipsadbles   # 또는 teogisa
npm run sync:affiliate    # predev/prebuild 때 자동 실행됨
```

## 링크 추가·수정 절차

1. 이 저장소를 pull
2. `data/affiliate-links.json` 수정 (link_key 중복 금지 — 동기화 스크립트가 검사해서 중복이면 빌드를 막는다)
3. commit & push
4. 각 사이트에서 `npm run sync:affiliate` 실행 → 바뀐 `data/affiliate-links.json` 사본을 그 사이트에서 커밋 (CI 빌드는 사이트 저장소에 커밋된 사본을 쓰지, 이 중앙 저장소를 직접 fetch하지 않는다)

## 현재 반영 사이트

- `isatipsadbles` (이사준비백서)
- `teogisa` (애드블스)

다른 사이트도 필요해지면 같은 `scripts/sync-affiliate-links.mjs` 패턴을 그대로 복사해 넣으면 된다.
