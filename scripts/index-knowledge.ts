/**
 * Index Knowledge Base Script
 * Run with: npx tsx scripts/index-knowledge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment - try both .env.local and .env
config({ path: '.env.local' });
config({ path: '.env' });

import { chunkDocument } from '../lib/rag/chunking';
import { generateEmbedding } from '../lib/rag/embeddings';
import { insertChunks, clearAllChunks, getKnowledgeStats } from '../lib/rag/search';
import type { KnowledgeChunk } from '../lib/rag/types';

// Knowledge files location
const KNOWLEDGE_DIR = path.join(process.cwd(), '.claude', 'RAG');
const PROJECT_KNOWLEDGE = path.join(process.cwd(), 'EMS_Test_Line_Reference_Guide.md');

async function main() {
  console.log('🚀 Starting knowledge base indexing...\n');
  
  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    console.error('   Please set GEMINI_API_KEY in .env or .env.local');
    process.exit(1);
  }
  
  console.log('✅ GEMINI_API_KEY found');
  
  // Check for Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found');
    process.exit(1);
  }
  
  console.log('✅ Supabase configured\n');
  
  // Get all knowledge files
  const files: Array<{ filepath: string; filename: string }> = [];
  
  // Add files from RAG directory
  if (fs.existsSync(KNOWLEDGE_DIR)) {
    const ragFiles = fs.readdirSync(KNOWLEDGE_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        filepath: path.join(KNOWLEDGE_DIR, f),
        filename: f,
      }));
    files.push(...ragFiles);
  }
  
  // Add project knowledge file if exists
  if (fs.existsSync(PROJECT_KNOWLEDGE)) {
    files.push({
      filepath: PROJECT_KNOWLEDGE,
      filename: path.basename(PROJECT_KNOWLEDGE),
    });
  }
  
  console.log(`📁 Found ${files.length} knowledge files:`);
  files.forEach(f => console.log(`   - ${f.filename}`));
  console.log('');
  
  // Clear existing chunks
  console.log('🗑️  Clearing existing chunks...');
  try {
    await clearAllChunks();
    console.log('   Done\n');
  } catch (error) {
    console.log('   No existing chunks or table not created yet\n');
  }
  
  // Process each file
  const allChunks: KnowledgeChunk[] = [];
  
  for (const file of files) {
    console.log(`\n📄 Processing: ${file.filename}`);
    
    // Read file
    const content = fs.readFileSync(file.filepath, 'utf-8');
    console.log(`   Read ${content.length} characters`);
    
    // Chunk document
    const chunks = chunkDocument(content, file.filename, {
      maxTokens: 500,
      overlapTokens: 100,
      preserveHeaders: true,
    });
    console.log(`   Created ${chunks.length} chunks`);
    
    // Generate embeddings
    console.log(`   Generating embeddings...`);
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await generateEmbedding(chunks[i].content);
        chunks[i].embedding = result.embedding;
        
        // Progress indicator
        if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
          process.stdout.write(`\r   Embeddings: ${i + 1}/${chunks.length}`);
        }
      } catch (error: any) {
        console.error(`\n   ❌ Error embedding chunk ${i}:`, error.message);
        // Wait and retry once
        await new Promise(r => setTimeout(r, 1000));
        try {
          const result = await generateEmbedding(chunks[i].content);
          chunks[i].embedding = result.embedding;
        } catch (retryError: any) {
          console.error(`   ❌ Retry failed:`, retryError.message);
        }
      }
    }
    console.log(''); // New line after progress
    
    allChunks.push(...chunks);
  }
  
  // Insert all chunks
  console.log(`\n💾 Inserting ${allChunks.length} chunks into database...`);
  
  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    try {
      const count = await insertChunks(batch);
      inserted += count;
      process.stdout.write(`\r   Inserted: ${inserted}/${allChunks.length}`);
    } catch (error: any) {
      console.error(`\n   ❌ Insert error at batch ${i}:`, error.message);
    }
  }
  console.log('');
  
  // Show stats
  console.log('\n📊 Knowledge Base Stats:');
  try {
    const stats = await getKnowledgeStats();
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Total tokens: ~${stats.totalTokens.toLocaleString()}`);
    console.log('   By source:');
    Object.entries(stats.bySource).forEach(([source, count]) => {
      console.log(`     - ${source}: ${count} chunks`);
    });
  } catch (error: any) {
    console.log(`   Could not get stats: ${error.message}`);
  }
  
  console.log('\n✅ Knowledge base indexing complete!');
}

main().catch(console.error);
