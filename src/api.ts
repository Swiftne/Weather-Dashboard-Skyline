/* ============================================================
   api.ts — All network requests in one place
   ============================================================ */

import type { ForecastResponse, GeocodingResult } from './types';

const FORECAST_BASE  = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Fetch a 7-day weather forecast from Open-Meteo.
 * Throws an Error with the API's reason string on failure.
 */
export async function fetchForecast(lat: number, lon: number): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude:      String(lat),
    longitude:     String(lon),
    timezone:      'auto',
    forecast_days: '7',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'is_day',
      'precipitation',
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'weather_code',
      'is_day',
      'precipitation',
      'visibility',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'weather_code',
      'precipitation_sum',
      'precipitation_probability_max',
      'uv_index_max',
      'sunrise',
      'sunset',
      'wind_speed_10m_max',
      'wind_direction_10m_dominant',
    ].join(','),
  });

  const res  = await fetch(`${FORECAST_BASE}?${params}`);
  const data = (await res.json()) as ForecastResponse;

  if (!res.ok || data.error) {
    throw new Error(data.reason ?? `HTTP ${res.status}`);
  }

  return data;
}

/**
 * Search for cities by name using Open-Meteo's geocoding API.
 * Returns an empty array if no results are found.
 */
export async function geocodeCity(query: string, count = 5): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    name:     query,
    count:    String(count),
    language: 'en',
    format:   'json',
  });

  const res  = await fetch(`${GEOCODING_BASE}?${params}`);
  const data = (await res.json()) as { results?: GeocodingResult[] };
  return data.results ?? [];
}
