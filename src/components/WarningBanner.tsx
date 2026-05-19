import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export function WarningBanner({ children }: Props) {
  return (
    <div className="glass-card border-amber-400/40 bg-amber-400/10 p-3 flex items-start gap-3 text-sm text-amber-100">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
