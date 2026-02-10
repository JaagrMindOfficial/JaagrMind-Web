// Professional BlocksRenderer for JaagrMind CMS - Medium/Forbes style
import React from 'react';

// Types definition (formerly from strapi.ts)
export interface TextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface LinkNode {
  type: 'link';
  url: string;
  children: TextNode[];
}

export type InlineNode = TextNode | LinkNode;

export interface ImageNode {
  url: string;
  alternativeText?: string;
  width?: number;
  height?: number;
}

export interface BlockNode {
  type: 'paragraph' | 'heading' | 'list' | 'image' | 'quote' | 'code';
  level?: number;
  format?: 'ordered' | 'unordered';
  image?: ImageNode;
  children: InlineNode[];
}

interface BlocksRendererProps {
  content: BlockNode[];
}

// Get image URL - handles both local and remote images
function getImageUrl(image?: ImageNode): string | null {
  if (!image?.url) return null;
  return image.url;
}

// Render text with all formatting options
function renderText(node: TextNode, index: number): React.ReactNode {
  let element: React.ReactNode = node.text;

  // Apply formatting in order of visual importance
  if (node.code) {
    element = (
      <code 
        key={`code-${index}`}
        className="px-1.5 py-0.5 mx-0.5 bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded text-sm font-mono"
      >
        {element}
      </code>
    );
  }
  if (node.bold) {
    element = <strong key={`bold-${index}`} className="font-bold">{element}</strong>;
  }
  if (node.italic) {
    element = <em key={`italic-${index}`} className="italic">{element}</em>;
  }
  if (node.underline) {
    element = <u key={`underline-${index}`} className="underline underline-offset-2">{element}</u>;
  }
  if (node.strikethrough) {
    element = <s key={`strike-${index}`} className="line-through opacity-70">{element}</s>;
  }

  return <React.Fragment key={index}>{element}</React.Fragment>;
}

// Render inline nodes (text and links)
function renderInlineNode(node: InlineNode, index: number): React.ReactNode {
  if (node.type === 'text') {
    return renderText(node as TextNode, index);
  }

  if (node.type === 'link') {
    const linkNode = node as LinkNode;
    const isExternal = linkNode.url.startsWith('http');
    return (
      <a 
        key={index}
        href={linkNode.url}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-accent hover:text-accent-hover underline decoration-accent/30 hover:decoration-accent underline-offset-2 transition-colors duration-200"
      >
        {linkNode.children.map((child, i) => renderText(child, i))}
        {isExternal && (
          <svg 
            className="inline-block w-3.5 h-3.5 ml-0.5 -mt-0.5 opacity-60" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </a>
    );
  }

  return null;
}

// Render array of inline nodes
function renderInlineNodes(children: InlineNode[]): React.ReactNode {
  return children.map((child, index) => renderInlineNode(child, index));
}

// Heading component with proper hierarchy
function Heading({ level, children, index }: { level: number; children: React.ReactNode; index: number }) {
  const headingStyles: Record<number, string> = {
    1: 'text-4xl md:text-5xl font-bold mt-12 mb-6 leading-tight tracking-tight text-foreground',
    2: 'text-3xl md:text-4xl font-bold mt-10 mb-5 leading-snug tracking-tight text-foreground border-b border-border pb-3',
    3: 'text-2xl md:text-3xl font-semibold mt-8 mb-4 leading-snug text-foreground',
    4: 'text-xl md:text-2xl font-semibold mt-6 mb-3 leading-normal text-foreground',
    5: 'text-lg md:text-xl font-medium mt-5 mb-2 leading-normal text-foreground',
    6: 'text-base md:text-lg font-medium mt-4 mb-2 leading-normal text-muted uppercase tracking-wide',
  };

  // Use explicit createElement to avoid JSX namespace issues with dynamic tags
  return React.createElement(
    `h${level}`,
    { key: index, className: headingStyles[level] || headingStyles[2] },
    children
  );
}

// Main BlocksRenderer component
export function BlocksRenderer({ content }: BlocksRendererProps) {
  if (!content || !Array.isArray(content)) {
    return null;
  }

  return (
    <div className="article-content">
      {content.map((block, index) => {
        switch (block.type) {
          // Paragraph
          case 'paragraph':
            // Skip empty paragraphs
            if (block.children.length === 1 && 
                block.children[0].type === 'text' && 
                !(block.children[0] as TextNode).text.trim()) {
              return <div key={index} className="h-4" aria-hidden="true" />;
            }
            return (
              <p 
                key={index} 
                className="text-lg md:text-xl leading-relaxed md:leading-loose mb-6 text-foreground/90"
              >
                {renderInlineNodes(block.children)}
              </p>
            );

          // Headings H1-H6
          case 'heading':
            return (
              <Heading key={index} level={block.level || 2} index={index}>
                {renderInlineNodes(block.children)}
              </Heading>
            );

          // Lists (ordered and unordered)
          case 'list':
            const isOrdered = block.format === 'ordered';
            const ListTag = isOrdered ? 'ol' : 'ul';
            const listStyles = isOrdered 
              ? 'list-decimal list-outside ml-6 md:ml-8 space-y-2 mb-6'
              : 'list-none ml-0 space-y-2 mb-6';
            
            return (
              <ListTag key={index} className={listStyles}>
                {block.children.map((item: any, itemIndex: number) => (
                  <li 
                    key={itemIndex} 
                    className={`text-lg leading-relaxed text-foreground/90 ${
                      !isOrdered ? 'flex items-start gap-3' : 'pl-2'
                    }`}
                  >
                    {!isOrdered && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mt-3 flex-shrink-0" />
                    )}
                    <span>{renderInlineNodes(item.children)}</span>
                  </li>
                ))}
              </ListTag>
            );

          // Images - using native img for localhost compatibility
          case 'image':
            const imageUrl = getImageUrl(block.image);
            if (!imageUrl) return null;
            
            return (
              <figure key={index} className="my-10 -mx-4 md:mx-0">
                {/* Using native img tag to avoid Next.js private IP restrictions */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={block.image?.alternativeText || ''}
                  width={block.image?.width || 1200}
                  height={block.image?.height || 675}
                  className="w-full h-auto rounded-none md:rounded-xl shadow-lg"
                  loading="lazy"
                />
                {block.image?.alternativeText && (
                  <figcaption className="text-center text-sm text-muted mt-3 px-4 italic">
                    {block.image.alternativeText}
                  </figcaption>
                )}
              </figure>
            );

          // Blockquotes - Forbes/Medium style
          case 'quote':
            return (
              <blockquote 
                key={index} 
                className="relative my-8 pl-6 md:pl-8 py-4 border-l-4 border-accent bg-accent/5 rounded-r-lg"
              >
              <div className="absolute -left-3 -top-3 text-accent/20 text-6xl font-serif leading-none select-none">
                  &ldquo;
                </div>
                <div className="text-xl md:text-2xl italic text-foreground/80 leading-relaxed">
                  {renderInlineNodes(block.children)}
                </div>
              </blockquote>
            );

          // Code blocks - dark theme
          case 'code':
            const codeText = (block.children[0] as TextNode)?.text || '';
            return (
              <div key={index} className="my-8 -mx-4 md:mx-0">
                <pre className="bg-gray-900 text-gray-100 rounded-none md:rounded-xl p-4 md:p-6 overflow-x-auto shadow-lg">
                  <code className="text-sm md:text-base font-mono leading-relaxed block whitespace-pre">
                    {codeText}
                  </code>
                </pre>
              </div>
            );

          default:
            // Log unknown block types for debugging
            console.warn('Unknown block type:', (block as { type: string }).type);
            return null;
        }
      })}
    </div>
  );
}

export default BlocksRenderer;
