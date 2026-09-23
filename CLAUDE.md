# affiliatelink — 작업 규칙

애드블스 함대 전체가 공유하는 제휴링크 원본 저장소. 구조와 사용법은 `README.md` 참고.

## 로컬 ↔ 클라우드 동시 개발

1. 작업을 시작할 때 👉 `git pull origin main` 먼저 실행
2. 작업을 마쳤을 때 👉 `git commit` & `git push` 완료

여러 사이트가 이 저장소를 pull해서 쓰므로, 여기서 늦게 push하면 각 사이트가 옛날 데이터로 빌드된다.

## 새 사이트 연결

`templates/sync-affiliate-links.mjs` + `templates/lib-affiliate.example.ts`를 그대로 복사해 쓴다. 새로 설계하지 않는다 — isatipsadbles/teogisa가 이미 쓰는 패턴이다.

## 절대 규칙

- `data/affiliate-links.json`의 `key`(link_key)는 한 번 배포되면 영구불변. 바꾸지 않는다.
- 항목을 지우지 않는다. 폐기는 `status: "retired"` + `issue` 사유 기록으로만 한다. 참조가 남아 있으면 그 key를 쓰는 사이트 빌드가 깨진다.
- 실제 API 자격증명(쿠팡 access_key/secret_key, Threads 토큰 등)을 이 파일에 넣지 않는다. 여러 사이트가 clone하는 공유 저장소라 노출 표면이 크다. 자격증명은 각 사이트의 `wrangler secret`/로컬 전용 파일로만 관리한다.
- `link_key` 중복 금지. 각 사이트의 `scripts/sync-affiliate-links.mjs`가 동기화 시점에 중복을 검사해 빌드를 막는다.
