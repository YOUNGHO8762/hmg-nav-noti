const { chromium } = require('playwright');

// 1. 인자값 체크 및 할당
const [brand, model, generationYear] = process.argv.slice(2);

if (!brand || !model || !generationYear) {
  console.error('❌ 사용법: node scraper.js "브랜드" "모델" "세대/생산연식"');
  console.error('예: node scraper.js "현대" "아반떼" "The new AVANTE"');
  console.error('예: node scraper.js "기아" "K5" "3세대 K5"');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(
      `🚀 조회를 시작합니다: [${brand}] / [${model}] / [${generationYear}]`,
    );

    // 브랜드 업데이트 홈 접속
    let url = '';
    if (brand === '현대') {
      url = 'https://update.hyundai.com/KR/KO/home';
    } else if (brand === '기아') {
      url = 'https://update.kia.com/KR/KO/home';
    } else {
      throw new Error(
        '지원하지 않는 브랜드입니다. "현대" 또는 "기아"를 입력하세요.',
      );
    }

    try {
      await page.goto(url);
    } catch {
      throw new Error(
        `[사이트 접속 실패] ${brand} 업데이트 사이트(${url})에 접속할 수 없습니다. 사이트 점검 또는 네트워크 문제일 수 있습니다.`,
      );
    }

    // 2. 차종 선택 모달 열기
    try {
      await page
        .getByRole('button', { name: '차종 선택해서 조회하기' })
        .click();
      console.log('✅ 단계 1: 차종 선택 모달 오픈');
    } catch {
      throw new Error(
        '[페이지 구조 변경] "차종 선택해서 조회하기" 버튼을 찾을 수 없습니다. 사이트 UI가 변경되었을 수 있습니다.',
      );
    }

    // 3. 모델 선택 (정확한 텍스트 매칭을 위해 filter 활용)
    try {
      const modelButton = page
        .locator('button')
        .filter({ hasText: new RegExp(`^${model}$`) });
      await modelButton.waitFor({ state: 'visible', timeout: 10000 });
      await modelButton.click();
      console.log(`✅ 단계 2: 모델(${model}) 클릭 완료`);
    } catch {
      throw new Error(
        `[모델명 오류] "${model}" 모델을 찾을 수 없습니다. 모델명을 확인해주세요. (예: 아반떼, 그랜저, 아이오닉 6)`,
      );
    }

    // 4. 다음 단계 이동
    await page.getByRole('button', { name: '다음' }).click();

    // 5. 세대/생산연식 선택
    try {
      const generationYearButton = page
        .locator('button')
        .filter({ hasText: new RegExp(`^${generationYear}$`) });
      await generationYearButton.waitFor({ state: 'visible', timeout: 10000 });
      await generationYearButton.click();
      console.log(`✅ 단계 3: 세대/생산연식(${generationYear}) 클릭 완료`);
    } catch {
      throw new Error(
        `[세대/생산연식 오류] "${model}" 모델에서 "${generationYear}" 세대/생산연식을 찾을 수 없습니다. 세대/생산연식 값을 확인해주세요.`,
      );
    }

    // 6. 조회 버튼 클릭 (마지막 버튼 선택 로직 유지)
    await page.locator('button:has-text("조회")').last().click();
    console.log('✅ 단계 4: 조회 요청 전송');

    // 7. 결과 페이지 대기 및 데이터 추출
    try {
      await page.waitForSelector('.firmware', { timeout: 10000 });
    } catch {
      throw new Error(
        '[결과 로딩 실패] 업데이트 결과 페이지를 불러올 수 없습니다. 페이지 구조가 변경되었거나 서버 응답이 느릴 수 있습니다.',
      );
    }

    const containerText = await page.innerText('.firmware');

    // 8. 정규표현식으로 날짜 추출
    const dateMatch = containerText.match(/(\d{2}년 \d{1,2}월)/);

    console.log('\n' + '='.repeat(40));
    if (dateMatch) {
      console.log(`🎯 결과: ${model} (${generationYear})`);
      console.log(`📅 업데이트 배포월: ${dateMatch[0]}`);
    } else {
      console.warn(
        '⚠️ 배포 날짜를 찾을 수 없습니다. (페이지 구조 변경 가능성)',
      );
      console.log('Raw Data:', containerText.trim());
    }
    console.log('='.repeat(40) + '\n');
  } catch (error) {
    console.error(`🚨 ${error.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('👋 브라우저를 종료합니다.');
  }
})();
