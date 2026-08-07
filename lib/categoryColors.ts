export const PASTEL_PRESETS = [
  { name: "Sage Green", hex: "#DCEBDD" },
  { name: "Sky Blue", hex: "#DCEAF7" },
  { name: "Lavender", hex: "#E7E0F8" },
  { name: "Peach", hex: "#FBE4D8" },
  { name: "Butter Yellow", hex: "#FBF3D0" },
];

// Paleta extendida usada como fallback en gráficas para categorías sin color propio.
export const SEED_PALETTE = [
  "#DCEBDD", "#DCEAF7", "#E7E0F8", "#FBE4D8", "#FBF3D0",
  "#D9F0E6", "#FBE0EA", "#F2E8D8", "#E3E4FB", "#DCE9E3",
];

export function colorForIndex(i: number) {
  return SEED_PALETTE[i % SEED_PALETTE.length];
}
