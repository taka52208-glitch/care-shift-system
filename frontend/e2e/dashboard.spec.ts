import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('admin@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/app/dashboard', { timeout: 10000 });
  });

  test('should display dashboard stats', async ({ page }) => {
    // Check stats cards
    await expect(page.getByText('登録スタッフ数')).toBeVisible();
    await expect(page.getByText('現在のシフト月')).toBeVisible();
    await expect(page.getByText('シフト充足率')).toBeVisible();
    await expect(page.getByText('未対応の希望')).toBeVisible();
  });

  test('should display weekly shift overview', async ({ page }) => {
    await expect(page.getByText('今週のシフト概要')).toBeVisible();
  });

  test('should navigate to staff management', async ({ page }) => {
    await page.getByRole('link', { name: /スタッフ/ }).click();
    await expect(page).toHaveURL('/app/staff');
    await expect(page.getByRole('heading', { name: 'スタッフ管理' })).toBeVisible();
  });

  test('should navigate to shift calendar', async ({ page }) => {
    await page.getByRole('link', { name: /シフト表/ }).click();
    await expect(page).toHaveURL('/app/shift');
  });

  test('should navigate to shift patterns', async ({ page }) => {
    await page.getByRole('link', { name: /パターン/ }).click();
    await expect(page).toHaveURL('/app/patterns');
  });

  test('should navigate to constraints', async ({ page }) => {
    await page.getByRole('link', { name: /制約/ }).click();
    await expect(page).toHaveURL('/app/constraints');
  });

  test('should navigate to reports', async ({ page }) => {
    await page.getByRole('link', { name: /レポート/ }).click();
    await expect(page).toHaveURL('/app/reports');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear any stored token
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Try to access protected route
    await page.goto('/app/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect old paths to new /app prefix', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('admin@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/app/dashboard', { timeout: 10000 });

    // Try old path
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/app/dashboard');
  });
});
