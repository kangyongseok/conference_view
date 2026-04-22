'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VideoPlayer, VideoNotePanel } from '@/components/video';
import { Navigation } from '@/components/layout';
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react';
import { getConferenceColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { Video } from '@/lib/supabase/types';

type Props = { video: Video };

export default function VideoPageClient({ video }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const handleOpenYouTube = () => {
    const youtubeUrl =
      video.video_url || `https://www.youtube.com/watch?v=${video.youtube_id}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNoteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    setIsNoteOpen(true);
  };

  const handleCloseNote = () => {
    setIsNoteOpen(false);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">비디오</h1>
        </div>
        <Navigation />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="container mx-auto flex flex-1 flex-col p-4 lg:p-6">
            <div className="flex flex-1 flex-col space-y-6">
              <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-4 shrink-0">
                  <h2 className="mb-2 text-lg font-semibold leading-tight sm:text-xl lg:text-2xl">
                    {video.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {video.conference_name && (
                      <span
                        className="font-medium"
                        style={
                          getConferenceColor(video.conference_name)
                            ? {
                                color: getConferenceColor(
                                  video.conference_name
                                ),
                              }
                            : {}
                        }
                      >
                        {video.conference_name}
                      </span>
                    )}
                    {video.published_at && (
                      <span className="text-muted-foreground">
                        {new Date(video.published_at).toLocaleDateString(
                          'ko-KR',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg">
                  <VideoPlayer
                    youtubeId={video.youtube_id}
                    autoplay={true}
                    title={video.title}
                    className="h-full w-full"
                  />
                </div>

                <div className="mt-4 flex shrink-0 gap-2">
                  {user && (
                    <Button
                      variant="outline"
                      onClick={handleNoteClick}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      메모
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleOpenYouTube}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    유튜브로 보기
                  </Button>
                </div>
              </div>

              {video.description && (
                <div className="shrink-0 rounded-md bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isNoteOpen && (
          <div className="h-full w-96 shrink-0 border-l bg-background shadow-xl">
            <VideoNotePanel
              youtubeId={video.youtube_id}
              title={video.title}
              isOpen={isNoteOpen}
              onClose={handleCloseNote}
            />
          </div>
        )}
      </div>
    </div>
  );
}
