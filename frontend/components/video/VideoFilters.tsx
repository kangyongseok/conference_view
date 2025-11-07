'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SiTypescript,
  SiJavascript,
  SiPython,
  SiGo,
  SiRust,
  SiKotlin,
  SiSwift,
  SiPhp,
  SiReact,
  SiNextdotjs,
} from 'react-icons/si';

import { FaJava } from 'react-icons/fa';
import { AiOutlineDotNet } from 'react-icons/ai';

interface FilterState {
  year: string[];
  conference: string[];
  programmingLanguage: string[];
  jobType: string[];
  sortBy: string;
}

interface VideoFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableYears: string[];
  availableConferences: string[];
  availableLanguages: string[];
  availableJobTypes: string[];
}

// 개발언어 아이콘 매핑 함수
const getLanguageIcon = (lang: string) => {
  const iconProps = { className: 'h-4 w-4' };
  const langLower = lang.toLowerCase();

  switch (langLower) {
    case 'typescript':
    case 'ts':
      return <SiTypescript {...iconProps} />;
    case 'javascript':
    case 'js':
      return <SiJavascript {...iconProps} />;
    case 'python':
      return <SiPython {...iconProps} />;
    case 'go':
    case 'golang':
      return <SiGo {...iconProps} />;
    case 'rust':
      return <SiRust {...iconProps} />;
    case 'java':
      return <FaJava {...iconProps} />;
    case 'kotlin':
      return <SiKotlin {...iconProps} />;
    case 'c#':
    case 'csharp':
    case 'dotnet':
    case '.net':
      return <AiOutlineDotNet {...iconProps} />;
    case 'swift':
      return <SiSwift {...iconProps} />;
    case 'php':
      return <SiPhp {...iconProps} />;
    case 'react':
      return <SiReact {...iconProps} />;
    case 'next':
    case 'nextjs':
    case 'next.js':
      return <SiNextdotjs {...iconProps} />;
    default:
      return null;
  }
};

const VideoFilters = ({
  filters,
  onFilterChange,
  availableYears,
  availableConferences,
  availableLanguages,
  availableJobTypes,
}: VideoFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // 필터 영역 밖 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleToggleFilter = (
    key: 'year' | 'conference' | 'programmingLanguage' | 'jobType',
    value: string
  ) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange({
      ...filters,
      [key]: newValues,
    });
  };

  const handleReset = () => {
    onFilterChange({
      year: [],
      conference: [],
      programmingLanguage: [],
      jobType: [],
      sortBy: 'newest',
    });
  };

  const activeFilterCount =
    filters.year.length +
    filters.conference.length +
    filters.programmingLanguage.length +
    filters.jobType.length;

  const hasActiveFilters = activeFilterCount > 0;

  // 키보드 이벤트 핸들러
  const handleKeyDown = (
    event: React.KeyboardEvent,
    filterKey: 'year' | 'conference' | 'programmingLanguage' | 'jobType',
    value: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleFilter(filterKey, value);
    }
  };

  // 정렬 아이콘 매핑 함수
  const getSortIcon = (sort: string) => {
    const iconProps = { className: 'h-4 w-4' };
    switch (sort) {
      case 'newest':
        return <Clock {...iconProps} />;
      case 'oldest':
        return <Calendar {...iconProps} />;
      case 'title':
        return <ArrowUpDown {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-4" ref={filterRef}>
      {/* 모바일: 컴팩트 헤더 */}
      <div className="flex items-center gap-2 sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 justify-between"
          aria-expanded={isExpanded}
          aria-controls="filter-content"
          aria-label="필터 메뉴"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            필터
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* 모바일 정렬 */}
        <div className="w-32">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              onFilterChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>최신순</span>
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>오래된순</span>
                </div>
              </SelectItem>
              <SelectItem value="title">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>제목순</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 모바일: 활성 필터 뱃지 */}
      {!isExpanded && hasActiveFilters && (
        <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
          {filters.year.map((year) => (
            <Button
              key={year}
              variant="secondary"
              size="sm"
              onClick={() => handleToggleFilter('year', year)}
              className="h-7 gap-1 text-xs"
            >
              {year}년
              <X className="h-3 w-3" />
            </Button>
          ))}
          {filters.conference.map((conf) => (
            <Button
              key={conf}
              variant="secondary"
              size="sm"
              onClick={() => handleToggleFilter('conference', conf)}
              className="h-7 gap-1 text-xs"
            >
              {conf}
              <X className="h-3 w-3" />
            </Button>
          ))}
          {filters.programmingLanguage.map((lang) => {
            const Icon = getLanguageIcon(lang);
            return (
              <Button
                key={lang}
                variant="secondary"
                size="sm"
                onClick={() => handleToggleFilter('programmingLanguage', lang)}
                className="h-7 gap-1 text-xs"
              >
                {Icon && <span className="shrink-0">{Icon}</span>}
                {lang}
                <X className="h-3 w-3" />
              </Button>
            );
          })}
          {filters.jobType.map((job) => (
            <Button
              key={job}
              variant="secondary"
              size="sm"
              onClick={() => handleToggleFilter('jobType', job)}
              className="h-7 gap-1 text-xs"
            >
              {job}
              <X className="h-3 w-3" />
            </Button>
          ))}
        </div>
      )}

      {/* 필터 영역 - 모바일: 접기/펼치기, 데스크톱: 항상 표시 */}
      <div
        id="filter-content"
        className={cn(
          'space-y-5 rounded-lg border bg-card p-4 sm:block lg:space-y-4 lg:border-0 lg:bg-transparent lg:p-0',
          isExpanded ? 'block' : 'hidden'
        )}
        role="region"
        aria-label="필터 옵션"
      >
        {/* 데스크톱: 더 컴팩트한 레이아웃 */}
        <div className="space-y-4 lg:space-y-3">
          {/* 연도 필터 그룹 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-xs">
              연도
            </legend>
            <div
              className="flex flex-wrap gap-1.5 lg:gap-1"
              role="group"
              aria-label="연도 선택"
            >
              {availableYears.map((year) => {
                const isSelected = filters.year.includes(year);
                return (
                  <div
                    key={year}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => handleToggleFilter('year', year)}
                    onKeyDown={(e) => handleKeyDown(e, 'year', year)}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 lg:px-2 lg:py-0.5',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleFilter('year', year)}
                      className="h-3 w-3 lg:h-3.5 lg:w-3.5"
                      aria-hidden="true"
                    />
                    <span>{year}년</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 컨퍼런스 필터 그룹 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-xs">
              컨퍼런스
            </legend>
            <div
              className="flex flex-wrap gap-1.5 lg:gap-1"
              role="group"
              aria-label="컨퍼런스 선택"
            >
              {availableConferences.map((conference) => {
                const isSelected = filters.conference.includes(conference);
                return (
                  <div
                    key={conference}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => handleToggleFilter('conference', conference)}
                    onKeyDown={(e) =>
                      handleKeyDown(e, 'conference', conference)
                    }
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 lg:px-2 lg:py-0.5',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        handleToggleFilter('conference', conference)
                      }
                      className="h-3 w-3 lg:h-3.5 lg:w-3.5"
                      aria-hidden="true"
                    />
                    <span>{conference}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 개발언어 필터 그룹 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-xs">
              개발언어
            </legend>
            <div
              className="flex flex-wrap gap-1.5 lg:gap-1"
              role="group"
              aria-label="개발언어 선택"
            >
              {availableLanguages.map((lang) => {
                const isSelected = filters.programmingLanguage.includes(lang);
                const Icon = getLanguageIcon(lang);
                return (
                  <div
                    key={lang}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() =>
                      handleToggleFilter('programmingLanguage', lang)
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, 'programmingLanguage', lang)
                    }
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 lg:px-2 lg:py-0.5',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        handleToggleFilter('programmingLanguage', lang)
                      }
                      className="h-3 w-3 lg:h-3.5 lg:w-3.5"
                      aria-hidden="true"
                    />
                    {Icon && <span className="shrink-0">{Icon}</span>}
                    <span className="truncate">{lang}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 직군 필터 그룹 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-xs">
              직군
            </legend>
            <div
              className="flex flex-wrap gap-1.5 lg:gap-1"
              role="group"
              aria-label="직군 선택"
            >
              {availableJobTypes.map((jobType) => {
                const isSelected = filters.jobType.includes(jobType);
                return (
                  <div
                    key={jobType}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => handleToggleFilter('jobType', jobType)}
                    onKeyDown={(e) => handleKeyDown(e, 'jobType', jobType)}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 lg:px-2 lg:py-0.5',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        handleToggleFilter('jobType', jobType)
                      }
                      className="h-3 w-3 lg:h-3.5 lg:w-3.5"
                      aria-hidden="true"
                    />
                    <span>{jobType}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 정렬 - 데스크톱 */}
          <fieldset className="hidden space-y-2 lg:block">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              정렬
            </legend>
            <div
              className="flex flex-col gap-1.5"
              role="radiogroup"
              aria-label="정렬 옵션"
            >
              {['newest', 'oldest', 'title'].map((sort) => {
                const sortLabels = {
                  newest: '최신순',
                  oldest: '오래된순',
                  title: '제목순',
                };
                const isSelected = filters.sortBy === sort;
                const SortIcon = getSortIcon(sort);
                return (
                  <button
                    key={sort}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onFilterChange({ ...filters, sortBy: sort })}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {SortIcon && (
                      <span className="shrink-0" aria-hidden="true">
                        {SortIcon}
                      </span>
                    )}
                    <span>{sortLabels[sort as keyof typeof sortLabels]}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* 필터 초기화 버튼 */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full gap-2 lg:w-full lg:text-xs"
            aria-label={`${activeFilterCount}개의 활성 필터 초기화`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            필터 초기화 ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoFilters;
