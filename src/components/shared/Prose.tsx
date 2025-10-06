import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { MarkdownComponents } from '@/components/blog/MarkdownComponents';

interface ProseProps {
  content: string;
  className?: string;
}

export default function Prose({ content, className }: ProseProps) {
  return (
    <ReactMarkdown
      className={cn('prose dark:prose-invert max-w-none', className)}
      remarkPlugins={[remarkGfm]}
      components={MarkdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
