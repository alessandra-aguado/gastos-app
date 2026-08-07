import { CATEGORY_ICONS, DEFAULT_ICON } from "@/lib/categoryIcons";

export default function CategoryIcon({
  icon,
  size = 18,
  className = "",
}: {
  icon: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const match = icon ? CATEGORY_ICONS.find((i) => i.name === icon) : undefined;

  if (match) {
    const Icon = match.Icon;
    return <Icon size={size} strokeWidth={1.75} className={className} />;
  }
  if (icon) {
    // compatibilidad con categorías antiguas guardadas como emoji
    return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{icon}</span>;
  }
  const Fallback = DEFAULT_ICON;
  return <Fallback size={size} strokeWidth={1.75} className={className} />;
}
