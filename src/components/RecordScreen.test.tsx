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

describe('RecordScreen', () => {
    it('renders Clear All and Save buttons with correct styles', () => {
        render(<RecordScreen />);

        const clearButton = screen.getByRole('button', { name: /Clear All/i });
        const saveButton = screen.getByRole('button', { name: /Save Memory/i });

        expect(clearButton).toBeDefined();
        expect(saveButton).toBeDefined();

        // Check classes for colors
        expect(clearButton.className).toContain('!bg-red-100');
        expect(clearButton.className).toContain('!text-red-900');
        expect(saveButton.className).toContain('!bg-blue-800');
        expect(saveButton.className).toContain('!text-white');

        // Check classes for height
        expect(clearButton.className).toContain('h-24');
        expect(saveButton.className).toContain('h-24');
    });
});
