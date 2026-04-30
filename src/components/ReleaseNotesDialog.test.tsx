import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReleaseNotesDialog } from './ReleaseNotesDialog';
import type { ReleaseNote } from '../lib/releaseNotes';

vi.mock('@/lib/i18n/LanguageContext', () => ({
    useTranslation: () => ({
        language: 'ja' as const,
        setLanguage: () => { },
        t: (key: string, params?: Record<string, string>) => {
            if (params) {
                let result = key;
                Object.entries(params).forEach(([k, v]) => {
                    result += `:${k}=${v}`;
                });
                return result;
            }
            return key;
        },
    }),
}));

const sampleNote: ReleaseNote = {
    version: '1.1.0',
    ja: { title: '新機能', bullets: ['機能A を追加', '機能B を改善'] },
    en: { title: 'New', bullets: ['Added A', 'Improved B'] },
};

describe('ReleaseNotesDialog', () => {
    it('現在の言語の本文を表示する（ja）', () => {
        render(<ReleaseNotesDialog note={sampleNote} onClose={() => { }} />);
        expect(screen.getByText('新機能')).toBeDefined();
        expect(screen.getByText('機能A を追加')).toBeDefined();
        expect(screen.getByText('機能B を改善')).toBeDefined();
    });

    it('バージョンラベルにバージョンが入る', () => {
        render(<ReleaseNotesDialog note={sampleNote} onClose={() => { }} />);
        // モック t() は params をつなげて返す
        expect(
            screen.getByText('releaseNotes.versionLabel:version=1.1.0'),
        ).toBeDefined();
    });

    it('閉じるボタンを押すと onClose が呼ばれる', () => {
        const onClose = vi.fn();
        render(<ReleaseNotesDialog note={sampleNote} onClose={onClose} />);
        const closeButtons = screen.getAllByRole('button', {
            name: /releaseNotes\.closeButton/i,
        });
        // 右上の X ボタンとフッターのボタン両方
        expect(closeButtons.length).toBeGreaterThanOrEqual(1);
        fireEvent.click(closeButtons[closeButtons.length - 1]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('bullets が空のときは ul を描画しない', () => {
        const emptyNote: ReleaseNote = {
            version: '1.0.1',
            ja: { title: 'タイトルのみ', bullets: [] },
            en: { title: 'Title only', bullets: [] },
        };
        const { container } = render(
            <ReleaseNotesDialog note={emptyNote} onClose={() => { }} />,
        );
        expect(screen.getByText('タイトルのみ')).toBeDefined();
        expect(container.querySelector('ul')).toBeNull();
    });
});
