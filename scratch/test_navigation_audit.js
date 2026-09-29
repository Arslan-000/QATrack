const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
        results = results.concat(scanDir(filePath));
      }
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = scanDir('.');
const navMatches = [];
const regex = /navigate\(['"`]([a-zA-Z0-9_\-\?=&]+)['"`]\)/g;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    navMatches.push({ file: f, route: match[1] });
  }
});

console.log('Total navigate calls found in app files:', navMatches.length);
const uniqueRoutes = [...new Set(navMatches.map(m => m.route))];
console.log('Unique routes used in code:', uniqueRoutes);

// Now let's check which routes are handled in app.js switch statement
const appJs = fs.readFileSync('js/app.js', 'utf8');
const caseRegex = /case\s+["']([^"']+)["']\s*:/g;
const handledCases = [];
let caseMatch;
while ((caseMatch = caseRegex.exec(appJs)) !== null) {
  handledCases.push(caseMatch[1]);
}
console.log('Handled switch cases in app.js:', handledCases);

const unhandled = uniqueRoutes.filter(r => {
  const base = r.split('?')[0];
  return !handledCases.includes(base);
});
console.log('Unhandled routes (if any):', unhandled);
