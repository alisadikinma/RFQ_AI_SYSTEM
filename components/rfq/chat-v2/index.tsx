// Sidebar integration components (used in main layout Sidebar)
export { ChatHistorySection } from "./ChatHistorySection";
export { ChatHistoryItem } from "./ChatHistoryItem";
export { NewChatButton } from "./NewChatButton";

// Layout components (for standalone chat layout - legacy)
export { ChatLayout } from "./layout/ChatLayout";
export { Sidebar as ChatSidebar } from "./layout/Sidebar";
export { ChatHistoryItem as LegacyChatHistoryItem } from "./layout/ChatHistoryItem";
export { NewChatButton as LegacyNewChatButton } from "./layout/NewChatButton";

// Main components
export { ChatMain } from "./main/ChatMain";
export { WelcomeScreen } from "./main/WelcomeScreen";
export { MessageList } from "./main/MessageList";
export { MessageBubble } from "./main/MessageBubble";

// Input components
export { ChatInputArea } from "./input/ChatInputArea";
export { FilePreview } from "./input/FilePreview";
export { FileDropzone } from "./input/FileDropzone";
export type { UploadedFile } from "./input/FilePreview";

// Loading components
export { ProcessingOverlay } from "./loading/ProcessingOverlay";
export { ProcessingSteps } from "./loading/ProcessingSteps";
export type { ProcessingStep } from "./loading/ProcessingSteps";

// Results components (Phase 7C)
export { ExtractedDataTable } from "./results/ExtractedDataTable";
export { SimilarModelCards } from "./results/SimilarModelCards";
export { ModelCard } from "./results/ModelCard";
export { ScoreRing } from "./results/ScoreRing";
export type { ExtractedStation } from "./results/ExtractedDataTable";
export type { SimilarModel, BoardVariant } from "./results/ModelCard";

// Modal components (Phase 7D)
export { ModelDetailModal } from "./results/ModelDetailModal";
export { ComparisonTable } from "./results/ComparisonTable";
export { InvestmentSummary } from "./results/InvestmentSummary";

// Board components (Phase 7E)
export { BoardStationsTable } from "./results/BoardStationsTable";

// Animation configs
export * from "./animations/motion-variants";
