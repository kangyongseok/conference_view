/**
 * 🎬 import_playlist_videos.js
 * YouTube 플레이리스트 URL 입력 → Supabase DB 저장
 * (videos 테이블 기존 컬럼 구조 호환)
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const YT_API = 'https://www.googleapis.com/youtube/v3';
const YT_KEY = process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ----------------------------------------
 🧩 1. playlistId 추출
---------------------------------------- */
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (!match) throw new Error('❌ 유효한 YouTube 플레이리스트 URL이 아닙니다.');
  return match[1];
}

/* ----------------------------------------
 🧩 2. playlistId → 영상 목록
---------------------------------------- */
async function fetchAllVideosFromPlaylist(playlistId) {
  let videos = [];
  let nextPageToken = '';

  console.log(`📺 플레이리스트 ID: ${playlistId}`);

  do {
    const res = await axios.get(`${YT_API}/playlistItems`, {
      params: {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
        key: YT_KEY,
      },
    });

    const items = res.data.items.map((v) => ({
      youtube_id: v.contentDetails.videoId,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail_url: v.snippet.thumbnails?.high?.url,
      video_url: `https://www.youtube.com/watch?v=${v.contentDetails.videoId}`,
      published_at: v.contentDetails.videoPublishedAt,
      channel_name: v.snippet.channelTitle,
    }));

    videos.push(...items);
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  console.log(`📹 총 ${videos.length}개 영상 수집 완료`);
  return videos;
}

/* ----------------------------------------
 🧩 3. 영상 상세정보 + 통계
---------------------------------------- */
async function enrichVideoDetails(videos) {
  const chunks = chunkArray(videos, 50);
  let enriched = [];

  for (const chunk of chunks) {
    const ids = chunk.map((v) => v.youtube_id).join(',');
    const res = await axios.get(`${YT_API}/videos`, {
      params: {
        part: 'contentDetails,statistics,snippet',
        id: ids,
        key: YT_KEY,
      },
    });

    const meta = {};
    res.data.items.forEach((v) => {
      meta[v.id] = {
        duration: parseISO8601(v.contentDetails.duration),
        view_count: parseInt(v.statistics.viewCount || 0),
        like_count: parseInt(v.statistics.likeCount || 0),
        category: v.snippet.categoryId,
        tags: v.snippet.tags || [],
        defaultLanguage: v.snippet.defaultAudioLanguage || null,
      };
    });

    enriched.push(
      ...chunk.map((v) => ({
        ...v,
        duration: meta[v.youtube_id]?.duration,
        view_count: meta[v.youtube_id]?.view_count,
        like_count: meta[v.youtube_id]?.like_count,
        tags: meta[v.youtube_id]?.tags || [],
        language: simplifyLanguage(meta[v.youtube_id]?.defaultLanguage),
        category: mapCategory(meta[v.youtube_id]?.category),
      }))
    );
  }

  return enriched;
}

/* ----------------------------------------
 🔧 Helper Functions
---------------------------------------- */
function chunkArray(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

function parseISO8601(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h = 0, m = 0, s = 0] = match.map((x) => parseInt(x) || 0);
  return h * 3600 + m * 60 + s;
}

function simplifyLanguage(code) {
  if (!code) return null;
  if (code.startsWith('en')) return 'en';
  if (code.startsWith('ko')) return 'ko';
  if (code.startsWith('ja')) return 'ja';
  if (code.startsWith('zh')) return 'zh';
  return code.slice(0, 2);
}

function mapCategory(id) {
  const map = {
    1: 'Film & Animation',
    10: 'Music',
    20: 'Gaming',
    22: 'People & Blogs',
    24: 'Entertainment',
    27: 'Education',
    28: 'Science & Technology',
  };
  return map[id] || 'Other';
}

/* ----------------------------------------
 🧠 4. 태깅/스코어 계산
---------------------------------------- */
function calcScore(viewCount, likeCount) {
  if (!viewCount) return 0;
  const score = viewCount * 0.001 + likeCount * 0.02;
  return Math.min(Math.round(score * 100) / 100, 999.99); // numeric(5,2) overflow 방지
}

/* ----------------------------------------
 💾 5. Supabase 저장
---------------------------------------- */
async function saveToSupabase(videos) {
  // youtube_id 기준으로 중복 제거 - 마지막 항목 유지
  const uniqueVideos = Array.from(
    new Map(videos.map((v) => [v.youtube_id, v])).values()
  );

  if (uniqueVideos.length < videos.length) {
    console.log(`⚠️ 중복 제거: ${videos.length}개 → ${uniqueVideos.length}개`);
  }

  const { error } = await supabase.from('videos').upsert(uniqueVideos, {
    onConflict: 'youtube_id',
  });
  if (error) console.error('❌ DB 저장 실패:', error);
  else console.log(`✅ ${uniqueVideos.length}개 영상 저장 완료`);
}

/* ----------------------------------------
 🚀 6. 메인 실행
---------------------------------------- */
async function main() {
  const playlistUrl = process.argv[2];
  if (!playlistUrl) {
    console.log(
      '⚠️ 사용법: node import_playlist_videos.js <playlist URL>\n예: node import_playlist_videos.js https://www.youtube.com/playlist?list=PLOU2XLYxmsIL4mCDJICu2vLPNw-zdcGAt'
    );
    process.exit(1);
  }

  const playlistId = extractPlaylistId(playlistUrl);
  const basicVideos = await fetchAllVideosFromPlaylist(playlistId);
  const enriched = await enrichVideoDetails(basicVideos);

  const final = enriched.map((v) => ({
    youtube_id: v.youtube_id,
    title: v.title,
    description: v.description,
    thumbnail_url: v.thumbnail_url,
    video_url: v.video_url,
    conference_name: v.channel_name,
    speaker_name: null,
    speaker_org: null,
    published_at: v.published_at,
    duration: v.duration,
    language: v.language,
    tags: v.tags || [],
    view_count: v.view_count,
    like_count: v.like_count,
    channel_name: v.channel_name,
    category: v.category,
    score: calcScore(v.view_count, v.like_count),
    source: 'youtube',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  await saveToSupabase(final);
  console.log('🚀 완료!');
}

main();
