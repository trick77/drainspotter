import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { clsx } from "clsx";

type Props = {
  onFile: (file: File) => void;
  hero?: boolean;
};

export function DropZone({ onFile, hero = false }: Props) {
  const [isOver, setIsOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={clsx(
        "glass-card flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
        "border-dashed",
        hero ? "p-16 min-h-[60vh]" : "p-8",
        isOver
          ? "border-drain-400 bg-drain-400/10 shadow-[0_0_60px_rgba(251,146,60,0.3)]"
          : "border-border-strong hover:border-fg-faint"
      )}
    >
      <Upload className={clsx("text-fg-subtle", hero ? "w-16 h-16" : "w-8 h-8")} />
      <div className="text-center">
        <div className={clsx("font-medium", hero ? "text-2xl" : "text-base")}>
          Drop CSV here or click
        </div>
        <div className="text-sm text-fg-subtle mt-1">
          GitHub Copilot premiumRequestUsageReport
        </div>
      </div>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handlePick}
      />
    </label>
  );
}
