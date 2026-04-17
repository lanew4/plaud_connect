#!/usr/bin/env node

require('dotenv').config();
const { getRecentFiles, getFileSummary } = require('./src/plaud');
const { findCommonThreads } = require('./src/claude');
const { createWordDoc } = require('./src/document');
const { execSync } = require('child_process');

(async () => {
  if (!process.env.PLAUD_TOKEN) {
    console.error('Missing PLAUD_TOKEN in .env');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY in .env');
    process.exit(1);
  }

  console.log('Fetching recordings from the past 7 days...');
  const files = await getRecentFiles(7);

  if (files.length === 0) {
    console.log('No recordings found in the past 7 days.');
    process.exit(0);
  }

  console.log(`Found ${files.length} recording(s). Fetching summaries...`);
  const summaries = [];
  for (const file of files) {
    const detail = await getFileSummary(file);
    if (detail.summary) {
      summaries.push(detail);
      console.log(`  ✓ ${detail.name} (${detail.date})`);
    } else {
      console.log(`  – ${detail.name}: no summary available, skipping`);
    }
  }

  if (summaries.length === 0) {
    console.log('No summaries available for analysis.');
    process.exit(0);
  }

  console.log('\nAnalyzing common threads with Claude...');
  const analysis = await findCommonThreads(summaries);

  console.log('Generating Word document...');
  const docPath = await createWordDoc(summaries, analysis);

  console.log(`\nDone! Document saved to: ${docPath}`);
  execSync(`open "${docPath}"`);
})();
