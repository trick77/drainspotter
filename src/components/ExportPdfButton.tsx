import { FileDown } from "lucide-react";

export function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/8 transition-colors"
    >
      <FileDown className="w-4 h-4" />
      PDF exportieren
    </button>
  );
}
