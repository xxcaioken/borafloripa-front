import { test, expect } from '@playwright/test';

/**
 * Layout responsiveness tests.
 * Each test sets a specific viewport and verifies the layout behaves correctly.
 * These tests guard against CSS regressions where wider screens produce worse layouts.
 */

test.describe('Responsive layout', () => {
  // ── Mobile (iPhone SE) ──────────────────────────────────────────────────────
  test.describe('375×667 — mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('bottom-nav visible, sidebar hidden, no horizontal overflow', async ({ page }) => {
      await page.goto('/');

      // Bottom nav should be visible on mobile
      const bottomNav = page.locator('.bottom-nav');
      await expect(bottomNav).toBeVisible();

      // Sidebar should not be visible on mobile
      const sidebar = page.locator('.sidebar');
      await expect(sidebar).not.toBeVisible();

      // No horizontal scrollbar — body width should not exceed viewport
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375 + 2); // 2px tolerance
    });
  });

  // ── Tablet (iPad) ───────────────────────────────────────────────────────────
  test.describe('768×1024 — tablet', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('bottom-nav visible, no horizontal overflow', async ({ page }) => {
      await page.goto('/');

      const bottomNav = page.locator('.bottom-nav');
      await expect(bottomNav).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(768 + 2);
    });

    test('main-content wider than on mobile (not narrower)', async ({ page }) => {
      await page.goto('/');
      const mainContent = page.locator('.main-content').first();
      const box = await mainContent.boundingBox();
      expect(box).not.toBeNull();
      // On tablet (768px), content should be wider than typical mobile max (480px)
      expect(box!.width).toBeGreaterThan(480);
    });
  });

  // ── Laptop (1280×800) ───────────────────────────────────────────────────────
  test.describe('1280×800 — laptop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('sidebar visible, bottom-nav hidden', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('.sidebar');
      await expect(sidebar).toBeVisible();

      const bottomNav = page.locator('.bottom-nav');
      await expect(bottomNav).not.toBeVisible();
    });

    test('main-content uses wide layout (>= 900px)', async ({ page }) => {
      await page.goto('/');
      const mainContent = page.locator('.main-content').first();
      const box = await mainContent.boundingBox();
      expect(box).not.toBeNull();
      // Regression guard: at 1280px content must be wider than at 900px (was 900px at 1100px — the bug)
      expect(box!.width).toBeGreaterThan(900);
    });

    test('feed sidebar grid active at 1280px', async ({ page }) => {
      await page.goto('/');
      const feedLayout = page.locator('.feed-layout').first();
      const display = await feedLayout.evaluate(el =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('grid');
    });

    test('modal centered on desktop', async ({ page }) => {
      await page.goto('/');

      // Click first event card to open modal if present
      const firstCard = page.locator('.event-card').first();
      const cardCount = await firstCard.count();
      if (cardCount === 0) return; // no events seeded — skip

      await firstCard.click();
      const modal = page.locator('.modal-sheet');
      await expect(modal).toBeVisible();

      const box = await modal.boundingBox();
      expect(box).not.toBeNull();
      // Modal should be narrower than viewport (not full-width)
      expect(box!.width).toBeLessThan(1280 * 0.9);
      // Modal should be horizontally centered (roughly)
      const center = box!.x + box!.width / 2;
      expect(center).toBeGreaterThan(1280 * 0.35);
      expect(center).toBeLessThan(1280 * 0.65);
    });
  });

  // ── Desktop (1920×1080) ─────────────────────────────────────────────────────
  test.describe('1920×1080 — desktop', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('content wider than at 1280px (no regression at wide screens)', async ({ page }) => {
      await page.goto('/');
      const mainContent = page.locator('.main-content').first();
      const box = await mainContent.boundingBox();
      expect(box).not.toBeNull();
      // At 1920px content must be at least 1200px wide
      expect(box!.width).toBeGreaterThan(1200);
    });

    test('venue-grid has at least 4 columns on wide desktop', async ({ page }) => {
      await page.goto('/locais');
      const venueGrid = page.locator('.venue-grid').first();
      const gridCount = await venueGrid.count();
      if (gridCount === 0) return;

      const cols = await venueGrid.evaluate(el => {
        const style = window.getComputedStyle(el);
        const tpl = style.getPropertyValue('grid-template-columns');
        return tpl.trim().split(/\s+/).length;
      });
      expect(cols).toBeGreaterThanOrEqual(4);
    });
  });
});
