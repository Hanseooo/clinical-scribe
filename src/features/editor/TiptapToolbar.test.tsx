import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TiptapToolbar } from './TiptapToolbar';

vi.mock('@tiptap/react', () => ({
  useCurrentEditor: vi.fn(),
}));

import { useCurrentEditor } from '@tiptap/react';

function createMockEditor(overrides: Record<string, unknown> = {}) {
  const chain = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    undo: vi.fn().mockReturnThis(),
    redo: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  return {
    chain: vi.fn(() => chain),
    isActive: vi.fn(() => false),
    can: vi.fn(() => ({
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
    })),
    ...overrides,
  };
}

describe('TiptapToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all toolbar buttons', () => {
    const editor = createMockEditor();
    vi.mocked(useCurrentEditor).mockReturnValue({ editor } as unknown as ReturnType<typeof useCurrentEditor>);

    render(<TiptapToolbar />);

    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /heading 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /heading 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /heading 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bullet list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ordered list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('returns null when editor is not available', () => {
    vi.mocked(useCurrentEditor).mockReturnValue({ editor: null } as unknown as ReturnType<typeof useCurrentEditor>);
    const { container } = render(<TiptapToolbar />);
    expect(container.firstChild).toBeNull();
  });

  it('clicking Bold button calls toggleBold chain', async () => {
    const editor = createMockEditor();
    vi.mocked(useCurrentEditor).mockReturnValue({ editor } as unknown as ReturnType<typeof useCurrentEditor>);

    render(<TiptapToolbar />);
    const boldButton = screen.getByRole('button', { name: /bold/i });

    await userEvent.click(boldButton);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor.chain().focus).toHaveBeenCalled();
    expect(editor.chain().focus().toggleBold).toHaveBeenCalled();
    expect(editor.chain().focus().toggleBold().run).toHaveBeenCalled();
  });

  it('reflects active state via aria-pressed on toggle buttons', () => {
    const editor = createMockEditor({
      isActive: vi.fn((name: string, attrs?: Record<string, unknown>) => {
        if (name === 'bold') return true;
        if (name === 'heading' && attrs?.level === 2) return true;
        return false;
      }),
    });
    vi.mocked(useCurrentEditor).mockReturnValue({ editor } as unknown as ReturnType<typeof useCurrentEditor>);

    render(<TiptapToolbar />);

    expect(screen.getByRole('button', { name: /bold/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /italic/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /heading 1/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /heading 2/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables undo button when can().undo() is false', () => {
    const editor = createMockEditor({
      can: vi.fn(() => ({
        undo: vi.fn(() => false),
        redo: vi.fn(() => true),
      })),
    });
    vi.mocked(useCurrentEditor).mockReturnValue({ editor } as unknown as ReturnType<typeof useCurrentEditor>);

    render(<TiptapToolbar />);

    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /redo/i })).not.toBeDisabled();
  });

  it('disables redo button when can().redo() is false', () => {
    const editor = createMockEditor({
      can: vi.fn(() => ({
        undo: vi.fn(() => true),
        redo: vi.fn(() => false),
      })),
    });
    vi.mocked(useCurrentEditor).mockReturnValue({ editor } as unknown as ReturnType<typeof useCurrentEditor>);

    render(<TiptapToolbar />);

    expect(screen.getByRole('button', { name: /redo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /undo/i })).not.toBeDisabled();
  });
});
