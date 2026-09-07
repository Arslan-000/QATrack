const fs = require('fs');
const path = require('path');

const targetFiles = [
  'index.html',
  'js/views/dashboard.js',
  'js/views/projectWorkspace.js',
  'js/views/releases.js'
];

targetFiles.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  console.log(`\n================== ${relPath} ==================`);
  lines.forEach((line, idx) => {
    if (/(?:bg-blue|text-blue|border-blue|ring-blue|focus:ring-blue|accent-blue|bg-sky|text-sky|border-sky|ring-sky|focus:ring-sky|accent-sky)/i.test(line)) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  });
});
