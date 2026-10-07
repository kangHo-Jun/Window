const { test, expect } = require('@playwright/test');

test('loading quote bubble transitions to quote card', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080');

  await page.getByRole('button', { name: '아파트' }).click();
  await page.getByRole('button', { name: '30평대' }).click();
  await page.getByRole('button', { name: '확장형', exact: true }).click();

  await page.getByRole('button', { name: '거실' }).click();
  await page.getByRole('button', { name: '선택 완료' }).click();

  await expect(page.getByText('잠깐만요, 견적을 계산하고 있어요')).toBeVisible();
  await page.screenshot({ path: '/private/tmp/loading-quote-step1.png', fullPage: true });

  await expect(page.getByText('견적 준비가 완료됐어요')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: '/private/tmp/loading-quote-step2.png', fullPage: true });

  await expect(page.getByRole('button', { name: '상세 견적 보기' })).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: '/private/tmp/loading-quote-result.png', fullPage: true });
});
