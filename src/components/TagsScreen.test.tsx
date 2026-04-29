import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagsScreen, tagToHistoryFilter } from './TagsScreen';
import { db } from '@/lib/db';
import 'fake-indexeddb/auto';

// Radix UI が内部で使うので jsdom 環境用に最低限のスタブ
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// 翻訳関数のモック。{name} 形式のパラメータ補間も実装に合わせて再現する。
vi.mock('@/lib/i18n/LanguageContext', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, string>) => {
            if (!params) return key;
            let result = key;
            for (const [k, v] of Object.entries(params)) {
                result = result.replace(`{${k}}`, v);
            }
            return result;
        },
    }),
}));

describe('tagToHistoryFilter', () => {
    it('place タグは { place } に変換される', () => {
        expect(tagToHistoryFilter({ type: 'place', name: 'Pizza Place' }))
            .toEqual({ place: 'Pizza Place' });
    });

    it('person タグは { person } に変換される', () => {
        expect(tagToHistoryFilter({ type: 'person', name: 'Friend A' }))
            .toEqual({ person: 'Friend A' });
    });
});

describe('TagsScreen', () => {
    beforeEach(async () => {
        await db.tags.clear();
        await db.logs.clear();
    });

    it('place タグのバッジを tap すると onSelectTag が変換結果で呼ばれる', async () => {
        await db.tags.add({
            type: 'place',
            name: 'Pizza Place',
            count: 3,
            lastUsed: '2026-04-29',
        });

        const onSelectTag = vi.fn();
        render(<TagsScreen onSelectTag={onSelectTag} />);

        // バッジ内のテキストを起点にラップしている button を取得
        const badgeText = await screen.findByText('Pizza Place');
        const button = badgeText.closest('button');
        expect(button).not.toBeNull();

        fireEvent.click(button!);

        expect(onSelectTag).toHaveBeenCalledTimes(1);
        // tagToHistoryFilter の挙動と整合していることを確認
        expect(onSelectTag).toHaveBeenCalledWith({ place: 'Pizza Place' });
    });

    it('onSelectTag を渡さない場合、バッジは button にラップされない（誤タップ防止）', async () => {
        await db.tags.add({
            type: 'place',
            name: 'Solo Place',
            count: 1,
            lastUsed: '2026-04-29',
        });

        render(<TagsScreen />);

        const badgeText = await screen.findByText('Solo Place');
        // Edit/Delete の <Button> は同階層の sibling なので、closest('button') は
        // 「自身を含む祖先のうち最も近い button」を辿ってもヒットしないはず。
        expect(badgeText.closest('button')).toBeNull();
    });
});
