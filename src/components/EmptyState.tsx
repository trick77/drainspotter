import { ReactNode } from "react";

type Props = { icon?: ReactNode; title: string; description?: string };

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-fg-subtle">
      {icon && <div className="mb-3 text-fg-faint">{icon}</div>}
      <div className="font-medium text-fg-muted">{title}</div>
      {description && <div className="text-sm mt-1">{description}</div>}
    </div>
  );
}
