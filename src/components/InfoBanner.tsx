import { Info } from "lucide-react";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export function InfoBanner({ children }: Props) {
  return (
    <div className="glass-card border-border-strong bg-surface-muted p-3 flex items-start gap-3 text-sm text-fg-muted">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
