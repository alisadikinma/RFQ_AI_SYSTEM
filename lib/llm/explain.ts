/**
 * LLM Explanation Functions
 * Generates human-readable explanations and suggestions for RFQ results
 */

import { callLLMJSON } from './client';

export interface ExplainParams {
  modelName: string;
  customerName: string;
  topMatch: string;
  score: number;
  confidence: string;
  matched: string[];
  missing: string[];
  inferred: string[];
  riskScore: number;
  riskFlags: string[];
  investment: number;
}

export interface RFQExplanation {
  summary: string;
  similarity_explanation: string;
  station_analysis: string;
  risk_summary: string;
  recommendations: string[];
}

export interface SuggestionParams {
  productType: string;
  volume: number;
  targetUPH: number;
  stations: string[];
  issues: string[];
  costs: {
    labor: number;
    test: number;
    fixture: number;
  };
}

export interface Suggestion {
  category: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: string;
}

const EXPLAIN_SYSTEM_PROMPT = `Anda adalah ahli manufaktur EMS (Electronic Manufacturing Services).
Tugas Anda adalah membuat penjelasan yang jelas dan ringkas dalam Bahasa Indonesia tentang hasil analisis RFQ.
Fokus pada informasi praktis yang berguna untuk tim engineering dan quotation.
Format respons dalam JSON sesuai struktur yang diminta.`;

const SUGGEST_SYSTEM_PROMPT = `Anda adalah konsultan manufaktur EMS senior.
Berikan saran optimasi untuk proses manufaktur berdasarkan data RFQ.
Fokus pada efisiensi biaya, kualitas, dan kapasitas.
Respons dalam Bahasa Indonesia, format JSON.`;

/**
 * Generate explanation for RFQ result in Bahasa Indonesia
 */
export async function explainRFQResult(params: ExplainParams): Promise<RFQExplanation> {
  const prompt = `
Analisis RFQ berikut dan berikan penjelasan dalam Bahasa Indonesia:

Model Baru: ${params.modelName}
Customer: ${params.customerName}
Model Referensi Terdekat: ${params.topMatch || 'Tidak ditemukan'}
Skor Kemiripan: ${Math.round(params.score * 100)}%
Confidence: ${params.confidence}

Station yang Cocok: ${params.matched.length > 0 ? params.matched.join(', ') : 'Tidak ada'}
Station yang Kurang: ${params.missing.length > 0 ? params.missing.join(', ') : 'Tidak ada'}
Station yang Disarankan: ${params.inferred.length > 0 ? params.inferred.join(', ') : 'Tidak ada'}

Risk Score: ${params.riskScore}/5
Risk Flags: ${params.riskFlags.length > 0 ? params.riskFlags.join('; ') : 'Tidak ada'}

Total Investment: $${params.investment.toLocaleString()}

Berikan respons dalam format JSON:
{
  "summary": "Ringkasan 1-2 kalimat tentang kelayakan RFQ ini",
  "similarity_explanation": "Penjelasan mengapa model referensi dipilih dan seberapa relevan",
  "station_analysis": "Analisis coverage test station dan gap yang perlu diperhatikan",
  "risk_summary": "Ringkasan risiko utama dan tingkat keparahan",
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2", "Rekomendasi 3"]
}`;

  try {
    const result = await callLLMJSON<RFQExplanation>(
      [
        { role: 'system', content: EXPLAIN_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, max_tokens: 1500 }
    );

    return result;
  } catch (error) {
    console.error('LLM explanation failed:', error);
    // Return fallback explanation
    return {
      summary: `RFQ untuk ${params.modelName} (${params.customerName}) memiliki kemiripan ${Math.round(params.score * 100)}% dengan model referensi ${params.topMatch || 'tidak ada'}.`,
      similarity_explanation: params.topMatch
        ? `Model ${params.topMatch} dipilih sebagai referensi berdasarkan kesamaan karakteristik PCB dan BOM.`
        : 'Tidak ditemukan model referensi yang cukup mirip.',
      station_analysis: `Terdapat ${params.matched.length} station yang cocok${params.missing.length > 0 ? ` dan ${params.missing.length} station yang perlu ditambahkan` : ''}.`,
      risk_summary: params.riskScore >= 3
        ? 'Terdapat risiko tinggi yang perlu diperhatikan sebelum proceed.'
        : 'Risiko dalam batas normal untuk NPI.',
      recommendations: params.riskFlags.length > 0
        ? params.riskFlags.map(f => `Perhatikan: ${f}`)
        : ['Review konfigurasi station sebelum quotation'],
    };
  }
}

/**
 * Generate optimization suggestions
 */
export async function generateSuggestions(params: SuggestionParams): Promise<Suggestion[]> {
  const prompt = `
Berikan saran optimasi untuk RFQ manufaktur berikut:

Tipe Produk: ${params.productType}
Volume Target: ${params.volume.toLocaleString()} unit/bulan
Target UPH: ${params.targetUPH}
Test Stations: ${params.stations.join(', ')}

Issues yang Teridentifikasi:
${params.issues.length > 0 ? params.issues.map(i => `- ${i}`).join('\n') : '- Tidak ada issue major'}

Estimasi Biaya:
- Labor: $${params.costs.labor.toLocaleString()}/bulan
- Test Equipment Depreciation: $${params.costs.test.toLocaleString()}
- Fixture: $${params.costs.fixture.toLocaleString()}

Berikan 3-5 saran optimasi dalam format JSON array:
[
  {
    "category": "Cost|Quality|Capacity|Risk",
    "title": "Judul singkat saran",
    "description": "Penjelasan detail dalam 1-2 kalimat",
    "impact": "low|medium|high",
    "action": "Langkah konkret yang bisa diambil"
  }
]`;

  try {
    const result = await callLLMJSON<Suggestion[]>(
      [
        { role: 'system', content: SUGGEST_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.4, max_tokens: 2000 }
    );

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('LLM suggestions failed:', error);
    // Return fallback suggestions
    const suggestions: Suggestion[] = [];

    if (params.issues.length > 0) {
      suggestions.push({
        category: 'Risk',
        title: 'Address Identified Issues',
        description: `Terdapat ${params.issues.length} issue yang perlu ditangani sebelum mass production.`,
        impact: 'high',
        action: 'Review dan mitigasi setiap issue yang teridentifikasi.',
      });
    }

    if (params.costs.labor > params.costs.fixture) {
      suggestions.push({
        category: 'Cost',
        title: 'Optimize Manpower',
        description: 'Biaya labor lebih tinggi dari biaya fixture, pertimbangkan automasi.',
        impact: 'medium',
        action: 'Evaluasi station yang bisa di-automate untuk mengurangi headcount.',
      });
    }

    suggestions.push({
      category: 'Quality',
      title: 'NPI Yield Planning',
      description: 'Siapkan buffer untuk yield loss pada fase NPI.',
      impact: 'medium',
      action: 'Plan 85-90% FPY untuk 3 bulan pertama, review dan improve secara bertahap.',
    });

    return suggestions;
  }
}
