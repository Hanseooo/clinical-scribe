import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TiptapEditor } from './TiptapEditor';

describe('TiptapEditor', () => {
  beforeAll(() => {
    // ProseMirror requires layout APIs that jsdom doesn't implement
    document.elementFromPoint = () => null;
    Element.prototype.getClientRects = () => [] as unknown as DOMRectList;
    Element.prototype.getBoundingClientRect = () => ({
      x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0,
      toJSON: () => ({}),
    }) as DOMRect;
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect = () => ({
      x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  });

  it('renders initial markdown content', async () => {
    render(<TiptapEditor value="# Hello" onChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('calls onChange with markdown after user types', async () => {
    const handleChange = vi.fn();
    render(<TiptapEditor value="" onChange={handleChange} />);
    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'Hello world');
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('\n\nHello world');
    }, { timeout: 1000 });
  });
});
