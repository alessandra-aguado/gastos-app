import {
  ShoppingCart, Utensils, Bus, Clapperboard, Pill, Dumbbell, GraduationCap,
  Repeat, Plane, PawPrint, Users, UsersRound, Gift, Circle, Car, Film,
  Stethoscope, Home, Heart, Briefcase, Coffee, BookOpen, Music2, Gamepad2,
  Shirt, Smartphone, Wifi, Sparkles, Star, Wallet, CreditCard, Baby, Dog,
  Cat, ShoppingBag, Beer, Wine, Fuel, Wrench, PiggyBank, TrendingUp,
  DollarSign, Receipt, Tag, CircleDot, UserRound,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "utensils", label: "Comida", Icon: Utensils },
  { name: "shopping-cart", label: "Supermercado", Icon: ShoppingCart },
  { name: "shopping-bag", label: "Compras", Icon: ShoppingBag },
  { name: "car", label: "Auto", Icon: Car },
  { name: "bus", label: "Transporte", Icon: Bus },
  { name: "fuel", label: "Combustible", Icon: Fuel },
  { name: "plane", label: "Viajes", Icon: Plane },
  { name: "home", label: "Casa", Icon: Home },
  { name: "film", label: "Cine", Icon: Film },
  { name: "clapperboard", label: "Entretenimiento", Icon: Clapperboard },
  { name: "gamepad-2", label: "Videojuegos", Icon: Gamepad2 },
  { name: "music-2", label: "Música", Icon: Music2 },
  { name: "book-open", label: "Educación", Icon: BookOpen },
  { name: "graduation-cap", label: "Estudios", Icon: GraduationCap },
  { name: "pill", label: "Salud", Icon: Pill },
  { name: "stethoscope", label: "Médico", Icon: Stethoscope },
  { name: "heart", label: "Bienestar", Icon: Heart },
  { name: "dumbbell", label: "Gimnasio", Icon: Dumbbell },
  { name: "briefcase", label: "Trabajo", Icon: Briefcase },
  { name: "coffee", label: "Café", Icon: Coffee },
  { name: "beer", label: "Bar", Icon: Beer },
  { name: "wine", label: "Vino", Icon: Wine },
  { name: "gift", label: "Regalos", Icon: Gift },
  { name: "paw-print", label: "Mascota", Icon: PawPrint },
  { name: "dog", label: "Perro", Icon: Dog },
  { name: "cat", label: "Gato", Icon: Cat },
  { name: "baby", label: "Bebé", Icon: Baby },
  { name: "users", label: "Familia", Icon: Users },
  { name: "users-round", label: "Amigos", Icon: UsersRound },
  { name: "user-round", label: "Persona", Icon: UserRound },
  { name: "shirt", label: "Ropa", Icon: Shirt },
  { name: "smartphone", label: "Tecnología", Icon: Smartphone },
  { name: "wifi", label: "Internet", Icon: Wifi },
  { name: "repeat", label: "Suscripciones", Icon: Repeat },
  { name: "sparkles", label: "Especial", Icon: Sparkles },
  { name: "star", label: "Favorito", Icon: Star },
  { name: "wallet", label: "Billetera", Icon: Wallet },
  { name: "credit-card", label: "Tarjeta", Icon: CreditCard },
  { name: "piggy-bank", label: "Ahorro", Icon: PiggyBank },
  { name: "trending-up", label: "Inversión", Icon: TrendingUp },
  { name: "dollar-sign", label: "Dinero", Icon: DollarSign },
  { name: "receipt", label: "Recibo", Icon: Receipt },
  { name: "tag", label: "Etiqueta", Icon: Tag },
  { name: "wrench", label: "Mantenimiento", Icon: Wrench },
  { name: "circle-dot", label: "Otros", Icon: CircleDot },
];

export function getCategoryIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  const found = CATEGORY_ICONS.find((i) => i.name === name);
  return found ? found.Icon : null;
}

export const DEFAULT_ICON = Circle;
