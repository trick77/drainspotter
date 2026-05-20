import { Info } from "lucide-react";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export function InfoBanner({ children }: Props) {
  return (
    <div className="glass-card border-white/15 bg-white/5 p-3 flex items-start gap-3 text-sm text-white/70">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
