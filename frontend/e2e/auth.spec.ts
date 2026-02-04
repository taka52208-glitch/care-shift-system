import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');

    // Check hero section
    await expect(page.locator('h1')).toContainText('シフト作成');
    await expect(page.getByRole('link', { name: '無料で始める' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'ログイン' }).first()).toBeVisible();

    // Check features section
    await expect(page.getByText('主な機能')).toBeVisible();

    // Check pricing section
    await expect(page.getByText('料金プラン')).toBeVisible();
    await expect(page.getByText('¥9,800')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '無料で始める' }).first().click();

    await expect(page).toHaveURL('/register');
    await expect(page.getByText('CareShiftに登録')).toBeVisible();
    await expect(page.getByLabel('事業所名')).toBeVisible();
    await expect(page.getByLabel('サブドメイン')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'ログイン' }).first().click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('メールアドレス').fill('admin@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/app/dashboard', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('メールアドレス').fill('wrong@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // Should show error message
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('admin@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page).toHaveURL('/app/dashboard', { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: 'ログアウト' }).click();

    // Should redirect to landing or login
    await expect(page).toHaveURL(/\/(login)?$/);
  });
});

test.describe('Registration Flow', () => {
  test('should check subdomain input format', async ({ page }) => {
    await page.goto('/register');

    // Subdomain input should have pattern validation
    const subdomainInput = page.getByLabel('サブドメイン');
    await expect(subdomainInput).toHaveAttribute('pattern');
    await expect(subdomainInput).toHaveAttribute('required', '');
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.getByRole('button', { name: '無料トライアルを開始' }).click();

    // HTML5 validation should prevent submission
    const tenantNameInput = page.getByLabel('事業所名');
    await expect(tenantNameInput).toHaveAttribute('required', '');
  });
});
