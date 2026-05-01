'use client';

import { useCurrentEditor } from '@tiptap/react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Undo, Redo } from 'lucide-react';

const toggleButtonClass = (isActive: boolean) =>
  `p-2 rounded hover:bg-muted transition-colors ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`;

const actionButtonClass = (isDisabled: boolean) =>
  `p-2 rounded transition-colors text-muted-foreground ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`;

export function TiptapToolbar() {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={toggleButtonClass(editor.isActive('bold'))}
        aria-label="Bold"
        aria-pressed={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={toggleButtonClass(editor.isActive('italic'))}
        aria-label="Italic"
        aria-pressed={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={toggleButtonClass(editor.isActive('heading', { level: 1 }))}
        aria-label="Heading 1"
        aria-pressed={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={toggleButtonClass(editor.isActive('heading', { level: 2 }))}
        aria-label="Heading 2"
        aria-pressed={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={toggleButtonClass(editor.isActive('heading', { level: 3 }))}
        aria-label="Heading 3"
        aria-pressed={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={toggleButtonClass(editor.isActive('bulletList'))}
        aria-label="Bullet List"
        aria-pressed={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={toggleButtonClass(editor.isActive('orderedList'))}
        aria-label="Ordered List"
        aria-pressed={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className={actionButtonClass(!editor.can().undo())}
        disabled={!editor.can().undo()}
        aria-label="Undo"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className={actionButtonClass(!editor.can().redo())}
        disabled={!editor.can().redo()}
        aria-label="Redo"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
}
