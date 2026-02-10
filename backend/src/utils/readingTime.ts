import { ContentBlock } from '../types/index.js';

export const MAX_WORDS_PER_POST = 5000;

export function calculateReadingTime(content: ContentBlock[]): number {
  if (!content || !Array.isArray(content)) return 1;

  const text = extractText(content);
  const words = countWords(text);
  const wordsPerMinute = 200;
  
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function extractText(blocks: ContentBlock[]): string {
  let text = '';

  for (const block of blocks) {
    if (block.text) {
      text += block.text + ' ';
    }
    
    if (block.content) {
      text += extractText(block.content);
    }
  }

  return text;
}
