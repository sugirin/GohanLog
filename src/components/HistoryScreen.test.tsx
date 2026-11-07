import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HistoryScreen } from './HistoryScreen';
import { db } from '@/lib/db';
import { resetBackHandlersForTest, runBackHandler } from '@/lib/backButton';
import 'fake-indexeddb/auto';

// Mock URL.createObjectURL
(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
(globalThis as any).URL.revokeObjectURL = vi.fn();

// Mock ResizeObserver
(globalThis as any).ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

vi.mock('@/lib/i18n/LanguageContext', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('HistoryScreen', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
        resetBackHandlersForTest();
    });

    it('should display multiple thumbnails for a log', async () => {
        // Create mock blobs
        const thumb1 = new Blob(['thumb1'], { type: 'image/jpeg' });
        const thumb2 = new Blob(['thumb2'], { type: 'image/jpeg' });
        const photo1 = new Blob(['photo1'], { type: 'image/jpeg' });
        const photo2 = new Blob(['photo2'], { type: 'image/jpeg' });

        // Add a log with multiple images
        await db.logs.add({
            date: '2023-01-01',
            place: 'Test Restaurant',
            people: ['Friend A'],
            photos: [photo1, photo2],
            thumbnails: [thumb1, thumb2]
        });

        render(<HistoryScreen />);

        // Wait for the log to appear
        await waitFor(() => {
            expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
        });

        // Check if multiple images are rendered
        // We look for images with alt text containing the place name
        const images = screen.getAllByAltText(/Test Restaurant/);
        expect(images).toHaveLength(2);

        expect(images[0]).toHaveAttribute('src', 'blob:mock-url');
        expect(images[1]).toHaveAttribute('src', 'blob:mock-url');
    });

    it('戻るボタンで写真プレビューを閉じる', async () => {
        const thumb = new Blob(['thumb'], { type: 'image/jpeg' });
        const photo = new Blob(['photo'], { type: 'image/jpeg' });
        await db.logs.add({
            date: '2023-02-01',
            place: 'Preview Cafe',
            people: [],
            photos: [photo],
            thumbnails: [thumb],
        });

        render(<HistoryScreen />);
        await waitFor(() => {
            expect(screen.getByText('Preview Cafe')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByAltText(/Preview Cafe/));
        expect(screen.getByAltText('Full size')).toBeInTheDocument();

        act(() => {
            expect(runBackHandler()).toBe(true);
        });
        expect(screen.queryByAltText('Full size')).not.toBeInTheDocument();
        // 閉じたあとは登録が外れている
        expect(runBackHandler()).toBe(false);
    });

    describe('pendingFilter prop', () => {
        beforeEach(async () => {
            // 場所と人物が異なる 3 件のログを用意
            await db.logs.bulkAdd([
                { date: '2023-03-01', place: 'Pizza Place', people: ['Friend A'] },
                { date: '2023-03-02', place: 'Sushi Bar', people: ['Friend B'] },
                { date: '2023-03-03', place: 'Pizza Place', people: ['Friend C'] },
            ]);
        });

        it('place を渡すと、その place のログだけが表示され、onFilterApplied が呼ばれる', async () => {
            const onFilterApplied = vi.fn();

            render(
                <HistoryScreen
                    pendingFilter={{ place: 'Pizza Place' }}
                    onFilterApplied={onFilterApplied}
                />
            );

            // Pizza Place のログ（2件）が表示される
            await waitFor(() => {
                expect(screen.getAllByText('Pizza Place').length).toBeGreaterThan(0);
            });

            // Sushi Bar は表示されない
            expect(screen.queryByText('Sushi Bar')).not.toBeInTheDocument();

            // 親に「適用済み」を通知している
            expect(onFilterApplied).toHaveBeenCalled();
        });

        it('person を渡すと、その人を含むログだけが表示される', async () => {
            const onFilterApplied = vi.fn();

            render(
                <HistoryScreen
                    pendingFilter={{ person: 'Friend B' }}
                    onFilterApplied={onFilterApplied}
                />
            );

            // 初期描画では一瞬全件出る → useEffect でフィルタ適用 → useLiveQuery 再評価
            // という順なので、「Sushi Bar が残り、他の人物は消える」状態が安定するまで待つ
            await waitFor(() => {
                expect(screen.getByText('Sushi Bar')).toBeInTheDocument();
                expect(screen.queryByText('Friend A')).not.toBeInTheDocument();
                expect(screen.queryByText('Friend C')).not.toBeInTheDocument();
            });

            expect(onFilterApplied).toHaveBeenCalled();
        });

        it('pendingFilter なしの場合は全件表示される', async () => {
            render(<HistoryScreen />);

            await waitFor(() => {
                expect(screen.getByText('Sushi Bar')).toBeInTheDocument();
            });

            expect(screen.getAllByText('Pizza Place').length).toBe(2);
        });
    });
});
