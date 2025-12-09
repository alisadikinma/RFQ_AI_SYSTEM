/**
 * Station Extractor
 * Extract station data from parsed tables with filtering
 */

import {
  ParsedTable,
  ExtractionConfig,
  ExtractionResult,
  ExtractedStation,
} from './types';

/**
 * Extract stations from parsed table based on configuration
 */
export function extractStations(
  table: ParsedTable,
  config: ExtractionConfig
): ExtractionResult {
  const stations: ExtractedStation[] = [];
  let skippedRows = 0;

  for (const row of table.rows) {
    // Get station name
    const name = row.cells[config.stationNameColumn]?.trim();

    if (!name) {
      skippedRows++;
      continue;
    }

    // Check status filter
    if (config.statusColumn !== null) {
      const status = row.cells[config.statusColumn]?.trim();
      if (status !== config.statusFilterValue) {
        skippedRows++;
        continue;
      }
    }

    // Get optional fields
    const section =
      config.sectionColumn !== null
        ? row.cells[config.sectionColumn]?.trim() || null
        : null;

    // Find description column (longest text that's not the station name)
    const description = config.includeDescription
      ? findDescriptionInRow(row.cells, config.stationNameColumn)
      : null;

    stations.push({
      name,
      section,
      description,
      originalRow: row.index,
      status:
        config.statusColumn !== null ? row.cells[config.statusColumn] : null,
    });
  }

  return {
    stations,
    totalRows: table.rows.length,
    includedRows: stations.length,
    skippedRows,
    skippedHeaders: config.skipHeaderRows,
  };
}

/**
 * Find description text in row (longest cell that's not station name)
 */
function findDescriptionInRow(
  cells: string[],
  stationNameColumn: number
): string | null {
  let longestText = '';
  for (let i = 0; i < cells.length; i++) {
    if (i === stationNameColumn) continue;
    const cell = cells[i]?.trim() || '';
    if (cell.length > 20 && cell.length > longestText.length) {
      longestText = cell;
    }
  }
  return longestText || null;
}

/**
 * Get unique station names for resolution
 */
export function getUniqueStationNames(result: ExtractionResult): string[] {
  const unique = new Set<string>();

  for (const station of result.stations) {
    // Clean station name
    const cleaned = cleanStationName(station.name);
    if (cleaned) {
      unique.add(cleaned);
    }
  }

  return Array.from(unique);
}

/**
 * Clean station name for resolution
 * Handles formats like "MBT / Manual Bench Test" → "MBT"
 */
function cleanStationName(name: string): string {
  return (
    name
      .trim()
      .split(/[\s\/]+/)[0] // Take first part if "MBT / Manual Bench Test"
      .toUpperCase()
      .replace(/[^A-Z0-9_\-]/g, '')
  ); // Remove special chars
}

/**
 * Group stations by section
 */
export function groupStationsBySection(
  result: ExtractionResult
): Record<string, ExtractedStation[]> {
  const groups: Record<string, ExtractedStation[]> = {};

  for (const station of result.stations) {
    const section = station.section || 'Unknown';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(station);
  }

  return groups;
}

/**
 * Get extraction statistics
 */
export function getExtractionStats(result: ExtractionResult): {
  totalRows: number;
  includedRows: number;
  skippedRows: number;
  uniqueStations: number;
  sections: string[];
} {
  const uniqueNames = getUniqueStationNames(result);
  const sectionsSet = new Set(
    result.stations.map((s) => s.section).filter((s): s is string => s !== null)
  );
  const sections = Array.from(sectionsSet);

  return {
    totalRows: result.totalRows,
    includedRows: result.includedRows,
    skippedRows: result.skippedRows,
    uniqueStations: uniqueNames.length,
    sections,
  };
}
