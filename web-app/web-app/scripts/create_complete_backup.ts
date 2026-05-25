import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log(`=== STARTING UNIVERSAL BACKUP PROCESS (${timestamp}) ===`);
  
  // 1. Run database SQL backup
  console.log('Running database SQL backup...');
  execSync('npx tsx scripts/backup_db_sql_today.ts', { stdio: 'inherit' });
  
  // 2. Run database JSON backup
  console.log('Running database JSON backup...');
  execSync('node scripts/db_backup.js', { stdio: 'inherit' });

  // 3. Create a consolidated backup staging area
  const stagingDir = path.join(process.cwd(), 'supabase', 'backups', `complete_backup_${dateStr}`);
  const envStaging = path.join(stagingDir, 'env_files');
  
  if (!fs.existsSync(envStaging)) {
    fs.mkdirSync(envStaging, { recursive: true });
  }
  
  // Locate and copy env files
  const envLocations = [
    { src: '../web-app/.env', destName: 'web-app.env' },
    { src: '../web-app/.env.local', destName: 'web-app.env.local' },
    { src: '../web-app/.env.production', destName: 'web-app.env.production' },
    { src: '../admin-app/.env', destName: 'admin-app.env' },
    { src: '../mobile-app/.env', destName: 'mobile-app.env' }
  ];
  
  console.log('Backing up environment files...');
  for (const env of envLocations) {
    const srcPath = path.resolve(process.cwd(), env.src);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(envStaging, env.destName);
      fs.copyFileSync(srcPath, destPath);
      console.log(`   Copied ${path.basename(srcPath)} -> env_files/${env.destName}`);
    }
  }

  // 4. Git Branch operations
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const backupBranch = `backup/2026-05-20_complete`;
  
  console.log(`Creating local backup branch: ${backupBranch} from ${currentBranch}...`);
  
  try {
    // Check if backup branch already exists, delete it locally if so to recreate fresh
    try {
      execSync(`git branch -D ${backupBranch}`, { stdio: 'ignore' });
    } catch (e) {}
    
    execSync(`git checkout -b ${backupBranch}`);
    
    // Force stage stagingDir and all files in it (including envs and backups)
    console.log('Staging backup directory and files...');
    execSync(`git add -f "${stagingDir}"`);
    
    // Stage any other changes if any
    execSync('git add -u');
    
    console.log('Committing changes to backup branch...');
    execSync(`git commit -m "backup: complete database and configuration snapshot - ${dateStr}"`, { stdio: 'inherit' });
    
    // Push the backup branch to origin
    console.log(`Pushing backup branch ${backupBranch} to origin...`);
    execSync(`git push -f origin ${backupBranch}`, { stdio: 'inherit' });
    
    // Push all other branches to origin
    console.log('Pushing all local branches to origin...');
    execSync('git push origin --all', { stdio: 'inherit' });
    
  } catch (err: any) {
    console.error('❌ Error during Git operations:', err.message || err);
  } finally {
    // Return to main branch
    console.log(`Returning to original branch: ${currentBranch}...`);
    execSync(`git checkout ${currentBranch}`);
  }
  
  console.log('🎉 Universal Backup Completed Successfully!');
}

main().catch(console.error);
