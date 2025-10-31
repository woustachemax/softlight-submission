#!/usr/bin/env tsx
import { writeFileSync } from 'fs';
import { config } from 'dotenv';
import { FigmaApiClient } from '../src/components/figma-api';
import { HtmlGenerator } from '../src/components/html-generator';
import type { FigmaNode } from '../src/types/types';

config();

function extractFileKey(input: string): string {
  const patterns = [
    /figma\.com\/design\/([a-zA-Z0-9]+)/,
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return input;
}

async function main() {
  const apiKey = process.env.FIGMA_API_KEY;
  const fileKeyEnv = process.env.FIGMA_FILE_KEY;

  if (!apiKey) {
    console.error('error: api not found in .env');
    process.exit(1);
  }

  if (!fileKeyEnv) {
    console.error('error: file not found in .env');
    process.exit(1);
  }

  const fileKey = extractFileKey(fileKeyEnv);
  const outputFile = process.argv[2] || 'output.html';

  console.log('fetching figma');
  const client = new FigmaApiClient(apiKey);
  
  try {
    const fileData = await client.getFile(fileKey);
    console.log('fetched');
    console.log(`name: ${fileData.name}`);
    
    const page = fileData.document.children[0];
    const frame = page.children[0] as FigmaNode;
    
    if (!frame) {
      throw new Error('no frame found');
    }
    
    console.log(`converting: ${frame.name}`);
    console.log(`frame has layoutMode: ${frame.layoutMode || 'none'}`);
    console.log(`frame background: ${JSON.stringify(frame.fills)}`);
    console.log(`frame children: ${frame.children?.length || 0}`);
    if (frame.children) {
      frame.children.forEach((child, i) => {
        console.log(`  ${i}: ${child.name} (${child.type}) layoutMode:${child.layoutMode || 'none'} x:${child.absoluteBoundingBox?.x} y:${child.absoluteBoundingBox?.y}`);
      });
    }
    
    const generator = new HtmlGenerator();
    const html = generator.generateHTML(frame);
    
    writeFileSync(outputFile, html, 'utf-8');
    console.log(`generated: ${outputFile}`);
    console.log(`frame: ${frame.name}`);
    console.log(`children: ${frame.children?.length || 0}`);
    console.log(`size: ${(html.length / 1024).toFixed(2)} kb`);
    
  } catch (error) {
    console.error('error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();