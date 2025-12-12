/**
 * Knowledge Base Ingest Script
 * 
 * Usage:
 *   npx ts-node scripts/ingest-knowledge.ts <filepath>
 *   
 * Example:
 *   npx ts-node scripts/ingest-knowledge.ts Manpower_Calculation_Formulas_for_EMS_and_PCB_Assembly_Lines.md
 *   npx ts-node scripts/ingest-knowledge.ts EMS_Test_Line_Reference_Guide.md
 */

import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function ingestFile(filepath: string) {
  // Resolve path
  const fullPath = path.isAbsolute(filepath) 
    ? filepath 
    : path.join(process.cwd(), filepath);
  
  console.log(`📂 Reading file: ${fullPath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const filename = path.basename(fullPath);
  
  console.log(`📄 File size: ${content.length} characters`);
  console.log(`🚀 Sending to API...`);
  
  try {
    const response = await fetch(`${API_URL}/api/rag/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        filename,
        replace: true,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`\n✅ SUCCESS!`);
      console.log(`   📦 Chunks created: ${result.chunksCreated}`);
      console.log(`   🔢 Total tokens: ${result.totalTokens}`);
      console.log(`\n📊 Knowledge Base Stats:`);
      console.log(`   Total chunks: ${result.stats.totalChunks}`);
      console.log(`   By source:`);
      for (const [source, count] of Object.entries(result.stats.bySource)) {
        console.log(`     - ${source}: ${count} chunks`);
      }
    } else {
      console.error(`\n❌ FAILED: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error);
    process.exit(1);
  }
}

// Main
const filepath = process.argv[2];

if (!filepath) {
  console.log(`
Usage: npx ts-node scripts/ingest-knowledge.ts <filepath>

Available knowledge files:
  - Manpower_Calculation_Formulas_for_EMS_and_PCB_Assembly_Lines.md
  - EMS_Test_Line_Reference_Guide.md

Example:
  npx ts-node scripts/ingest-knowledge.ts Manpower_Calculation_Formulas_for_EMS_and_PCB_Assembly_Lines.md
`);
  process.exit(0);
}

ingestFile(filepath);
