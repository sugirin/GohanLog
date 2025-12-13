import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordScreen } from './RecordScreen';

// Mock dependencies
vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: () => [],
}));

vi.mock('@/lib/actions', () => ({
    saveLog: vi.fn(),
    useTags: () => [],
}));

// Mock UI components that might cause issues
vi.mock('@/components/ui/calendar', () => ({
    Calendar: () => <div>Calendar</div>,
}));

vi.mock('@/lib/i18n/LanguageContext', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/imageUtils', () => ({
    processImage: vi.fn(() => Promise.resolve({
        original: new Blob(['mock-original']),
        thumbnail: new Blob(['mock-thumbnail'])
    })),
}));

describe('RecordScreen', () => {
    it('renders Clear All and Save buttons with correct styles', () => {
        render(<RecordScreen />);

        const clearButton = screen.getByRole('button', { name: /record.clear/i });
        const saveButton = screen.getByRole('button', { name: /record.save/i });

        expect(clearButton).toBeDefined();
        expect(saveButton).toBeDefined();

        // Check classes for colors
        expect(clearButton.className).toContain('bg-destructive/10');
        expect(clearButton.className).toContain('text-destructive');
        expect(saveButton.className).toContain('bg-primary');
        expect(saveButton.className).toContain('text-primary-foreground');

        // Check classes for height (Checking for flexible height or specific class used in new UI)
        // In previous layout changes, we might have removed fixed h-48. 
        // Let's check for "h-12" which is in the current code (Step 24).
        expect(clearButton.className).toContain('h-12');
        expect(saveButton.className).toContain('h-12');
    });
    it('adds and removes a photo correctly', async () => {
        // Mock URL.createObjectURL
        window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

        const { container } = render(<RecordScreen />);

        // Find file input (hidden)
        // There are two file inputs, one for Camera (capture="environment") and one for Album
        const fileInput = container.querySelector('input[capture="environment"]') as HTMLInputElement;
        expect(fileInput).toBeDefined();

        // Create a mock file
        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

        // Simulate file selection
        await import('@testing-library/react').then(({ fireEvent }) => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        // Wait for image to appear (thumbnails are processed async)
        // The X button has no text, but we can find it by role or class if needed. 
        // Better approach: find by the X icon or class. 
        // Since the button contains an SVG, let's find the button that contains the SVG or use a test id if we added one. 
        // But we didn't add a test id. Let's rely on the fact it's a button in the thumbnail area.

        // Actually, let's look for the image alt text "preview"
        const image = await screen.findByAltText('preview');
        expect(image).toBeInTheDocument();

        // Now find the delete button relative to the image or just find all buttons and pick the one that is not Save/Clear/Date
        // The delete button has a specific class we added: 'bg-black/60'
        // Or we can just click the button that is visually the delete button.

        // Let's use a more robust selector if possible, but for now, let's find the button that wraps the X icon.
        // We can't easily select by icon without aria-label. 
        // Let's assume it's the button that is NOT "Save Memory", "Clear All", or the Date picker.

        const buttons = screen.getAllByRole('button');
        const deleteBtn = buttons.find(btn => btn.className.includes('bg-black/60'));
        expect(deleteBtn).toBeDefined();

        if (deleteBtn) {
            await import('@testing-library/react').then(({ fireEvent }) => {
                fireEvent.click(deleteBtn);
            });
        }

        // Verify image is gone
        const images = screen.queryAllByAltText('preview');
        expect(images.length).toBe(0);
    });
});
