'use client';

import { useEditor, EditorContent, EditorContext } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { useEffect } from 'react';
import { TiptapToolbar } from './TiptapToolbar';

interface TiptapEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        role: 'textbox',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      onChange(markdown);
    },
  });

  // Sync external value changes (e.g., after AI generation)
  useEffect(() => {
    if (editor && editor.getMarkdown() !== value) {
      editor.commands.setContent(value, { contentType: 'markdown' });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="min-h-[200px] animate-pulse bg-muted rounded" />;
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="border rounded-md overflow-hidden">
        <TiptapToolbar />
        <EditorContent editor={editor} />
      </div>
    </EditorContext.Provider>
  );
}
