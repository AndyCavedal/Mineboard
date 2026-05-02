/* =====================
   Utilities
   ===================== */

const BACKGROUNDS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
];

const BACKGROUND_NAMES = [
  'summit-fog',
  'tropical-shore',
  'mountain-forest',
  'golden-valley',
  'ancient-forest',
  'serene-lake',
  'ocean-waves',
  'rocky-peaks',
];

function pickBackgroundImage() {
  const idx = new Date().getDate() % BACKGROUNDS.length;
  return BACKGROUNDS[idx];
}

/* =====================
   Color Extraction
   =====================

   Samples pixels from 3 horizontal zones of the image:
     - Top third   → accent color  (sky, horizon)
     - Middle third → income color  (midground)
     - Bottom third → expense color (foreground)

   Each zone's pixels are averaged, converted to HSL,
   then darkened + desaturated to produce muted, dark tones
   that feel "of" the landscape without competing with it.
*/

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToString(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function sampleZone(data, width, yStart, yEnd) {
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  // Sample every other pixel for speed
  for (let y = yStart; y < yEnd; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }
  }
  return [
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count),
  ];
}

function extractColorsFromImage(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const W = 60, H = 40; // small for speed
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(img, 0, 0, W, H);

      const { data } = ctx.getImageData(0, 0, W, H);
      const third = Math.floor(H / 3);

      // Sample 3 zones
      const topRGB    = sampleZone(data, W, 0, third);
      const midRGB    = sampleZone(data, W, third, third * 2);
      const bottomRGB = sampleZone(data, W, third * 2, H);

      const topHSL    = rgbToHsl(...topRGB);
      const midHSL    = rgbToHsl(...midRGB);
      const bottomHSL = rgbToHsl(...bottomRGB);

      // Derive dark, muted accent colors:
      // Keep hue, cap saturation at 35%, lightness between 22-32%
      const accent  = { h: topHSL[0],    s: Math.min(topHSL[1], 35),    l: 28 };
      const income  = { h: midHSL[0],    s: Math.min(midHSL[1], 30),    l: 25 };
      const expense = { h: bottomHSL[0], s: Math.min(bottomHSL[1], 32),  l: 26 };

      // Slightly brighter versions for text/foreground use
      const accentFg  = { h: accent.h,  s: Math.min(accent.s + 15, 45),  l: 55 };
      const incomeFg  = { h: income.h,  s: Math.min(income.s + 15, 45),  l: 52 };
      const expenseFg = { h: expense.h, s: Math.min(expense.s + 15, 45), l: 52 };

      resolve({
        accent:    hslToString(accent.h, accent.s, accent.l),
        income:    hslToString(income.h, income.s, income.l),
        expense:   hslToString(expense.h, expense.s, expense.l),
        accentFg:  hslToString(accentFg.h, accentFg.s, accentFg.l),
        incomeFg:  hslToString(incomeFg.h, incomeFg.s, incomeFg.l),
        expenseFg: hslToString(expenseFg.h, expenseFg.s, expenseFg.l),
        accentDim: hslToString(accent.h, accent.s, 12),
        incomeDim: hslToString(income.h, income.s, 12),
        expenseDim:hslToString(expense.h, expense.s, 12),
        // For chart/badges — slightly more visible
        accentHex:  hslToHex(accentFg.h, accentFg.s, accentFg.l),
        incomeHex:  hslToHex(incomeFg.h, incomeFg.s, incomeFg.l),
        expenseHex: hslToHex(expenseFg.h, expenseFg.s, expenseFg.l),
      });
    };

    img.onerror = () => {
      // Fallback: muted defaults
      resolve(null);
    };

    img.src = imgUrl;
  });
}

function applyExtractedColors(colors) {
  if (!colors) return;
  const root = document.documentElement;

  root.style.setProperty('--color-accent',      colors.accentFg);
  root.style.setProperty('--color-accent-dim',   colors.accentDim);
  root.style.setProperty('--color-accent-glow',  colors.accent);
  root.style.setProperty('--color-income',       colors.incomeFg);
  root.style.setProperty('--color-income-dim',   colors.incomeDim);
  root.style.setProperty('--color-expense',      colors.expenseFg);
  root.style.setProperty('--color-expense-dim',  colors.expenseDim);
}

// Current background index (tracked for shuffle)
let currentBgIndex = new Date().getDate() % BACKGROUNDS.length;

async function setBackground(url) {
  const bg = document.getElementById('bg');

  const colorsPromise = extractColorsFromImage(url);

  // Preload then display
  const img = new Image();
  img.onload = () => {
    bg.style.backgroundImage = `url(${url})`;
  };
  img.src = url;

  const colors = await colorsPromise;
  applyExtractedColors(colors);
  window.__extractedColors = colors;

  // Debug label — shows background name in corner
  const debugEl = document.getElementById('bg-debug');
  if (debugEl) {
    debugEl.textContent = `[${currentBgIndex}] ${BACKGROUND_NAMES[currentBgIndex] || ''}`;
  }
}

function initBackground() {
  return setBackground(BACKGROUNDS[currentBgIndex]);
}

function shuffleBackground() {
  currentBgIndex = (currentBgIndex + 1) % BACKGROUNDS.length;
  return setBackground(BACKGROUNDS[currentBgIndex]);
}

/* =====================
   Formatting
   ===================== */

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDateShort(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function getMonthName(year, month) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(year, month));
}

function getMonthRange(year, month) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }, 2800);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
