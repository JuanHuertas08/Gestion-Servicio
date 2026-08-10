import { Box, Typography } from "@mui/material";

export interface GaugeZone {
  label: string;
  color: string;
  hasta: number; // límite superior de la zona (0-100), en orden ascendente
}

interface Props {
  /** Valor a mostrar, 0-100. */
  value: number;
  /** Texto mostrado bajo la aguja (por defecto, el valor con "%"). */
  valueLabel?: string;
  zones?: GaugeZone[];
  size?: number;
}

const DEFAULT_ZONES: GaugeZone[] = [
  { label: "Pobre", color: "#e53935", hasta: 20 },
  { label: "Suficiente", color: "#f4a261", hasta: 40 },
  { label: "Bueno", color: "#f6d55c", hasta: 60 },
  { label: "Muy Bueno", color: "#a8d08d", hasta: 80 },
  { label: "Excelente", color: "#4caf50", hasta: 100 },
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) };
}

function describeArcBand(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

/** value 0-100 -> angle 180deg (izquierda) .. 0deg (derecha), pasando por 90deg (arriba). */
function valueToAngle(value: number): number {
  const clamped = Math.max(0, Math.min(100, value));
  return 180 - (clamped / 100) * 180;
}

export function GaugeChart({ value, valueLabel, zones = DEFAULT_ZONES, size = 260 }: Props) {
  const width = size;
  const height = size * 0.62;
  const cx = width / 2;
  const cy = height - 8;
  const outerR = width / 2 - 28;
  const innerR = outerR - 22;
  const needleAngle = valueToAngle(value);

  let desde = 0;
  const zoneArcs = zones.map((zone) => {
    const startAngle = valueToAngle(desde);
    const endAngle = valueToAngle(zone.hasta);
    const midAngle = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(cx, cy, outerR + 16, midAngle);
    desde = zone.hasta;
    return { ...zone, path: describeArcBand(cx, cy, innerR, outerR, startAngle, endAngle), labelPos, midAngle };
  });

  const needleLength = innerR - 6;
  const needleTip = polarToCartesian(cx, cy, needleLength, needleAngle);
  const needleBase1 = polarToCartesian(cx, cy, 8, needleAngle + 90);
  const needleBase2 = polarToCartesian(cx, cy, 8, needleAngle - 90);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={width} height={height + 4} viewBox={`0 0 ${width} ${height + 4}`}>
        {zoneArcs.map((z) => (
          <path key={z.label} d={z.path} fill={z.color} />
        ))}
        {zoneArcs.map((z) => (
          <text
            key={`label-${z.label}`}
            x={z.labelPos.x}
            y={z.labelPos.y}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="#1A1A1A"
          >
            {z.label}
          </text>
        ))}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill="#1A1A1A"
        />
        <circle cx={cx} cy={cy} r={7} fill="#1A1A1A" />
      </svg>
      <Typography variant="h4" sx={{ mt: -1, color: "#1A1A1A", fontWeight: 700 }}>
        {valueLabel ?? `${Math.round(value)}%`}
      </Typography>
    </Box>
  );
}
