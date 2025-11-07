'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save, Trash2, X } from 'lucide-react';
import {
  saveVideoNote,
  deleteVideoNote,
  fetchVideoNote,
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import rehypeHighlight from 'rehype-highlight';
import jsBeautify from 'js-beautify';

interface VideoNotePanelProps {
  youtubeId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const NoteSkeleton = () => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    <div className="space-y-3">
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-muted rounded w-full animate-pulse" />
      <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
    </div>
    <div className="space-y-2 pt-4">
      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
      <div className="h-3 bg-muted rounded w-full animate-pulse" />
      <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
    </div>
    <div className="space-y-2 pt-4">
      <div className="h-20 bg-muted rounded animate-pulse" />
    </div>
  </div>
);

export const VideoNotePanel = ({
  youtubeId,
  title,
  isOpen,
  onClose,
}: VideoNotePanelProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 전역 키보드 단축키 핸들러 (편집/미리보기 전환)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 패널이 열려있고, 입력 필드에 포커스가 없을 때만 작동
      if (!isOpen) return;

      // 텍스트 입력 중이면 무시
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Cmd/Ctrl + E: 편집/미리보기 전환
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        const formattedContent = formatAllCode(content);
        setContent(formattedContent);
        setPreviewMode(!previewMode);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, content, previewMode]);

  // 메모 로드
  useEffect(() => {
    if (isOpen && user) {
      loadNote();
    } else if (!isOpen) {
      // 패널이 닫힐 때 상태 초기화
      setContent('');
      setSavedContent('');
      setPreviewMode(false);
    }
  }, [isOpen, user, youtubeId]);

  const loadNote = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const note = await fetchVideoNote(user.id, youtubeId);
      if (note && note.content.trim()) {
        setContent(note.content);
        setSavedContent(note.content);
        setPreviewMode(true); // 저장된 메모가 있으면 미리보기 모드로 열기
      } else {
        setContent('');
        setSavedContent('');
        setPreviewMode(false); // 메모가 없으면 편집 모드로 유지
      }
    } catch (error) {
      console.error('메모 로드 실패:', error);
      setPreviewMode(false); // 에러 발생 시 편집 모드로 유지
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !content.trim()) return;

    setIsSaving(true);
    try {
      // 저장 전 자동 포맷팅 적용
      const formattedContent = formatAllCode(content);
      setContent(formattedContent);
      await saveVideoNote(user.id, youtubeId, formattedContent);
      setSavedContent(formattedContent);
      // 저장 후 미리보기 모드로 전환
      setPreviewMode(true);
    } catch (error) {
      console.error('메모 저장 실패:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm('메모를 삭제하시겠습니까?')) return;

    try {
      await deleteVideoNote(user.id, youtubeId);
      setContent('');
      setSavedContent('');
      setPreviewMode(false);
    } catch (error) {
      console.error('메모 삭제 실패:', error);
      alert('메모 삭제에 실패했습니다.');
    }
  };

  // 전체 코드 블록 포맷팅 함수 (저장/미리보기 시 사용)
  const formatAllCode = (text: string): string => {
    // 코드 블록 패턴 매칭 (```language ... ```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let formattedText = text;
    let offset = 0;

    // 코드 블록 찾기 및 포맷팅
    const matches = Array.from(text.matchAll(codeBlockRegex));

    matches.forEach((match) => {
      const fullMatch = match[0];
      const language = match[1] || '';
      const codeContent = match[2];

      // JavaScript/TypeScript 관련 언어 감지
      const jsLikeLanguages = [
        'javascript',
        'js',
        'typescript',
        'ts',
        'jsx',
        'tsx',
        'json',
      ];
      const cssLanguages = ['css', 'scss', 'sass', 'less'];
      const htmlLanguages = ['html', 'xml', 'htm'];

      let formattedCode = codeContent.trim();

      // 언어에 따라 적절한 포맷터 선택
      if (jsLikeLanguages.includes(language.toLowerCase())) {
        formattedCode = jsBeautify.js_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          keep_array_indentation: false,
          break_chained_methods: false,
          brace_style: 'collapse',
          space_before_conditional: true,
          unindent_chained_methods: false,
          wrap_line_length: 0,
          e4x: false,
          end_with_newline: false,
          indent_with_tabs: false,
          jslint_happy: false,
          space_after_anon_function: false,
          space_after_named_function: false,
          space_in_empty_paren: false,
          space_in_paren: false,
          unescape_strings: false,
        });
      } else if (cssLanguages.includes(language.toLowerCase())) {
        formattedCode = jsBeautify.css_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          indent_with_tabs: false,
          end_with_newline: false,
          newline_between_rules: true,
          space_around_combinator: true,
        });
      } else if (htmlLanguages.includes(language.toLowerCase())) {
        formattedCode = jsBeautify.html_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          indent_with_tabs: false,
          indent_inner_html: true,
          wrap_line_length: 0,
          wrap_attributes: 'auto',
          wrap_attributes_indent_size: 2,
          end_with_newline: false,
          extra_liners: [],
          unformatted: [],
          content_unformatted: [],
          indent_scripts: 'normal',
        });
      } else if (language.toLowerCase() === 'json') {
        formattedCode = jsBeautify.js_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          end_with_newline: false,
        });
      }

      // 포맷팅된 코드로 교체
      const newCodeBlock = `\`\`\`${language}\n${formattedCode}\n\`\`\``;
      const beforeMatch = formattedText.substring(0, match.index! + offset);
      const afterMatch = formattedText.substring(
        match.index! + offset + fullMatch.length
      );
      formattedText = beforeMatch + newCodeBlock + afterMatch;

      // 오프셋 조정 (길이 차이 반영)
      offset += newCodeBlock.length - fullMatch.length;
    });

    return formattedText;
  };

  const handleFormatCode = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    let text = content;

    // 선택된 텍스트가 있으면 해당 부분만 포맷팅, 없으면 전체 텍스트
    const selectedText = text.substring(startPos, endPos);
    const hasSelection = selectedText.length > 0;

    // 코드 블록 패턴 매칭 (```language ... ```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let formattedText = text;
    let offset = 0;

    // 코드 블록 찾기 및 포맷팅
    const matches = Array.from(text.matchAll(codeBlockRegex));

    matches.forEach((match) => {
      const fullMatch = match[0];
      const language = match[1] || '';
      const codeContent = match[2];

      // 선택 영역이 있고 이 코드 블록이 선택 영역과 겹치지 않으면 스킵
      if (hasSelection) {
        const matchStart = match.index!;
        const matchEnd = matchStart + fullMatch.length;
        if (matchStart < startPos || matchEnd > endPos) {
          return;
        }
      }

      // JavaScript/TypeScript 관련 언어 감지
      const jsLikeLanguages = [
        'javascript',
        'js',
        'typescript',
        'ts',
        'jsx',
        'tsx',
        'json',
      ];
      const cssLanguages = ['css', 'scss', 'sass', 'less'];
      const htmlLanguages = ['html', 'xml', 'htm'];

      let formattedCode = codeContent.trim();

      // 언어에 따라 적절한 포맷터 선택
      if (jsLikeLanguages.includes(language.toLowerCase())) {
        formattedCode = jsBeautify.js_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          keep_array_indentation: false,
          break_chained_methods: false,
          brace_style: 'collapse',
          space_before_conditional: true,
          unindent_chained_methods: false,
          wrap_line_length: 0,
          e4x: false,
          end_with_newline: false,
          indent_with_tabs: false,
          jslint_happy: false,
          space_after_anon_function: false,
          space_after_named_function: false,
          space_in_empty_paren: false,
          space_in_paren: false,
          unescape_strings: false,
        });
      } else if (cssLanguages.includes(language.toLowerCase())) {
        formattedCode = jsBeautify.css_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          indent_with_tabs: false,
          end_with_newline: false,
          newline_between_rules: true,
          space_around_combinator: true,
        });
      } else if (htmlLanguages.includes(language.toLowerCase())) {
        formattedCode = jsBeautify.html_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          indent_with_tabs: false,
          indent_inner_html: true,
          wrap_line_length: 0,
          wrap_attributes: 'auto',
          wrap_attributes_indent_size: 2,
          end_with_newline: false,
          extra_liners: [],
          unformatted: [],
          content_unformatted: [],
          indent_scripts: 'normal',
        });
      } else if (language.toLowerCase() === 'json') {
        formattedCode = jsBeautify.js_beautify(codeContent, {
          indent_size: 2,
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          end_with_newline: false,
        });
      }

      // 포맷팅된 코드로 교체
      const newCodeBlock = `\`\`\`${language}\n${formattedCode}\n\`\`\``;
      const beforeMatch = formattedText.substring(0, match.index! + offset);
      const afterMatch = formattedText.substring(
        match.index! + offset + fullMatch.length
      );
      formattedText = beforeMatch + newCodeBlock + afterMatch;

      // 오프셋 조정 (길이 차이 반영)
      offset += newCodeBlock.length - fullMatch.length;
    });

    // 텍스트 업데이트
    setContent(formattedText);

    // 커서 위치 복원
    setTimeout(() => {
      if (textareaRef.current) {
        if (hasSelection) {
          // 선택 영역이 있었으면 포맷팅 후에도 선택 유지
          textareaRef.current.setSelectionRange(startPos, endPos);
        } else {
          // 선택 영역이 없었으면 원래 위치로 복원
          textareaRef.current.setSelectionRange(startPos, startPos);
        }
        textareaRef.current.focus();
      }
    }, 0);
  };

  // 키보드 단축키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Shift + F: 코드 포맷팅
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      handleFormatCode();
    }
    // Cmd/Ctrl + E: 편집/미리보기 전환
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      const formattedContent = formatAllCode(content);
      setContent(formattedContent);
      setPreviewMode(!previewMode);
    }
  };

  const hasChanges = content !== savedContent;

  if (!isOpen) return null;

  return (
    <div className="w-96 shrink-0 border-l bg-background transition-all duration-300 ease-in-out">
      <div className="flex h-full flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground leading-tight">
                {title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                메모 작성
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 미리보기 전환 시 자동 포맷팅 적용
                const formattedContent = formatAllCode(content);
                setContent(formattedContent);
                setPreviewMode(!previewMode);
              }}
              className="h-8 gap-1.5 px-3 hover:bg-muted"
              title={
                previewMode
                  ? `편집 모드 (${
                      navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
                    }+E)`
                  : `미리보기 (${
                      navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
                    }+E)`
              }
            >
              <span className="text-sm">
                {previewMode ? '편집' : '미리보기'}
              </span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
                <span className="text-xs">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </span>
                E
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-muted"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <NoteSkeleton />
          ) : previewMode ? (
            <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
              <div className="markdown-preview">
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
                      <p className="mb-4 leading-relaxed text-foreground">
                        {children}
                      </p>
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
                      <li className="leading-relaxed text-foreground pl-1">
                        {children}
                      </li>
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
                      <del className="line-through text-muted-foreground">
                        {children}
                      </del>
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
                  {content || '*메모가 없습니다*'}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`마크다운 형식으로 메모를 작성하세요...

예시:
## 제목
- 항목 1
- 항목 2

**굵은 글씨**와 *기울임*도 사용할 수 있습니다.

\`코드\` 또는

\`\`\`
코드 블록
\`\`\``}
              className="flex-1 resize-none border-0 rounded-none p-4 focus-visible:ring-0 font-mono text-sm"
              disabled={isLoading}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t px-4 py-3 gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!savedContent || isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-muted-foreground">
                저장되지 않음
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading || !hasChanges}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
