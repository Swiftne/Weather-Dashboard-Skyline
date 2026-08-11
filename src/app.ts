/* ============================================================
   app.ts — Main controller
   Imports from api.ts and ui.ts, owns no rendering logic.
   ============================================================ */

import type { StoredLocation } from './types';
import { fetchForecast, geocodeCity } from './api';
import {
  updateSky,
  renderCurrent,
  renderStatStrip,
  renderHourly,
  renderDaily,
  renderDetailCards,
  renderChart,
  showError,
  showSuggestions,
  hideSuggestions,
} from './ui';

const STORAGE_KEY = 'skyline_last';

// ── Load & render a city ──────────────────────────────────────────────────────

async function loadCity(lat: number, lon: number, name: string): Promise<void> {
  try {
    const { current, hourly, daily } = await fetchForecast(lat, lon);

    // Find which hourly slot corresponds to "now"
    const now        = new Date();
    const nowHourIdx = hourly.time.findIndex(t => new Date(t) >= now);
    const startIdx   = Math.max(0, nowHourIdx);

    const wmo     = updateSky(current.weather_code, current.is_day === 1);
    const hrSlice = renderHourly(hourly, startIdx);

    renderCurrent(current, daily, name, wmo);
    renderStatStrip(current, hourly, startIdx);
    renderDaily(daily);
    renderChart(hourly, hrSlice, startIdx);
    renderDetailCards(daily);

    const stored: StoredLocation = { lat, lon, name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    showError(`Could not load weather data: ${msg}`);
    console.error(err);
  }
}

// ── Geolocation ───────────────────────────────────────────────────────────────

function geoLocate(): void {
  if (!navigator.geolocation) { loadDefault(); return; }
  navigator.geolocation.getCurrentPosition(
    pos => loadCity(pos.coords.latitude, pos.coords.longitude, 'Your location'),
    ()  => loadDefault()
  );
}

function loadDefault(): void {
  loadCity(51.5074, -0.1278, 'London, UK');
}

// ── Search ────────────────────────────────────────────────────────────────────

let geoTimer: ReturnType<typeof setTimeout>;

function onSearchInput(query: string): void {
  if (query.length < 2) { hideSuggestions(); return; }
  clearTimeout(geoTimer);
  geoTimer = setTimeout(async () => {
    try {
      const results = await geocodeCity(query);
      showSuggestions(results, (lat, lon, name) => {
        (document.getElementById('search-input') as HTMLInputElement).value = name;
        hideSuggestions();
        loadCity(lat, lon, name);
      });
    } catch {
      hideSuggestions();
    }
  }, 300);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

function init(): void {
  const input = document.getElementById('search-input') as HTMLInputElement;
  input.addEventListener('input',   (e) => onSearchInput((e.target as HTMLInputElement).value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSuggestions(); });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#search-input') && !target.closest('#suggestions')) {
      hideSuggestions();
    }
  });

  // Restore last city or geolocate
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const { lat, lon, name } = JSON.parse(raw) as StoredLocation;
      loadCity(lat, lon, name);
    } catch {
      geoLocate();
    }
  } else {
    geoLocate();
  }
}

init();
