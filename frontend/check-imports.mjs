import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';

console.log('StarterKit:', StarterKit);
console.log('Image:', Image);
console.log('Placeholder:', Placeholder);
console.log('Link:', Link);
console.log('Underline:', Underline);
console.log('useEditor:', useEditor);

try {
    console.log('StarterKit.configure:', StarterKit?.configure);
} catch (e) {
    console.log('StarterKit.configure error:', e.message);
}
