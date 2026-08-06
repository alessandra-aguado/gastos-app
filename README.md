# Mis Gastos — Ale

App personal de control de gastos. Ver `docs/` (o el documento de arquitectura compartido en chat) para el detalle completo del modelo de datos y el plan de fases.

## Estado actual (Fase 0)

- Next.js 16 + TypeScript + Tailwind v4, App Router.
- Navegación completa con las 10 secciones (Inicio, Gastos, Presupuesto, Metas, Inversiones, Debo, Fijos, Asistencia IA, Deseos, Ajustes).
- Inicio con datos de ejemplo (mock) — resumen del mes, chips por sección, gasto diario, categorías.
- El resto de secciones son placeholders: se van llenando fase por fase.
- `prisma/schema.prisma` con el modelo de datos completo (aún no conectado a la UI).

## Cómo correrlo

```bash
npm install
cp .env.example .env   # y pon tu propia base de datos
npx prisma generate
npm run dev
```

Abre http://localhost:3000

## Siguientes fases

Ver el documento `app_gastos_estructura_y_modelo_de_datos.md` compartido en la conversación con Claude — tiene las 10 fases completas (OCR, voz, categorización con IA, ahorros, deudas, deseos, asistente IA, correo).
