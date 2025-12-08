export async function parseUploadedFile(file: File) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    boardTypes: ['Main Board', 'Sub Board'],
    totalStations: 8,
    stations: [
      {
        boardType: 'Main Board',
        original: 'MT',
        mapped: 'MBT',
        confidence: 95,
      },
      {
        boardType: 'Main Board',
        original: 'CAL',
        mapped: 'CAL',
        confidence: 100,
      },
      {
        boardType: 'Main Board',
        original: 'RFT1',
        mapped: 'RFT1',
        confidence: 100,
      },
      {
        boardType: 'Main Board',
        original: 'FQC',
        mapped: 'FQC',
        confidence: 100,
      },
      {
        boardType: 'Main Board',
        original: 'BLMMI',
        mapped: 'BLMMI',
        confidence: 100,
      },
      {
        boardType: 'Sub Board',
        original: 'Thermal_Gress',
        mapped: 'T_GREASE',
        confidence: 88,
      },
      {
        boardType: 'Sub Board',
        original: 'SHIELD',
        mapped: 'SHIELD',
        confidence: 100,
      },
      {
        boardType: 'Sub Board',
        original: 'Signal Test',
        mapped: 'RFT',
        confidence: 72,
      },
    ],
  };
}

export async function mapStationTerms(terms: string[]) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mappings: Record<string, { mapped: string; confidence: number }> = {
    MT: { mapped: 'MBT', confidence: 95 },
    Thermal_Gress: { mapped: 'T_GREASE', confidence: 88 },
    'Signal Test': { mapped: 'RFT', confidence: 72 },
  };

  return terms.map((term) => ({
    original: term,
    ...(mappings[term] || { mapped: term, confidence: 100 }),
  }));
}
