'use client';

import { useEditor, EditorContent, EditorContext } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { useEffect, useRef } from 'react';
import { TiptapToolbar } from './TiptapToolbar';

export interface TiptapEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const markdown = editor.getMarkdown();
        onChangeRef.current(markdown);
      }, 300);
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sync external value changes (e.g., after AI generation)
  useEffect(() => {
    if (editor && !editor.isFocused && editor.getMarkdown() !== value) {
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
