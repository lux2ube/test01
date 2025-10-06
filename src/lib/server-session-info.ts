import { headers } from 'next/headers';
import type { DeviceInfo, GeoInfo } from '@/types';
import { getGeoFromHeaders } from './server-geo';

function detectBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function detectOS(ua: string): string {
  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Win/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'MacOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

async function getDeviceInfoFromHeaders(): Promise<DeviceInfo> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  return {
    device: /mobile/i.test(userAgent) ? 'Mobile' : 'Desktop',
    os: detectOS(userAgent),
    browser: detectBrowser(userAgent),
  };
}

export async function getServerSessionInfo(): Promise<{ deviceInfo: DeviceInfo; geoInfo: GeoInfo }> {
  const deviceInfo = await getDeviceInfoFromHeaders();
  const geoData = await getGeoFromHeaders();

  const geoInfo: GeoInfo = {
    ip: geoData.ip || 'unknown',
    country: geoData.country || 'Unknown',
    city: geoData.city || undefined,
  };

  return { deviceInfo, geoInfo };
}
