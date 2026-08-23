# 지름결의서 (Splurge Review)

사고 싶은 걸 입력하면 대출 심사 판정서 양식으로 **승인 / 조건부 승인 / 부결**이 나오는
앱인토스(Apps in Toss) 미니앱. 전직 여신심사역이 만든 진짜(같은) 가짜 심사.

> **이어서 작업하신다면 [`docs/HANDOVER.md`](docs/HANDOVER.md)를 먼저 읽으세요.**
> 진행 상황, 배포 방법, 남은 일, 이미 겪은 함정이 정리되어 있습니다.

## 구조

```
apps-in-toss.config.ts      # 앱인토스 설정 (appName: jireumform)
public/og/                  # 카톡 링크 미리보기 이미지 (판정 등급별 5종)
src/
  rules/jireum-rules.json   # 배점표 + 판정 문구 풀 (모든 점수·문구의 단일 출처)
  engine/                   # 판정 엔진 (순수 함수, UI 무관)
    judge.ts                #   점수 계산 → 등급 → 특수 규칙 → 문구 조합
    judge.test.ts           #   경계값·특수 규칙 유닛 테스트 22건
  toss/bridge.ts            # 앱인토스 SDK 래퍼 (브라우저에선 폴백)
  share/verdictImage.ts     # 판정서를 공유용 PNG로 그리는 캔버스 렌더러
  screens/                  # 결재판(홈) → 결의서 → 심사 중 → 판정서 / 결재 대장
  history.ts, signer.ts     # 결재 대장·서명 저장 (localStorage)
```

- 배점·문구는 전부 `jireum-rules.json`에서 로드 (하드코딩 없음)
- 판정: 70점 이상 승인 / 40~69 조건부 / 40 미만 부결
- 특수 규칙(점수 무시, 배열 순서대로 우선 적용):
  ①300만원 초과 → 권한 초과 ②1만원 이하 첫 지름 → 즉시 승인
  ③"세지 않습니다"+"이미 결제창입니다" → 심사 무의미

## 개발

```bash
npm install
npm run dev        # 로컬 개발 (devtools mock SDK 포함)
npm test           # 판정 엔진 유닛 테스트
npm run build      # 웹 빌드 + .ait 번들 생성
npm run deploy     # 앱인토스 콘솔로 배포 (ait deploy, API 키 필요)
```
