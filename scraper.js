const { chromium } = require('playwright');

// ============================================================================
// 1. 설정 (Configuration)
// 사이트 주소나 요소(Selector)가 변경되면 이 부분만 수정하세요.
// ============================================================================
const BRAND_URLS = {
  현대: 'https://update.hyundai.com/KR/KO/home',
  기아: 'https://update.kia.com/KR/KO/home',
  제네시스: 'https://update.genesis.com/KR/KO/home',
};

const SELECTORS = {
  carNoInput: 'input[name="carNo"]',
  ownerInput: 'input[name="carOwner"]',
  submitButton: 'text="지금 조회 하기"',
  resultContainer: '.firmware',
};

// ============================================================================
// 2. 입력값 검증 (Validation)
// ============================================================================
function parseArguments() {
  const [brand, carNo, carOwner] = process.argv.slice(2);

  if (!brand || !carNo || !carOwner) {
    console.error('❌ 사용법: node scraper.js "브랜드" "차량번호" "소유주"');
    console.error('예: node scraper.js "현대" "12가3456" "홍길동"');
    process.exit(1);
  }

  const url = BRAND_URLS[brand];
  if (!url) {
    console.error(
      `❌ 지원하지 않는 브랜드입니다. "현대", "기아", "제네시스" 중 하나를 입력하세요.`,
    );
    process.exit(1);
  }

  return { brand, carNo, carOwner, url };
}

// ============================================================================
// 3. 핵심 스크래핑 로직 (Scraping)
// ============================================================================
async function scrapeUpdateInfo({ brand, carNo, carOwner, url }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(
      `🚀 조회를 시작합니다: [${brand}] / 차량번호 [${carNo}] / 소유주 [${carOwner}]`,
    );

    // 3-1. 페이지 이동
    try {
      await page.goto(url);
    } catch {
      throw new Error(
        `[사이트 접속 실패] ${brand} 업데이트 사이트(${url})에 접속할 수 없습니다.`,
      );
    }

    // 3-2. 폼 입력 및 제출
    try {
      console.log(`📝 정보 입력 중...`);
      await page.locator(SELECTORS.carNoInput).fill(carNo);
      await page.locator(SELECTORS.ownerInput).fill(carOwner);
      await page.locator('text="지금 조회 하기"').click();
      console.log('🖱️ "지금 조회하기" 버튼 클릭 완료. 결과를 기다립니다...');
    } catch (e) {
      throw new Error(
        `[입력/클릭 실패] 입력창이나 버튼을 찾을 수 없습니다. (상세: ${e.message})`,
      );
    }

    // 3-3. 결과 대기 및 데이터 추출
    try {
      await page.waitForSelector(SELECTORS.resultContainer);
    } catch {
      throw new Error(
        '[결과 로딩 실패] 정보가 일치하지 않거나 서버 응답이 지연되고 있습니다.',
      );
    }

    const containerText = await page.innerText(SELECTORS.resultContainer);

    // 3-4. 결과 파싱 및 출력
    const dateMatch = containerText.match(/(\d{2}년 \d{1,2}월)/);

    console.log('\n' + '='.repeat(40));
    if (dateMatch) {
      console.log(`🎯 조회 완료: ${brand} ${carNo} (${carOwner})`);
      console.log(`📅 업데이트 배포월: ${dateMatch[0]}`);
    } else {
      console.warn(
        '⚠️ 배포 날짜를 찾을 수 없습니다. (페이지 구조 변경 가능성)',
      );
      console.log('Raw Data:', containerText.trim());
    }
    console.log('='.repeat(40) + '\n');
  } finally {
    await browser.close();
    console.log('👋 브라우저를 종료합니다.');
  }
}

// ============================================================================
// 4. 실행 (Main)
// ============================================================================
async function main() {
  const targetInfo = parseArguments();

  try {
    await scrapeUpdateInfo(targetInfo);
  } catch (error) {
    console.error(`🚨 ${error.message}`);
    process.exitCode = 1;
  }
}

main();
