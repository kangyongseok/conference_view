'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButton } from '@/components/AuthButton';
import { FileText, Loader2, ExternalLink } from 'lucide-react';
import type { VideoNote } from '@/lib/supabase';
import type { Video } from '@/lib/supabase/types/video';
import { PageHeader, PageLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { fetchUserNotes } from '@/lib/supabase/queries/notes';
import { getConferenceColor } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/video/MarkdownRenderer';

interface NoteWithVideo extends VideoNote {
  video: Video | null;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<NoteWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteWithVideo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserNotes(user.id);
      setNotes(data);
    } catch (err) {
      console.error('메모 로드 실패:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('메모를 불러오는데 실패했습니다.')
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleViewNote = (note: NoteWithVideo) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedNote(null);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <PageHeader
          title="내 메모"
          icon={<FileText className="h-6 w-6" />}
          showBackButton
        />
        <div className="py-20 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <p className="mb-2 text-lg text-muted-foreground">
            로그인이 필요합니다
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            메모를 보려면 로그인해주세요.
          </p>
          <AuthButton />
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout>
        <PageHeader
          title="내 메모"
          icon={<FileText className="h-6 w-6" />}
          showBackButton
        />

        {/* 에러 메시지 */}
        {error && (
          <div className="py-8 text-center">
            <p className="mb-4 text-destructive">
              오류가 발생했습니다: {error.message}
            </p>
            <Button variant="outline" onClick={loadNotes}>
              다시 시도
            </Button>
          </div>
        )}

        {/* 메모 목록 */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                {note.video ? (
                  <>
                    <div className="flex flex-col gap-4 p-4 sm:flex-row">
                      {/* 비디오 썸네일 */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted sm:w-48 sm:shrink-0">
                        <Image
                          src={
                            note.video.thumbnail_url || '/placeholder-video.jpg'
                          }
                          alt={note.video.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 192px"
                          unoptimized={
                            note.video.thumbnail_url?.includes(
                              'img.youtube.com'
                            ) ||
                            note.video.thumbnail_url?.includes('i.ytimg.com')
                          }
                        />
                      </div>

                      {/* 비디오 정보 및 메모 */}
                      <div className="flex-1 space-y-3">
                        {/* 비디오 제목 */}
                        <div>
                          <h3 className="mb-1 text-lg font-semibold leading-tight">
                            {note.video.title}
                          </h3>
                          {note.video.conference_name && (
                            <p
                              className="text-sm font-medium"
                              style={
                                getConferenceColor(note.video.conference_name)
                                  ? {
                                      color: getConferenceColor(
                                        note.video.conference_name
                                      ),
                                    }
                                  : {}
                              }
                            >
                              {note.video.conference_name}
                            </p>
                          )}
                        </div>

                        {/* 메모 내용 미리보기 */}
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {note.content || '메모 내용이 없습니다.'}
                          </p>
                        </div>

                        {/* 메타 정보 및 액션 */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div>수정일: {formatDate(note.updated_at)}</div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleViewNote(note)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              메모 보기
                            </Button>
                            {note.video?.video_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() =>
                                  window.open(
                                    note.video!.video_url!,
                                    '_blank',
                                    'noopener,noreferrer'
                                  )
                                }
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                유튜브
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        비디오 ID: {note.youtube_id}
                      </p>
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {note.content || '메모 내용이 없습니다.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          수정일: {formatDate(note.updated_at)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleViewNote(note)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          메모 보기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <p className="mb-2 text-lg text-muted-foreground">
              작성한 메모가 없습니다
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              비디오를 보면서 메모를 작성해보세요.
            </p>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
            >
              비디오 목록 보기
            </Button>
          </div>
        )}
      </PageLayout>

      {/* 메모 상세 보기 모달 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedNote?.video?.title || '메모'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {selectedNote && (
              <div className="space-y-4">
                {/* 비디오 정보 */}
                {selectedNote.video && (
                  <div className="flex gap-4 pb-4 border-b">
                    <div className="relative aspect-video w-48 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={
                          selectedNote.video.thumbnail_url ||
                          '/placeholder-video.jpg'
                        }
                        alt={selectedNote.video.title}
                        fill
                        className="object-cover"
                        sizes="192px"
                        unoptimized={
                          selectedNote.video.thumbnail_url?.includes(
                            'img.youtube.com'
                          ) ||
                          selectedNote.video.thumbnail_url?.includes(
                            'i.ytimg.com'
                          )
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2">
                        {selectedNote.video.title}
                      </h3>
                      {selectedNote.video.conference_name && (
                        <p
                          className="text-sm font-medium mb-2"
                          style={
                            getConferenceColor(
                              selectedNote.video.conference_name
                            )
                              ? {
                                  color: getConferenceColor(
                                    selectedNote.video.conference_name
                                  ),
                                }
                              : {}
                          }
                        >
                          {selectedNote.video.conference_name}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        {selectedNote.video.video_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() =>
                              window.open(
                                selectedNote.video!.video_url!,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            유튜브
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 메모 내용 */}
                <div className="text-sm leading-relaxed">
                  <MarkdownRenderer
                    content={selectedNote.content || '*메모가 없습니다*'}
                  />
                </div>

                {/* 메타 정보 */}
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>작성일: {formatDate(selectedNote.created_at)}</p>
                  <p>수정일: {formatDate(selectedNote.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
