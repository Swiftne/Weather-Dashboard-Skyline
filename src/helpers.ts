/* ============================================================
   helpers.ts — Pure utility functions (no DOM, no fetch)
   ============================================================ */

import type { WeatherCondition, UVInfo, SkyState } from './types';

/**
 * Decode a WMO weather code into a label, emoji, and sky gradient class.
 */
export function decodeWMO(code: number, isDay: boolean): WeatherCondition {
  const c = Math.floor(code);

  const sky = (day: SkyState, night: SkyState): SkyState => (isDay ? day : night);

  if (c === 0)            return { label: 'Clear sky',     emoji: isDay ? '☀️' : '🌙', sky: sky('clear-day', 'clear-night') };
  if (c === 1)            return { label: 'Mostly clear',  emoji: isDay ? '🌤️' : '🌙', sky: sky('clear-day', 'clear-night') };
  if (c === 2)            return { label: 'Partly cloudy', emoji: '⛅',                sky: sky('cloudy-day', 'cloudy-night') };
  if (c === 3)            return { label: 'Overcast',      emoji: '☁️',                sky: sky('cloudy-day', 'cloudy-night') };
  if (c >= 45 && c < 50) return { label: 'Foggy',         emoji: '🌫️',                sky: sky('cloudy-day', 'cloudy-night') };
  if (c >= 51 && c < 60) return { label: 'Drizzle',       emoji: '🌦️',                sky: 'rain' };
  if (c >= 61 && c < 70) return { label: 'Rain',          emoji: '🌧️',                sky: 'rain' };
  if (c >= 71 && c < 80) return { label: 'Snowfall',      emoji: '❄️',                sky: 'snow' };
  if (c >= 80 && c < 85) return { label: 'Rain showers',  emoji: '🌧️',                sky: 'rain' };
  if (c >= 85 && c < 90) return { label: 'Snow showers',  emoji: '🌨️',                sky: 'snow' };
  if (c >= 95)            return { label: 'Thunderstorm', emoji: '⛈️',                sky: 'thunder' };

  return { label: 'Unknown', emoji: '🌡️', sky: 'clear-day' };
}

/**
 * Return a label and highlight colour for a given UV index value.
 */
export function uvLabel(uv: number): UVInfo {
  if (uv < 3)  return { label: 'Low',       color: '#4ade80' };
  if (uv < 6)  return { label: 'Moderate',  color: '#facc15' };
  if (uv < 8)  return { label: 'High',      color: '#fb923c' };
  if (uv < 11) return { label: 'Very high', color: '#f87171' };
  return             { label: 'Extreme',    color: '#e879f9' };
}

/**
 * Convert a wind bearing in degrees to a compass direction string.
 */
export function windDir(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Format an ISO datetime string as a 12-hour clock label (e.g. "3pm").
 */
export function fmtHour(isoStr: string): string {
  const h = new Date(isoStr).getHours();
  return h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
}

/**
 * Format an ISO date string as a short day label.
 * idx 0 → "Today", idx 1 → "Tomorrow", otherwise short weekday.
 */
export function fmtDay(isoStr: string, idx: number): string {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tomorrow';
  return new Date(`${isoStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}
