import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for persisting telemetry data locally without requiring DB migrations
const STATS_FILE_PATH = path.join(process.cwd(), 'public', 'downloads', 'telemetry_stats.json');

interface TelemetryData {
  apkDownloads: number;
  pwaInstalls: number;
  lastUpdated: string;
  logs: Array<{
    type: 'apk_download' | 'pwa_install' | 'pwa_prompt_accepted';
    timestamp: string;
    userAgent?: string;
  }>;
}

function getStats(): TelemetryData {
  try {
    if (fs.existsSync(STATS_FILE_PATH)) {
      const content = fs.readFileSync(STATS_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading stats file:', err);
  }

  return {
    apkDownloads: 0,
    pwaInstalls: 0,
    lastUpdated: new Date().toISOString(),
    logs: [],
  };
}

function saveStats(stats: TelemetryData) {
  try {
    const dir = path.dirname(STATS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Keep last 100 logs to prevent file bloat
    if (stats.logs.length > 100) {
      stats.logs = stats.logs.slice(-100);
    }
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving stats file:', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Return statistics if requested
  if (searchParams.get('stats') === 'true') {
    const stats = getStats();
    return NextResponse.json({ success: true, stats });
  }

  // Handle direct APK download tracking
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const stats = getStats();

  stats.apkDownloads += 1;
  stats.lastUpdated = new Date().toISOString();
  stats.logs.push({
    type: 'apk_download',
    timestamp: new Date().toISOString(),
    userAgent,
  });

  saveStats(stats);

  // Redirect to the actual static APK file
  const apkUrl = new URL('/downloads/E-PavtiBook.apk', request.url);
  return NextResponse.redirect(apkUrl, { status: 302 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body?.type || 'pwa_install';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const stats = getStats();

    if (type === 'apk_download') {
      stats.apkDownloads += 1;
    } else {
      stats.pwaInstalls += 1;
    }

    stats.lastUpdated = new Date().toISOString();
    stats.logs.push({
      type,
      timestamp: new Date().toISOString(),
      userAgent,
    });

    saveStats(stats);

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    console.error('Telemetry logging failed:', err);
    return NextResponse.json({ success: false, error: 'Logging failed' }, { status: 500 });
  }
}
