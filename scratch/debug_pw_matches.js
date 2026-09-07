const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'views', 'projectWorkspace.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== PROJECT WORKSPACE COLOR MATCHES ===');
lines.forEach((line, idx) => {
  if (/(?:bg-blue|text-blue|border-blue|ring-blue|focus:ring-blue|accent-blue|bg-sky|text-sky|border-sky|ring-sky|focus:ring-sky|accent-sky)/i.test(line)) {
    console.log(`\n--- Line ${idx + 1} ---`);
    for (let j = Math.max(0, idx - 2); j <= Math.min(lines.length - 1, idx + 2); j++) {
      console.log(`${j === idx ? '>>' : '  '} L${j + 1}: ${lines[j]}`);
    }
  }
});
