'use client';

import { useEditor, EditorContent, EditorContext } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { useEffect, useRef } from 'react';
import { TiptapToolbar } from './TiptapToolbar';
import { checkRoundTrip, RoundTripResult } from './roundTripGuard';

export interface TiptapEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onRoundTripFail?: (result: RoundTripResult) => void;
}

const UPDATE_DEBOUNCE_MS = 300;

export function TiptapEditor({ value, onChange, onRoundTripFail }: TiptapEditorProps) {
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onRoundTripFailRef = useRef(onRoundTripFail);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onRoundTripFailRef.current = onRoundTripFail;
  }, [onRoundTripFail]);

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
        const result = checkRoundTrip(valueRef.current, markdown);
        if (!result.ok) {
          console.warn('[TiptapEditor] Round-trip divergence detected', result);
          onRoundTripFailRef.current?.(result);
        }
        onChangeRef.current(markdown);
      }, UPDATE_DEBOUNCE_MS);
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
