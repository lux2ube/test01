import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, Link as LinkIcon, Quote } from 'lucide-react';

const createHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  const HeadingComponent: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, id, ...props }) => {
    const slug = id || String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
    return (
      <HeadingTag id={slug} {...props} className="group font-headline font-bold flex items-center gap-2">
        <a href={`#${slug}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <LinkIcon className="h-4 w-4" />
        </a>
        {children}
      </HeadingTag>
    );
  };
  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
};

export const MarkdownComponents: React.ComponentProps<typeof React.Fragment>['components'] = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),

  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith('http');
    const isCta = String(children).endsWith(' >');
    
    if (isCta) {
      return (
        <Button asChild>
          <Link href={href || '#'}>
            {String(children).slice(0, -2)}
          </Link>
        </Button>
      );
    }

    return (
      <Link href={href || '#'} {...props} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} className="text-primary hover:underline items-center gap-1 inline-flex">
        {children}
        {isExternal && <ExternalLink className="h-4 w-4" />}
      </Link>
    );
  },

  blockquote: ({ children, ...props }) => {
    return (
      <blockquote {...props} className="border-l-4 border-primary bg-muted/50 p-4 my-6 rounded-r-lg">
        <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-muted-foreground italic">
                {children}
            </div>
        </div>
      </blockquote>
    );
  },
  
  ol: ({ children, ...props }) => {
    return (
      <ol {...props} className="list-none space-y-4 my-6">
        {React.Children.map(children, (child, index) => 
          React.isValidElement(child) ? 
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mt-1">
                {index + 1}
              </div>
              <div className="flex-grow pt-1">{child}</div>
            </div> 
          : child
        )}
      </ol>
    )
  },

  li: ({ children, ...props }) => {
     return <li {...props} className="[&>p]:m-0">{children}</li>;
  },

};
