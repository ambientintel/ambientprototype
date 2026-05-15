#!/usr/bin/env node
/**
 * PostToolUse hook — fires after Write/Edit tool calls.
 * If a new src/app/ page.tsx was just written, checks whether
 * it already has an entry in the archive page and warns if not.
 */

const fs = require('fs');
const path = require('path');

// Read hook payload from stdin
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let payload;
  try { payload = JSON.parse(raw); } catch { process.exit(0); }

  const filePath = payload?.tool_input?.file_path ?? '';

  // Only care about src/app/**/page.tsx (but not the archive itself)
  const isAppPage = /src\/app\/.+\/page\.tsx$/.test(filePath);
  const isArchive = filePath.includes('/archive/page.tsx');
  if (!isAppPage || isArchive) process.exit(0);

  // Derive the route from the file path
  const appRoot = filePath.replace(/^.*\/src\/app/, '').replace(/\/page\.tsx$/, '') || '/';
  // Skip dynamic segments, sub-apps, and auth pages — these are intentionally unlisted
  const skipPatterns = [/\/\[/, /\/app$/, /\/share/, /\/employees/, /\/game$/, /dashboard\//,
                        /\/login$/, /\/forgot-password$/, /\/verify$/, /\/callback$/, /\/orgchart$/, /\/onboarding$/, /\/payroll$/];
  if (skipPatterns.some(p => p.test(appRoot))) process.exit(0);

  // Read archive and extract all hrefs
  const cwd = payload?.cwd ?? process.cwd();
  const archivePath = path.join(cwd, 'src/app/archive/page.tsx');
  let archiveSource = '';
  try { archiveSource = fs.readFileSync(archivePath, 'utf8'); } catch { process.exit(0); }

  // Match href: '/someRoute' patterns
  const listed = new Set([...archiveSource.matchAll(/href:\s*'([^']+)'/g)].map(m => m[1]));

  if (!listed.has(appRoot)) {
    // Write to stderr so Claude Code surfaces it as a warning message
    process.stderr.write(
      `\n⚠️  Archive out of sync: ${appRoot} is not listed in /archive.\n` +
      `   Add an entry to src/app/archive/page.tsx before finishing this session.\n\n`
    );
    process.exit(2); // non-zero exit surfaces the stderr message to the user
  }

  process.exit(0);
});
