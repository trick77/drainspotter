import { ReactNode } from "react";
import { clsx } from "clsx";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartFrame({ title, subtitle, actions, children, className }: Props) {
  return (
    <div className={clsx("glass-card p-5 flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="kpi-label">{title}</div>
          {subtitle && <div className="text-sm text-white/50 mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
