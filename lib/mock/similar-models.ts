import { SimilarModel } from "@/components/rfq/chat-v2/results/ModelCard";
import { ExtractedStation } from "@/components/rfq/chat-v2/results/ExtractedDataTable";

export const mockSimilarModels: SimilarModel[] = [
  {
    id: "1",
    code: "5G_PRO_V2",
    customerName: "XIAOMI",
    customerCode: "XI",
    similarity: 0.91,
    stationCount: 11,
    matchedStations: 9,
    manpower: 12,
    uph: 150,
    cycleTime: 240,
  },
  {
    id: "2",
    code: "4G_PLUS_V1",
    customerName: "HUAWEI",
    customerCode: "HW",
    similarity: 0.82,
    stationCount: 9,
    matchedStations: 7,
    manpower: 8,
    uph: 180,
    cycleTime: 200,
  },
  {
    id: "3",
    code: "TABLET_5G",
    customerName: "TCL",
    customerCode: "TC",
    similarity: 0.73,
    stationCount: 10,
    matchedStations: 7,
    manpower: 10,
    uph: 120,
    cycleTime: 300,
  },
];

export const mockExtractedStations: ExtractedStation[] = [
  { id: "1", code: "MBT", sequence: 1, isValid: true },
  { id: "2", code: "CAL1", sequence: 2, isValid: true },
  { id: "3", code: "CAL2", sequence: 3, isValid: true },
  { id: "4", code: "RF_TEST", sequence: 4, isValid: false, suggestedCode: "RFT" },
  { id: "5", code: "WIFIBT", sequence: 5, isValid: true },
  { id: "6", code: "4G_INSTRUMENT", sequence: 6, isValid: true },
  { id: "7", code: "MAINBOARD_MMI", sequence: 7, isValid: true },
  { id: "8", code: "SUBBOARD_MMI", sequence: 8, isValid: true },
  { id: "9", code: "UNKNOWN_TEST", sequence: 9, isValid: false },
  { id: "10", code: "VISUAL", sequence: 10, isValid: true },
  { id: "11", code: "PACKING", sequence: 11, isValid: true },
];
