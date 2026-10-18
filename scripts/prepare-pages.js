#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('node:fs');
const path = require('node:path');

// Vercel CLI is only used to produce the Build Output API files locally.
// No Vercel account, login, or deployment is needed for Cloudflare Pages.
// Create the same local project stub as next-on-pages, then run the CLI from
// our lockfile instead of allowing the adapter to download an unpinned CLI.
const projectDir = path.resolve(__dirname, '..', '.vercel');
const projectFile = path.join(projectDir, 'project.json');

if (!fs.existsSync(projectFile)) {
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(
    projectFile,
    JSON.stringify({
      projectId: '_',
      orgId: '_',
      settings: { framework: 'nextjs' },
    }) + '\n'
  );
}
