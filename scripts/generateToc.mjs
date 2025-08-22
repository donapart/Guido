#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const files = [
  'README.md',
  'README.en.md',
  'VOICE_CONTROL.md',
  'VOICE_FEATURES.md',
  'vscode_cursor_model_router_spezifikation_scaffold.md',
  ...readdirSync(join(root,'docs')).filter(f=>f.endsWith('.md')).map(f=>`docs/${f}`)
];

function slug(str){
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
}

for (const file of files) {
  let content;
  try { content = readFileSync(file,'utf8'); } catch { continue; }
  const lines = content.split(/\r?\n/);
  // Normalize blank lines before headings & lists
  const out = [];
  for (let i=0;i<lines.length;i++) {
    const line = lines[i];
    const prev = out[out.length-1];
    const isHeading = /^#{1,6} /.test(line);
    const isList = /^(-|\*|\d+\.)\s+/.test(line);
    const isFence = /^```/.test(line);
    if ((isHeading || isList || isFence) && prev && prev.trim()!=='' ) {
      out.push('');
    }
    // Add language to fence if missing
    if (/^```$/.test(line)) {
      out.push('```text');
      continue;
    }
    out.push(line);
  }
  let normalized = out.join('\n');
  // Build TOC
  const headings = normalized.match(/^##?\s+.+$/gm) || [];
  const toc = headings.map(h=>{
    const level = h.startsWith('## ')?2:h.startsWith('# ')?1:0;
    if (level===0) return null;
    if (level===1) return null; // skip top title
    const title = h.replace(/^#+\s+/,'').trim();
    return `- [${title}](#${slug(title)})`; }).filter(Boolean).join('\n');
  const tocBlock = `<!-- TOC START -->\n${toc}\n<!-- TOC END -->`;
  if (/<!-- TOC START -->[\s\S]*?<!-- TOC END -->/.test(normalized)) {
    normalized = normalized.replace(/<!-- TOC START -->[\s\S]*?<!-- TOC END -->/, tocBlock);
  } else {
    // Insert after first heading line
    normalized = normalized.replace(/^(# .+\n)/, `$1\n${tocBlock}\n\n`);
  }
  writeFileSync(file, normalized, 'utf8');
  console.log('Updated TOC & formatting for', file);
}
