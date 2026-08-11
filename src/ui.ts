/* ============================================================
   ui.ts — All DOM rendering and Chart.js chart building
   ============================================================ */

import type {
  CurrentWeather,
  HourlyWeather,
  DailyWeather,
  WeatherCondition,
  GeocodingResult,
} from './types';
import { decodeWMO, uvLabel, windDir, fmtHour, fmtDay } from './helpers';

// ── Chart instance ────────────────────────────────────────────────────────────

// Chart is loaded via CDN so we reference the global rather than importing
declare const Chart: any;
let tempChart: any = null;

// ── DOM helper — typed querySelector that throws if element is missing ────────

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Element #${id} not found in DOM`);
  return el;
}

// ── Small HTML builder helpers ────────────────────────────────────────────────

function statCell(icon: string, label: string, value: string): string {
  return `
    <div class="flex flex-col items-center justify-center py-4 px-2 gap-1 text-center">
      <span class="text-lg">${icon}</span>
      <p class="text-white/40 text-xs uppercase tracking-wide">${label}</p>
      <p class="text-white font-semibold text-sm">${value}</p>
    </div>`;
}

function detailCard(icon: string, label: string, main: string, sub: string, extra = ''): string {
  return `
    <div class="bg-black/25 border border-white/[.08] backdrop-blur-md rounded-2xl p-5 flex flex-col gap-2">
      <div class="flex items-center gap-2 text-white/40">
        <span class="text-base">${icon}</span>
        <span class="text-xs font-semibold uppercase tracking-widest">${label}</span>
      </div>
      <p class="text-white text-2xl font-display font-semibold">${main}</p>
      <p class="text-white/50 text-xs">${sub}</p>
      ${extra}
    </div>`;
}

// ── Sky gradient ──────────────────────────────────────────────────────────────

export function updateSky(weatherCode: number, isDay: boolean): WeatherCondition {
  const wmo  = decodeWMO(weatherCode, isDay);
  const hero = getEl<HTMLElement>('sky-hero');
  hero.className = hero.className.replace(/sky-\S+/g, '').trim();
  hero.classList.add(`sky-${wmo.sky}`);
  return wmo;
}

// ── Current conditions ────────────────────────────────────────────────────────

export function renderCurrent(
  current: CurrentWeather,
  daily: DailyWeather,
  cityName: string,
  wmo: WeatherCondition
): void {
  getEl('skeleton').classList.add('hidden');

  const cc = getEl<HTMLDivElement>('current-content');
  cc.classList.remove('hidden');
  cc.style.display = 'flex';

  getEl('city-name').textContent       = cityName;
  getEl('temp-now').textContent        = `${Math.round(current.temperature_2m)}°`;
  getEl('condition-label').textContent = `${wmo.emoji}  ${wmo.label}`;
  getEl('temp-high').textContent       = `${Math.round(daily.temperature_2m_max[0])}°`;
  getEl('temp-low').textContent        = `${Math.round(daily.temperature_2m_min[0])}°`;
  getEl('feels-like').textContent      = `${Math.round(current.apparent_temperature)}°C`;
  getEl('updated-label').textContent   =
    'Updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── Stat strip ────────────────────────────────────────────────────────────────

export function renderStatStrip(
  current: CurrentWeather,
  hourly: HourlyWeather,
  startIdx: number
): void {
  const visibility = hourly.visibility?.[startIdx] ?? hourly.visibility?.[0] ?? 10000;

  getEl('stat-strip').innerHTML =
    statCell('💧', 'Humidity',   `${current.relative_humidity_2m}%`) +
    statCell('💨', 'Wind',       `${Math.round(current.wind_speed_10m)} km/h ${windDir(current.wind_direction_10m)}`) +
    statCell('🌢', 'Precip.',    `${current.precipitation ?? 0} mm`) +
    statCell('👁️', 'Visibility', `${Math.round(visibility / 1000)} km`);
}

// ── Hourly strip ──────────────────────────────────────────────────────────────

export function renderHourly(hourly: HourlyWeather, startIdx: number): string[] {
  const hrSlice = hourly.time.slice(startIdx, startIdx + 24);

  getEl('hourly-strip').innerHTML = hrSlice.map((t, i) => {
    const idx   = startIdx + i;
    const temp  = Math.round(hourly.temperature_2m[idx]);
    const prec  = hourly.precipitation_probability?.[idx] ?? 0;
    const hWmo  = decodeWMO(hourly.weather_code[idx], Boolean(hourly.is_day[idx]));
    const isNow = i === 0;
    return `
      <div class="flex-shrink-0 flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl text-center
                  ${isNow ? 'bg-white/15' : 'bg-white/5'} min-w-[64px]">
        <span class="text-white/50 text-xs font-medium">${isNow ? 'Now' : fmtHour(t)}</span>
        <span class="text-xl">${hWmo.emoji}</span>
        <span class="text-white font-semibold text-sm">${temp}°</span>
        ${prec > 20
          ? `<span class="text-blue-300 text-xs">${prec}%</span>`
          : `<span class="text-transparent text-xs">0%</span>`}
      </div>`;
  }).join('');

  return hrSlice;
}

// ── 7-day forecast ────────────────────────────────────────────────────────────

export function renderDaily(daily: DailyWeather): void {
  getEl('daily-list').innerHTML = daily.time.map((day, i) => {
    const hi      = Math.round(daily.temperature_2m_max[i]);
    const lo      = Math.round(daily.temperature_2m_min[i]);
    const prec    = Math.round(daily.precipitation_probability_max?.[i] ?? 0);
    const dWmo    = decodeWMO(daily.weather_code[i] ?? 0, true);
    const isToday = i === 0;
    return `
      <div class="flex items-center justify-between px-3 py-2 rounded-xl
                  ${isToday ? 'bg-white/10' : 'hover:bg-white/5'} transition-colors">
        <span class="text-white/70 text-sm w-20">${fmtDay(day, i)}</span>
        <span class="text-lg">${dWmo.emoji}</span>
        <span class="text-blue-300 text-xs w-12 text-center">${prec > 0 ? `${prec}% 💧` : ''}</span>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-white/40">${lo}°</span>
          <div class="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden md:block">
            <div class="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
                 style="margin-left:${Math.max(0, ((lo + 10) / 50) * 100)}%;
                        width:${Math.max(8, ((hi - lo) / 50) * 100)}%"></div>
          </div>
          <span class="text-white font-medium">${hi}°</span>
        </div>
      </div>`;
  }).join('');
}

// ── Detail cards ──────────────────────────────────────────────────────────────

export function renderDetailCards(daily: DailyWeather): void {
  const uv      = daily.uv_index_max?.[0] ?? 0;
  const uvl     = uvLabel(uv);
  const sunrise = daily.sunrise?.[0]?.slice(11, 16) ?? '—';
  const sunset  = daily.sunset?.[0]?.slice(11, 16) ?? '—';
  const rain    = daily.precipitation_sum?.[0] ?? 0;
  const windMax = Math.round(daily.wind_speed_10m_max?.[0] ?? 0);
  const windDom = windDir(daily.wind_direction_10m_dominant?.[0] ?? 0);

  getEl('detail-cards').innerHTML =
    detailCard('☀️', 'UV Index', uv.toFixed(1), uvl.label,
      `<div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
         <div class="h-full rounded-full"
              style="width:${Math.min(100, (uv / 11) * 100)}%;background:${uvl.color};"></div>
       </div>`) +
    detailCard('🌅', 'Sun',           sunrise,                   `Sunset ${sunset}`) +
    detailCard('🌧️', 'Precipitation', `${rain.toFixed(1)} mm`,   "Today's total") +
    detailCard('💨', 'Max Wind',      `${windMax} km/h`,          `${windDom} dominant`);
}

// ── Temperature chart ─────────────────────────────────────────────────────────

export function renderChart(
  hourly: HourlyWeather,
  hrSlice: string[],
  startIdx: number
): void {
  if (tempChart) { tempChart.destroy(); tempChart = null; }

  const canvas = getEl<HTMLCanvasElement>('temp-chart');
  const ctx    = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(99,102,241,0.4)');
  grad.addColorStop(1, 'rgba(99,102,241,0)');

  const labels    = hrSlice.map(t => fmtHour(t));
  const temps     = hrSlice.map((_, i) => hourly.temperature_2m[startIdx + i]);
  const feelsLike = hrSlice.map((_, i) => Math.round(hourly.apparent_temperature[startIdx + i]));

  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temp °C',
          data: temps,
          borderColor: '#818cf8',
          borderWidth: 2,
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#818cf8',
        },
        {
          label: 'Feels like',
          data: feelsLike,
          borderColor: 'rgba(255,255,255,0.25)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#94a3b8',
          bodyColor: '#f1f5f9',
          padding: 10,
          callbacks: {
            label: (c: any) => ` ${c.dataset.label}: ${c.parsed.y}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 }, maxTicksLimit: 8, maxRotation: 0 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          border: { display: false },
          ticks: {
            color: 'rgba(255,255,255,0.3)',
            font: { size: 11 },
            padding: 8,
            callback: (v: number) => `${v}°`,
          },
        },
      },
    },
  });
}

// ── Error state ───────────────────────────────────────────────────────────────

export function showError(msg: string): void {
  const skeleton = getEl('skeleton');
  skeleton.innerHTML = `
    <div class="text-white/40 text-center">
      <p class="text-4xl mb-3">⚠️</p>
      <p class="text-sm">${msg}</p>
    </div>`;
  skeleton.classList.remove('hidden');
}

// ── City search suggestions ───────────────────────────────────────────────────

type SelectCallback = (lat: number, lon: number, name: string) => void;

export function showSuggestions(results: GeocodingResult[], onSelect: SelectCallback): void {
  const box = getEl('suggestions');
  if (!results.length) { box.classList.add('hidden'); return; }

  box.className = [
    'absolute left-0 right-0 z-50',
    'bg-slate-800 border border-white/[.12] rounded-xl overflow-hidden shadow-2xl',
    'top-[calc(100%+6px)]',
  ].join(' ');

  box.innerHTML = results.map(r => {
    const sub = [r.admin1, r.country].filter(Boolean).join(', ');
    return `
      <div class="px-4 py-2.5 text-sm text-slate-300 cursor-pointer
                  border-b border-white/5 last:border-0
                  hover:bg-white/[.08] hover:text-white transition-colors"
           data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}, ${sub}">
        <span class="font-medium">${r.name}</span>
        <span class="text-white/40 text-xs ml-2">${sub}</span>
      </div>`;
  }).join('');

  box.querySelectorAll<HTMLElement>('[data-lat]').forEach(el => {
    el.addEventListener('click', () => {
      onSelect(
        parseFloat(el.dataset.lat!),
        parseFloat(el.dataset.lon!),
        el.dataset.name!
      );
    });
  });

  box.classList.remove('hidden');
}

export function hideSuggestions(): void {
  getEl('suggestions').classList.add('hidden');
}