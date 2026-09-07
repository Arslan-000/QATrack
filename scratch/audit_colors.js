const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const rootDir = process.cwd();
const allFiles = getAllFiles(path.join(rootDir, 'js'), []);
allFiles.push(path.join(rootDir, 'index.html'));

const results = [];

allFiles.forEach(filePath => {
  const relPath = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((line, idx) => {
    if (/(?:bg-blue|text-blue|border-blue|ring-blue|focus:ring-blue|accent-blue|bg-sky|text-sky|border-sky|ring-sky|focus:ring-sky|accent-sky)/i.test(line)) {
      matches.push({ lineNum: idx + 1, text: line.trim() });
    }
  });

  if (matches.length > 0) {
    results.push({ relPath, count: matches.length, matches });
  }
});

console.log('SUMMARY OF FILES WITH BLUE/SKY:');
results.forEach(r => {
  console.log(`- ${r.relPath}: ${r.count} matches`);
});
