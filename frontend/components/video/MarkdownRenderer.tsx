'use client';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({
  content,
  className,
}: MarkdownRendererProps) => {
  return (
    <div className={cn('markdown-preview', className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 헤딩 (h1-h6)
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold mb-1 mt-2 first:mt-0 text-muted-foreground">
              {children}
            </h6>
          ),
          // 단락
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground">{children}</p>
          ),
          // 순서 없는 리스트
          ul: ({ children }) => {
            return (
              <ul className="list-disc mb-4 space-y-1.5 pl-6 [&_ul]:ml-4 [&_ul]:mt-1">
                {children}
              </ul>
            );
          },
          // 순서 있는 리스트
          ol: ({ children }) => {
            return (
              <ol className="list-decimal mb-4 space-y-1.5 pl-6 [&_ol]:ml-4 [&_ol]:mt-1">
                {children}
              </ol>
            );
          },
          // 리스트 항목
          li: ({ children }) => (
            <li className="leading-relaxed text-foreground pl-1">{children}</li>
          ),
          // 인라인 코드
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('hljs');
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground border border-border">
                  {children}
                </code>
              );
            }
            // 코드 블록 (highlight.js가 className에 hljs 추가)
            return (
              <code className={cn('block', className)} {...props}>
                {children}
              </code>
            );
          },
          // 코드 블록 컨테이너
          pre: ({ children }) => (
            <pre className="bg-muted p-2 rounded-lg overflow-x-auto mb-2 border border-border [&>code]:bg-transparent [&>code]:pl-4 [&>code]:pr-0 [&>code]:py-0 [&>code]:border-0 [&>code]:text-xs [&>code]:leading-relaxed">
              {children}
            </pre>
          ),
          // 인용구
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground bg-muted/30 py-2 rounded-r">
              {children}
            </blockquote>
          ),
          // 링크
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          // 구분선
          hr: () => <hr className="my-6 border-border border-t" />,
          // 강조 (굵게)
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          // 기울임
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
          // 취소선
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">{children}</del>
          ),
          // 테이블
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm">
              {children}
            </td>
          ),
          // 이미지
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-4 border border-border"
            />
          ),
        }}
      >
        {content || '*내용이 없습니다*'}
      </ReactMarkdown>
    </div>
  );
};
