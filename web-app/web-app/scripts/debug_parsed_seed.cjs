const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../supabase/seed.sql');
const content = fs.readFileSync(seedPath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('db0bf0fc-8989-4228-8e5f-e9b0b22a3138')) {
    const trimmed = lines[i].trim();
    const rowStr = trimmed.endsWith(',') ? trimmed.substring(1, trimmed.length - 2) : trimmed.substring(1, trimmed.length - 1);
    const tokens = rowStr.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(t => t.trim());
    
    const cleanToken = (val) => {
      if (!val || val.toUpperCase() === 'NULL') return null;
      let cleaned = val.trim();
      cleaned = cleaned.replace(/::[a-z0-9_]+$/i, '').trim();
      if (cleaned.startsWith("'") && cleaned.endsWith("'")) cleaned = cleaned.slice(1, -1);
      cleaned = cleaned.replace(/''/g, "'");
      return cleaned;
    };
    
    console.log("Token 20 raw:", tokens[20]);
    console.log("Token 20 cleaned:", cleanToken(tokens[20]));
    console.log("Token 20 parsed:", parseFloat(cleanToken(tokens[20])));
  }
}
