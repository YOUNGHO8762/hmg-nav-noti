# Hyundai Navigation Update Notifier

현대자동차 내비게이션 공식 업데이트 웹사이트에서 특정 차종 및 연식의 최신 업데이트 배포월을 확인하고, 새로운 업데이트가 감지되면 슬랙(Slack)으로 알림을 보내주는 자동화 스크립트입니다.

## 🚀 주요 기능

- **자동 스크래핑**: Playwright를 이용해 [현대자동차 내비게이션 업데이트 웹사이트](https://update.hyundai.com/KR/KO/home)에서 데이터를 간편하게 조회합니다.
- **GitHub Actions 자동화**: 매일 자정에 자동으로 스크립트를 실행하여 최신 데이터를 확인합니다.
- **캐싱 및 상태 비교**: 확인한 업데이트 배포 월을 캐싱하여, 이전 데이터와 비교 후 변동 사항이 있을 때만 업데이트 알림을 생성합니다.
- **Slack 알림**: 신규 업데이트가 감지되거나 변동이 없을 때 슬랙 웹훅(Webhook)을 통해 요약 알림을 전송합니다.

## 🧰 기술 스택

- **Node.js**
- **pnpm**: 패키지 매니저
- **Playwright**: 헤드리스 브라우저 웹 스크래핑
- **GitHub Actions**: CI 스케줄링 및 자동화

## 💻 로컬에서 실행하는 방법

### 1. 패키지 설치

이 프로젝트는 `pnpm`을 사용합니다. pnpm이 없다면 먼저 설치해주세요.

```bash
# 의존성 설치
pnpm install

# Playwright 브라우저 바이너리 설치
npx playwright install chromium
```

### 2. 스크립트 실행

명령어 뒤에 `"모델명"`과 `"세대/생산연식"`을 인자로 넘겨서 실행할 수 있습니다.

```bash
pnpm start "아반떼" "The new AVANTE"
```

또는 직접 node 명령어로 실행할 수도 있습니다.

```bash
node scraper.js "아반떼" "The new AVANTE"
```

## ⚙️ GitHub Actions 연동 및 사용법 (자동화)

GitHub Repository를 포크(Fork)하여 본인의 차량에 맞게 설정을 변경하고 구성할 수 있습니다.

### 1. 차량 정보 수정

`.github/workflows/scraper.yml` 파일을 열고, `env` 환경변수 부분의 차량 모델과 연식을 본인의 차량에 맞게 수정합니다.

```yaml
env:
  CAR_MODEL: '아반떼' # <--- [모델명 입력] 예: 아반떼, 그랜저, 아이오닉 6
  CAR_YEAR: 'The new AVANTE' # <--- [연식/세부명 입력] 예: The new AVANTE, (IG) 하이브리드
```

### 2. Slack Webhook URL 추가

업데이트 알림을 받으려면 GitHub Repository의 Secret을 설정해야 합니다.

1. Repository의 **Settings** > **Secrets and variables** > **Actions**로 이동합니다.
2. **New repository secret**을 클릭합니다.
3. Name에 `SLACK_WEBHOOK_URL`을 입력하고, Value에 슬랙에서 발급받은 웹훅 URL을 입력합니다.

### 3. 워크플로우 실행 확인

- **자동 실행**: 매일 한국시간 09:00(UTC 00:00)에 스케줄러에 의해 자동 실행됩니다.
- **수동 실행**: Repository의 **Actions** 탭에서 `Hyundai Update Monitor` 워크플로우를 선택하고 **Run workflow** 버튼을 눌러 수동으로 즉시 확인할 수 있습니다.
