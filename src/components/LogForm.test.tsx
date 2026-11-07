import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogForm } from './LogForm';
import type { Log } from '@/lib/db';

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: () => [],
}));

vi.mock('@/lib/actions', () => ({
    useTags: () => [],
}));

vi.mock('@/components/ui/calendar', () => ({
    Calendar: () => <div>Calendar</div>,
}));

vi.mock('@/lib/i18n/LanguageContext', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('LogForm (editing)', () => {
    it('keeps existing Base64 string photos when saving without changes', async () => {
        // ネイティブ保存済みのログは写真が Base64 文字列になっている
        const initialData: Log = {
            id: 1,
            date: '2026-01-01',
            place: 'Place A',
            people: ['Person A'],
            photos: ['data:image/jpeg;base64,cGhvdG8='],
            thumbnails: ['data:image/jpeg;base64,dGh1bWI='],
        };
        const onSave = vi.fn(() => Promise.resolve());

        render(<LogForm initialData={initialData} onSave={onSave} submitLabel="update" />);

        // 既存のサムネイルがプレビューに出ている
        expect(screen.getAllByAltText('preview')).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: 'update' }));

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            photos: initialData.photos,
            thumbnails: initialData.thumbnails,
        }));
    });
});
