import { Sparkles } from "lucide-react";

type Props = { onLoad: (file: File) => void };

export function DemoDataButton({ onLoad }: Props) {
  const handleClick = async () => {
    const res = await fetch("/demo.csv");
    const blob = await res.blob();
    const file = new File([blob], "demo.csv", { type: "text/csv" });
    onLoad(file);
  };
  return (
    <button
      onClick={handleClick}
      className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/8 transition-colors"
    >
      <Sparkles className="w-4 h-4 text-drain-400" />
      Beispieldaten laden
    </button>
  );
}
