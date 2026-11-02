// Grafik batang sederhana (tanpa pustaka tambahan), dibuat dari SVG.
// data: [{ label: '29', value: 3, title: '29 Okt 2026: 3 kunjungan' }, ...]
import { Box, useTheme } from '@mui/material';

const HEIGHT = 220;
const PAD = { top: 16, right: 8, bottom: 28, left: 32 };

// Batas atas sumbu: bulatkan ke angka yang enak dibaca (minimal 4).
function niceMax(value) {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
}

export default function BarChart({ data, ariaLabel }) {
  const theme = useTheme();
  const n = data.length;
  const width = Math.max(320, n * 26 + PAD.left + PAD.right);
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const slot = plotW / n;
  const barW = Math.min(24, slot * 0.64);
  const labelEvery = n > 21 ? 3 : n > 10 ? 2 : 1;
  const ticks = [0, max / 2, max];

  return (
    <Box
      component="svg"
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      sx={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {ticks.map((t) => {
        const y = PAD.top + plotH - (t / max) * plotH;
        return (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y}
              y2={y}
              stroke={theme.palette.divider}
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill={theme.palette.text.secondary}
            >
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const h = (d.value / max) * plotH;
        const x = PAD.left + i * slot + (slot - barW) / 2;
        const y = PAD.top + plotH - h;
        return (
          <g key={d.label + i}>
            <title>{d.title ?? `${d.label}: ${d.value}`}</title>
            {d.value > 0 && (
              <rect x={x} y={y} width={barW} height={h} rx="3" fill={theme.palette.info.main} />
            )}
            {i % labelEvery === 0 && (
              <text
                x={x + barW / 2}
                y={HEIGHT - 10}
                textAnchor="middle"
                fontSize="11"
                fill={theme.palette.text.secondary}
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </Box>
  );
}