'use client';

import { useCurrentEditor } from '@tiptap/react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Undo, Redo } from 'lucide-react';

export function TiptapToolbar() {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded hover:bg-muted transition-colors ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className={buttonClass(false)}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className={buttonClass(false)}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
}
