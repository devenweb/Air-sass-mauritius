const { execSync } = require('child_process');

const repos = [
  { name: 'admin-app', path: 'c:/Users/deven/Desktop/Travel Lounge 2026/apps/admin-app' },
  { name: 'web-app', path: 'c:/Users/deven/Desktop/Travel Lounge 2026/apps/web-app' }
];

function getBranches(repoPath) {
  const output = execSync('git branch -a', { cwd: repoPath, encoding: 'utf8' });
  return output.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.includes('->'))
    .map(line => line.replace(/^\*\s*/, '').trim());
}

function getFiles(repoPath, branch) {
  try {
    const output = execSync(`git ls-tree -r --name-only "${branch}"`, { cwd: repoPath, maxBuffer: 50 * 1024 * 1024, encoding: 'utf8' });
    return output.split('\n').map(f => f.trim()).filter(f => f && (f.endsWith('.json') || f.endsWith('.sql')));
  } catch (e) {
    return [];
  }
}

function countSqlPricing(text) {
  const lines = text.split('\n');
  let count = 0;
  let insidePricing = false;
  
  for (const line of lines) {
    if (line.includes('INSERT INTO public.service_pricing') || line.includes('INSERT INTO public."service_pricing"')) {
      insidePricing = true;
    } else if (insidePricing) {
      if (line.trim().startsWith('(')) {
        count++;
      }
      if (line.trim().endsWith(';')) {
        insidePricing = false;
      }
    }
  }
  return count;
}

function scanContent(content, fileName, branch, repoName) {
  if (fileName.endsWith('.json')) {
    try {
      const data = JSON.parse(content);
      const getPricingCount = (obj) => {
        if (Array.isArray(obj)) return obj.length;
        if (obj && Array.isArray(obj.service_pricing)) return obj.service_pricing.length;
        if (obj && obj.service_pricing && Array.isArray(obj.service_pricing.data)) return obj.service_pricing.data.length;
        if (obj && obj.data && obj.data.service_pricing && Array.isArray(obj.data.service_pricing)) return obj.data.service_pricing.length;
        return null;
      };
      
      const count = getPricingCount(data);
      if (count !== null) {
        console.log(`[${repoName}] Branch "${branch}" -> JSON File "${fileName}" -> service_pricing count: ${count}`);
      }
    } catch (e) {
      // Fallback to regex/line counting if JSON parsing fails (e.g. big file)
      const matches = content.match(/"service_pricing"\s*:\s*\[/g);
      if (matches) {
        console.log(`[${repoName}] Branch "${branch}" -> JSON File "${fileName}" has service_pricing keys (parsing skipped due to error).`);
      }
    }
  } else if (fileName.endsWith('.sql')) {
    const count = countSqlPricing(content);
    if (count > 0) {
      console.log(`[${repoName}] Branch "${branch}" -> SQL File "${fileName}" -> service_pricing INSERT rows: ${count}`);
    }
  }
}

function main() {
  for (const repo of repos) {
    console.log(`\n========================================`);
    console.log(`Scanning repo: ${repo.name}`);
    console.log(`========================================`);
    
    const branches = [...new Set(getBranches(repo.path))];
    console.log(`Branches found: ${branches.length}`);
    
    for (const branch of branches) {
      const files = getFiles(repo.path, branch);
      const pricingFiles = files.filter(f => 
        f.includes('backup') || 
        f.includes('seed') || 
        f.includes('data') || 
        f.includes('pricing')
      );
      
      for (const file of pricingFiles) {
        try {
          // Only read if it's less than 20MB in size to avoid git show memory crash
          const sizeOut = execSync(`git cat-file -s "${branch}:${file}"`, { cwd: repo.path, encoding: 'utf8' }).trim();
          const size = parseInt(sizeOut, 10);
          if (size > 150 * 1024 * 1024) {
            console.log(`[${repo.name}] Branch "${branch}" -> File "${file}" is too large to scan directly (${(size / 1024 / 1024).toFixed(1)} MB).`);
            continue;
          }
          const content = execSync(`git show "${branch}:${file}"`, { cwd: repo.path, maxBuffer: 150 * 1024 * 1024, encoding: 'utf8' });
          scanContent(content, file, branch, repo.name);
        } catch (e) {
          // ignore error
        }
      }
    }
  }
}

main();
