import { FileSearch, Brain, Database, Sparkles, CheckCircle } from "lucide-react";
import { ProcessingStep } from "@/components/rfq/chat-v2/loading/ProcessingSteps";

export const DEFAULT_PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: "parse",
    label: "Membaca File",
    description: "Mengekstrak data dari file yang diupload...",
    icon: FileSearch,
  },
  {
    id: "analyze",
    label: "Menganalisis Konten",
    description: "AI sedang memahami station list...",
    icon: Brain,
  },
  {
    id: "search",
    label: "Mencari Model Serupa",
    description: "Mencocokkan dengan database historical...",
    icon: Database,
  },
  {
    id: "calculate",
    label: "Menghitung Estimasi",
    description: "Kalkulasi manpower dan biaya...",
    icon: Sparkles,
  },
  {
    id: "complete",
    label: "Selesai",
    description: "Menyiapkan hasil...",
    icon: CheckCircle,
  },
];
