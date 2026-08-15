import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface OrganicBadgeProps {
  size: number;
  color: string;
  children?: React.ReactNode;
}

const POINTS = 8;
const INNER_RATIO = 0.82;
const CORNER_SMOOTHING = 0.62;

/**
 * Badge "blob" organik -- ciri khas M3 Expressive buat momen "delightful"
 * (lihat `m3.material.io`, family shape "Cookie"/"Sunny"). SENGAJA ditaruh
 * cuma di `CelebrationOverlay` (1 tempat, momen jarang -- maksimal 1x/hari)
 * biar gak bentrok konsistensi visual sama elemen lain yang muncul
 * terus-terusan (nav bar, card, dst masih shape M3 standar/persegi-bulat).
 *
 * Path SENGAJA di-generate sendiri lewat rumus polygon (titik luar/dalam
 * berselang-seling) + corner-rounding generik, BUKAN nyalin data shape
 * resmi Google -- punya mereka computed lewat library native khusus
 * (`androidx.graphics.shapes`) yang gak ada versi React Native-nya. Hasilnya
 * "terinspirasi" (soft blob 8 sisi), bukan replika 1:1.
 */
export function OrganicBadge({ size, color, children }: OrganicBadgeProps) {
  const path = useMemo(() => buildBlobPath(size), [size]);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }} viewBox={`0 0 ${size} ${size}`}>
        <Path d={path} fill={color} />
      </Svg>
      {children}
    </View>
  );
}

function buildBlobPath(size: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * INNER_RATIO;
  const totalPoints = POINTS * 2;

  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }

  // Corner-rounding generik: tiap vertex ditarik mundur sepanjang 2 edge
  // yang ketemu di situ (kearah tetangga sebelum/sesudah), disambung pake
  // kurva quadratic (Q) yang lewatin vertex asli sebagai control point --
  // teknik umum buat "membulatkan" polygon apapun, bukan spesifik shape ini.
  let d = "";
  vertices.forEach((curr, i) => {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const next = vertices[(i + 1) % vertices.length];

    const pStart = {
      x: curr.x + (prev.x - curr.x) * CORNER_SMOOTHING,
      y: curr.y + (prev.y - curr.y) * CORNER_SMOOTHING,
    };
    const pEnd = {
      x: curr.x + (next.x - curr.x) * CORNER_SMOOTHING,
      y: curr.y + (next.y - curr.y) * CORNER_SMOOTHING,
    };

    d += i === 0 ? `M ${pStart.x} ${pStart.y} ` : `L ${pStart.x} ${pStart.y} `;
    d += `Q ${curr.x} ${curr.y} ${pEnd.x} ${pEnd.y} `;
  });
  d += "Z";
  return d;
}
