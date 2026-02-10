'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';

// Debug logging removed


import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Image as ImageIcon,
  Code
} from 'lucide-react';
import { useEffect } from 'react';
import { MediaPicker } from '@/components/MediaPicker';

interface EditorProps {
  content: string | object;
  onChange: (html: string, json: object) => void;
  placeholder?: string;
  editable?: boolean;
}

export function Editor({ content, onChange, placeholder = 'Write something...', editable = true }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      BubbleMenuExtension,
      FloatingMenuExtension,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px]',
      },
    },
  });

  // Update content if changed externally (e.g. initial load)
  useEffect(() => {
    if (editor && content && !editor.isFocused) {
       // Only update if content is different to avoid cursor jumping
       // editor.commands.setContent(content); 
       // Needs careful handling to not reset cursor. 
       // For now, reliance on initial content is safer for uncontrolled input.
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="relative">
      {/* Bubble Menu for Text Selection */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          className="bg-background border border-border shadow-lg rounded-lg p-1 flex items-center gap-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-accent/10 ${editor.isActive('bold') ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-accent/10 ${editor.isActive('italic') ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-accent/10 ${editor.isActive('underline') ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <div className="w-4 h-4 underline decoration-2 underline-offset-4 text-center font-bold">U</div>
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-accent/10 ${editor.isActive('heading', { level: 1 }) ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-accent/10 ${editor.isActive('heading', { level: 2 }) ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Heading2 className="w-4 h-4" />
          </button>
        </BubbleMenu>
      )}

      {/* Floating Menu for Empty Lines */}
      {editor && (
        <FloatingMenu 
          editor={editor} 
          className="bg-background border border-border shadow-lg rounded-lg p-1 flex items-center gap-1 -ml-8"
        >
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
             title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
             title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
             title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
           <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
             title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
          
          <MediaPicker 
            onSelect={addImage}
            trigger={
              <button
                className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
                title="Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            }
          />
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
