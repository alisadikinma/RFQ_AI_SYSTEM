// types/rfq.ts

export interface BoardVariant {
  id: string;
  code: string;
  boardType: string;          // "Main Board", "Sub Board", "LED Board", etc.
  emmcSize?: string;          // "256G", "128G", "32G"
  ramSize?: string;           // "12G", "8G", "3G"
  investment: number;         // Individual board investment
  stationCount: number;
  manpower: number;
  uph?: number;
}

export interface SimilarModel {
  id: string;                 // This is model_group.id or model.id
  code: string;               // Model code
  typeModel?: string;         // "N16", "C3S", "ZS660KL"
  customerName: string;
  customerCode: string;

  // Similarity
  similarity: number;         // 0.0 - 1.0

  // Aggregated from all boards
  totalBoards?: number;       // Count of board types
  totalStations: number;      // Sum across all boards (or stationCount)
  matchedStations: number | string[];    // Count or array of matched station codes
  missingStations?: string[]; // Stations in query but not in model
  extraStations?: string[];   // Stations in model but not in query
  allStations?: string[];     // All stations in the model
  totalManpower?: number;
  totalInvestment?: number;   // From model_groups.total_investment

  // Board variants (from models table)
  boards?: BoardVariant[];

  // Legacy compatibility
  stationCount?: number;      // = totalStations
  manpower: number;           // = totalManpower
  uph: number;                // From first Main Board
  cycleTime?: number;
}

export interface ExtractedStation {
  id?: string;
  code: string;
  name?: string;
  section?: string;
  boardType?: string;         // Which board this station belongs to
  sequence?: number;
  isValid?: boolean;
  suggestedCode?: string;
  confidence?: number;
  reason?: string;
}

export interface BoardStation {
  id: string;
  stationCode: string;
  stationName?: string;
  sequence: number;
  manpower: number;
  cycleTime?: number;
  area?: string;
}

export interface ModelGroup {
  id: string;
  typeModel: string;
  customerName: string;
  customerCode: string;
  customerId: string;
  totalBoards: number;
  totalStations: number;
  totalManpower: number;
  totalInvestment: number;
  boards: BoardVariant[];
  createdAt: Date;
  updatedAt: Date;
}
