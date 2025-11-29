import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryScreen } from './HistoryScreen';
import { db } from '@/lib/db';
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

describe('HistoryScreen', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
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
});
