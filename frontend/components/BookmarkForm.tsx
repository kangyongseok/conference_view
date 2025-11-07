'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Tag, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkFormProps {
  allTags: string[];
  onAddBookmark: (url: string, tags: string[]) => Promise<void>;
  isAdding?: boolean;
}

export const BookmarkForm = ({
  allTags,
  onAddBookmark,
  isAdding = false,
}: BookmarkFormProps) => {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 태그 검색 결과 필터링
  const tagSuggestions = tagInput.trim()
    ? allTags
        .filter(
          (tag) =>
            !tags.includes(tag) &&
            tag.toLowerCase().includes(tagInput.toLowerCase().trim())
        )
        .slice(0, 10)
    : [];

  // 태그 입력 처리
  const handleTagInput = useCallback(
    (value: string) => {
      setTagInput(value);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);

      if (value.includes(',')) {
        const newTags = value
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && !tags.includes(t));
        if (newTags.length > 0) {
          setTags((prev) => [...prev, ...newTags]);
          setTagInput('');
          setShowSuggestions(false);
        }
        return '';
      }
      return value;
    },
    [tags]
  );

  // 태그 선택
  const handleSelectTag = useCallback((tag: string) => {
    setTags((prev) => {
      if (!prev.includes(tag)) {
        return [...prev, tag];
      }
      return prev;
    });
    setTagInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    tagInputRef.current?.focus();
  }, []);

  // 태그 입력 키보드 이벤트
  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isComposing) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (
          selectedSuggestionIndex >= 0 &&
          tagSuggestions[selectedSuggestionIndex]
        ) {
          handleSelectTag(tagSuggestions[selectedSuggestionIndex]);
        } else if (tagInput.trim() && !tags.includes(tagInput.trim())) {
          setTags((prev) => [...prev, tagInput.trim()]);
          setTagInput('');
          setShowSuggestions(false);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < tagSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    },
    [
      isComposing,
      selectedSuggestionIndex,
      tagSuggestions,
      tagInput,
      tags,
      handleSelectTag,
    ]
  );

  // 북마크 추가
  const handleAddBookmark = useCallback(async () => {
    setError(null); // 에러 초기화

    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    try {
      await onAddBookmark(url.trim(), tags);
      setUrl('');
      setTags([]);
      setTagInput('');
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '북마크 추가에 실패했습니다.';
      setError(errorMessage);
    }
  }, [url, tags, onAddBookmark]);

  // URL 입력 시 에러 초기화
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value);
      if (error) {
        setError(null);
      }
    },
    [error]
  );

  // 외부 클릭 시 제안 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5" />
        <h2 className="text-lg font-semibold">북마크 추가</h2>
      </div>
      <div className="space-y-3">
        <div>
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddBookmark();
              }
            }}
            className={cn(error && 'border-destructive')}
          />
          {/* 에러 메시지 */}
          {error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-sm text-primary"
            >
              {tag}
              <button
                onClick={() =>
                  setTags((prev) => prev.filter((_, i) => i !== index))
                }
                className="hover:text-primary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="relative flex-1 min-w-[200px]">
            <Input
              ref={tagInputRef}
              type="text"
              placeholder="태그 입력 (쉼표로 구분)"
              value={tagInput}
              onChange={(e) => {
                const newValue = handleTagInput(e.target.value);
                if (newValue !== e.target.value) {
                  e.target.value = newValue;
                }
              }}
              onFocus={() => {
                if (tagSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={handleTagKeyDown}
              className="w-full"
            />
            {/* 자동완성 제안 드롭다운 */}
            {showSuggestions && tagSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md"
              >
                {tagSuggestions.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                      index === selectedSuggestionIndex && 'bg-accent'
                    )}
                  >
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={handleAddBookmark}
          disabled={isAdding || !url.trim()}
          className="w-full"
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              추가 중...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              북마크 추가
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
