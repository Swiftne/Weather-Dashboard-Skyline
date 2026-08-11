/* ============================================================
   types.ts — All shared interfaces and types for the app
   ============================================================ */

// ── API response shapes ───────────────────────────────────────────────────────

export interface CurrentWeather {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  is_day: 0 | 1;
  precipitation: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  weather_code: number[];
  is_day: (0 | 1)[];
  precipitation: number[];
  visibility: number[];
}

export interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  uv_index_max: number[];
  sunrise: string[];
  sunset: string[];
  wind_speed_10m_max: number[];
  wind_direction_10m_dominant: number[];
}

export interface ForecastResponse {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  error?: boolean;
  reason?: string;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

// ── Decoded weather info ──────────────────────────────────────────────────────

export type SkyState =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy-day'
  | 'cloudy-night'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface WeatherCondition {
  label: string;
  emoji: string;
  sky: SkyState;
}

export interface UVInfo {
  label: string;
  color: string;
}

// ── Stored location ───────────────────────────────────────────────────────────

export interface StoredLocation {
  lat: number;
  lon: number;
  name: string;
}
