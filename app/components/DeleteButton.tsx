"use client";

export default function DeleteButton({
  id,
  action,
  label = "Eliminar",
  confirmText = "¿Seguro que quieres eliminar esto?",
  className = "text-xs text-muted hover:text-warning transition-colors",
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className} title="Eliminar">
        {label}
      </button>
    </form>
  );
}
