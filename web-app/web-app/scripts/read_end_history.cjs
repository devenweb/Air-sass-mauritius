const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../docs/05_history.md');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);
for (let i = lines.length - 15; i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
