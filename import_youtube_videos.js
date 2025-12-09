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
 🧩 1. 채널 핸들(@handle) → 채널 ID
---------------------------------------- */
async function getChannelIdFromHandle(handle) {
  const cleanHandle = handle.replace('@', '');

  try {
    // (1) forHandle API 시도
    const res = await axios.get(`${YT_API}/channels`, {
      params: { part: 'id', forHandle: cleanHandle, key: YT_KEY },
    });

    if (res.data.items?.length) {
      console.log('✅ forHandle API 성공');
      return res.data.items[0].id;
    }
  } catch (e) {
    console.warn('⚠️ forHandle API 실패:', e.response?.data?.error?.message);
  }

  // (2) fallback — HTML 파싱
  console.log('🔄 fallback으로 HTML 스크래핑 시도...');
  const htmlRes = await axios.get(`https://www.youtube.com/@${cleanHandle}`);
  const match = htmlRes.data.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);
  if (!match) throw new Error(`❌ 채널 ID를 찾을 수 없습니다: @${cleanHandle}`);
  console.log('✅ HTML 파싱 성공:', match[1]);
  return match[1];
}

/* ----------------------------------------
 🧩 2. channelId → uploads playlistId
---------------------------------------- */
async function getUploadsPlaylistId(channelId) {
  const res = await axios.get(`${YT_API}/channels`, {
    params: { part: 'contentDetails,snippet', id: channelId, key: YT_KEY },
  });

  const uploads = res.data.items[0].contentDetails.relatedPlaylists.uploads;
  const channelName = res.data.items[0].snippet.title;
  return { uploads, channelName };
}

/* ----------------------------------------
 🧩 3. playlistId → 모든 영상 가져오기
---------------------------------------- */
async function fetchAllVideosFromPlaylist(playlistId) {
  let videos = [];
  let nextPageToken = '';

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

  console.log(`📹 총 ${videos.length}개 영상 수집`);
  return videos;
}

/* ----------------------------------------
 🧩 4. 영상 상세정보 + 통계 추가
---------------------------------------- */
async function enrichVideoDetails(videos) {
  const chunks = chunkArray(videos, 50); // API 요청 제한
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
 🧠 Helper functions
---------------------------------------- */
function chunkArray(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

function parseISO8601(duration) {
  if (!duration) return 0;
  const m = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!m) return 0;
  const h = parseInt(m[1]) || 0;
  const min = parseInt(m[2]) || 0;
  const s = parseInt(m[3]) || 0;
  return h * 3600 + min * 60 + s;
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
    2: 'Autos & Vehicles',
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
 🧠 자동 태깅 로직
---------------------------------------- */
function detectProgrammingLanguages(title, desc) {
  const langs = [];
  const text = (title + ' ' + (desc || '')).toLowerCase();

  if (text.includes('python')) langs.push('Python');
  if (
    text.includes('typescript') ||
    text.includes('javascript') ||
    text.includes('react') ||
    text.includes('next')
  )
    langs.push('TypeScript');
  if (text.includes('go ')) langs.push('Go');
  if (text.includes('rust')) langs.push('Rust');
  if (text.includes('java')) langs.push('Java');
  if (text.includes('kotlin')) langs.push('Kotlin');
  if (text.includes('c#') || text.includes('dotnet') || text.includes('.net'))
    langs.push('C#');
  if (text.includes('swift')) langs.push('Swift');
  if (text.includes('php')) langs.push('PHP');

  return [...new Set(langs)];
}

function detectJobType(title, desc) {
  const text = (title + ' ' + (desc || '')).toLowerCase();

  if (text.match(/frontend|react|next|vue|ui|ux|typescript|javascript/))
    return 'frontend';
  if (text.match(/backend|server|api|go|spring|nest|node|rust|java/))
    return 'backend';
  if (text.match(/ml|ai|model|neural|llm|deep learning|machine learning/))
    return 'ai';
  if (text.match(/data|pipeline|etl|warehouse|analytics|spark/)) return 'data';
  if (text.match(/devops|infra|kubernetes|docker|aws|gcp|ci\/cd/))
    return 'devops';
  if (text.match(/design|ux|ui|figma/)) return 'design';
  return null;
}

function detectConferenceName(channelName, title) {
  const text = title.toLowerCase();
  if (text.includes('feconf')) return 'FEConf';
  if (text.includes('ndc')) return 'NDC';
  if (text.includes('if kakao')) return 'if(kakao)';
  if (text.includes('aws')) return 'AWS Summit';
  return channelName;
}

function detectSpeakerName(title) {
  const match = title.match(/[-–]\s*([^|]+)$/);
  return match ? match[1].trim() : null;
}

function calcScore(viewCount, likeCount) {
  if (!viewCount) return 0;
  return Math.round((viewCount * 0.001 + likeCount * 0.02) * 100) / 100;
}

/**
 * 컨퍼런스 연도별/형식별 발표자 파서
 * @param {string} title 영상 제목
 * @param {string} description 영상 설명
 * @param {string} conference_name 컨퍼런스 이름 (예: FEConf)
 * @returns {object} { speaker_name, speaker_org }
 */
function extractSpeakerInfoByConference(title, description, conference_name) {
  if (!title && !description) return { speaker_name: null, speaker_org: null };

  const text = (title + ' ' + (description || '')).replace(/\s+/g, ' ').trim();
  const conf = (conference_name || '').toLowerCase();

  let speaker_name = null;
  let speaker_org = null;

  /* ---------------------------
     FEConf 2017 포맷
     ex) "FEConf 2017 - 서정명 - NCSoft"
  ---------------------------- */
  if (conf.includes('feconf') && text.includes('2017')) {
    const match = text.match(
      /feconf\s*2017\s*-\s*([^-–]+)-\s*([A-Za-z가-힣]+)/i
    );
    if (match) {
      speaker_name = match[1].trim();
      speaker_org = match[2].trim();
      return { speaker_name, speaker_org };
    }
  }

  /* ---------------------------
     FEConf 2018 포맷
     ex) "[FEConf2018] 제목 - 강동욱"
  ---------------------------- */
  if (conf.includes('feconf') && text.includes('2018')) {
    const clean = text.replace(/\[.*?\]/g, '');
    const match = clean.match(/-\s*([A-Za-z가-힣]+)$/);
    if (match) {
      speaker_name = match[1].trim();
      return { speaker_name, speaker_org: null };
    }
  }

  /* ---------------------------
     FEConf 2022~2025 (최근 형식)
     ex) "김도윤 | 온아웃" or "박영진 · 네이버"
     description 안에 존재
  ---------------------------- */
  const lineMatch = (description || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.match(/[|·]/) && (l.match(/[가-힣]{2,}/) || l.match(/[A-Za-z]{2,}/))
    )[0];

  if (lineMatch) {
    // "김도윤 | 온아웃"
    if (lineMatch.includes('|')) {
      const [name, org] = lineMatch.split('|').map((x) => x.trim());
      speaker_name = name;
      speaker_org = org;
      return { speaker_name, speaker_org };
    }
    // "박영진 · 네이버"
    if (lineMatch.includes('·')) {
      const [name, org] = lineMatch.split('·').map((x) => x.trim());
      speaker_name = name;
      speaker_org = org;
      return { speaker_name, speaker_org };
    }
  }

  /* ---------------------------
     FEConf 2022~2024 (제목 내)
     ex) "토스 - 오창영"
  ---------------------------- */
  const dashPattern = text.match(/([가-힣A-Za-z]+)\s*-\s*([가-힣A-Za-z]+)$/);
  if (dashPattern && dashPattern[2].length <= 10) {
    // 짧은 단어는 보통 이름, 긴 단어는 회사
    const [_, left, right] = dashPattern;
    if (left.length <= 5) {
      speaker_name = left.trim();
      speaker_org = right.trim();
    } else {
      speaker_name = right.trim();
      speaker_org = left.trim();
    }
    return { speaker_name, speaker_org };
  }

  /* ---------------------------
     FEConf 2025 기타 케이스
     ex) description 내 '|' or '·' 없는 경우
  ---------------------------- */
  const speakerInDesc = (description || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^[가-힣A-Za-z]+\s*$/.test(l) && l.length <= 10);
  if (speakerInDesc) {
    speaker_name = speakerInDesc;
    speaker_org = null;
    return { speaker_name, speaker_org };
  }

  // fallback
  return { speaker_name, speaker_org };
}

/* ----------------------------------------
 💾 Supabase 저장
---------------------------------------- */
async function saveToSupabase(videos) {
  // youtube_id 기준으로 중복 제거 - 마지막 항목 유지
  const uniqueVideos = Array.from(
    new Map(videos.map((v) => [v.youtube_id, v])).values()
  );

  if (uniqueVideos.length < videos.length) {
    console.log(`⚠️ 중복 제거: ${videos.length}개 → ${uniqueVideos.length}개`);
  }

  const { data, error } = await supabase.from('videos').upsert(uniqueVideos, {
    onConflict: 'youtube_id',
    returning: 'representation',
  });

  if (error) {
    console.error('❌ DB 저장 실패:', error);
  } else {
    console.log(
      `✅ ${data ? data.length : uniqueVideos.length}개 영상 저장 완료`
    );
  }
}

/* ----------------------------------------
 🚀 메인 실행 로직
---------------------------------------- */
async function main() {
  const channelUrl = process.argv[2];
  if (!channelUrl) {
    console.log(
      '⚠️ 사용법: node import_channel_videos_full_v3.js https://www.youtube.com/@feconfkorea/videos'
    );
    process.exit(1);
  }

  const handle = channelUrl.match(/@([^/]+)/)?.[1];
  if (!handle) {
    console.error('❌ @handle을 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`🎬 채널 핸들: @${handle}`);

  const channelId = await getChannelIdFromHandle(handle);
  const { uploads, channelName } = await getUploadsPlaylistId(channelId);

  console.log(`📦 채널명: ${channelName}`);
  console.log(`📋 업로드 리스트 ID: ${uploads}`);

  const raw = await fetchAllVideosFromPlaylist(uploads);
  const enriched = await enrichVideoDetails(raw);

  const final = enriched.map((v) => {
    const { speaker_name, speaker_org } = extractSpeakerInfoByConference(
      v.title,
      v.description,
      v.conference_name
    );

    const mergedTags = Array.from(
      new Set([...(v.tags || []), v.channel_name].filter(Boolean))
    );

    return {
      ...v,
      speaker_name,
      speaker_org,
      conference_name: detectConferenceName(v.channel_name, v.title),
      job_type: detectJobType(v.title, v.description),
      programming_languages: detectProgrammingLanguages(v.title, v.description),
      score: calcScore(v.view_count, v.like_count),
      source: 'youtube',
      tags: mergedTags,
    };
  });

  const filtered = final.filter((v) => {
    const title = (v.title || '').toLowerCase();
    const desc = (v.description || '').toLowerCase();
    const channel = (v.channel_name || '').toLowerCase();

    // 1️⃣ 쇼츠 / 하이라이트 제외
    const isShortsOrHighlight =
      /shorts?/.test(title) ||
      /highlight|하이라이트/.test(title) ||
      /shorts?/.test(desc) ||
      /highlight|하이라이트/.test(desc) ||
      (v.video_url && v.video_url.includes('/shorts/'));

    if (isShortsOrHighlight) return false;

    // 2️⃣ 토스 채널 필터 (#slash or #simplicity)
    if (channel.includes('toss')) {
      const hasTag = /#slash|#simplicity/i.test(desc);
      if (!hasTag) return false;
    }

    // 3️⃣ 네이버 D2 채널 필터 ([발표 내용])
    if (channel.includes('naver d2') || v.channel_url?.includes('naver_d2')) {
      const hasPresentation = /\[발표\s*내용\]/i.test(v.description || '');
      if (!hasPresentation) return false;
    }

    // 4️⃣ INFLEARN (인프런 공식) → "인프콘" or "Infcon" 포함된 영상만
    if (channel.includes('inflearn')) {
      const isInfcon =
        /인프콘|infcon/i.test(title) || /인프콘|infcon/i.test(desc);
      if (!isInfcon) return false;
    }

    // 4️⃣ 기타 채널 통과
    return true;
  });

  console.log(
    `💾 Supabase에 ${filtered.length}/${final.length}개 영상 저장 중 (Shorts/Highlight 제외됨)`
  );
  await saveToSupabase(filtered);
  console.log('🚀 완료!');
}

main();
