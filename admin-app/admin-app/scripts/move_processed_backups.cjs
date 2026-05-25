const fs = require('fs');
const path = require('path');

/**
 * Moves all processed backup files to a new folder
 */
function moveProcessedBackups() {
  console.log("Moving all processed backup files to a new folder...\n");
  
  const backupBaseDir = path.join(__dirname, '..', 'supabase', 'backups');
  const processedBackupsDir = path.join(backupBaseDir, 'processed_backups');
  
  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(processedBackupsDir)) {
    fs.mkdirSync(processedBackupsDir, { recursive: true });
    console.log(`✅ Created directory: ${processedBackupsDir}`);
  }
  
  // Track moved files
  const movedFiles = [];
  const skippedFiles = [];
  
  /**
   * Recursively finds all JSON and SQL files in a directory and its subdirectories
   */
  function findBackupFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = findBackupFiles(filePath, arrayOfFiles);
      } else if (path.extname(filePath) === '.json' || path.extname(filePath) === '.sql') {
        // Only include files that appear to be actual backup files, not schema/config files
        const fileName = path.basename(filePath);
        if (
          fileName.includes('BACKUP') || // JSON backup files
          fileName.includes('seed_') ||  // SQL seed files
          fileName.includes('_2026-05-') // Date-named backup directories
        ) {
          arrayOfFiles.push(filePath);
        }
      }
    });

    return arrayOfFiles;
  }
  
  try {
    console.log(`🔍 Searching for backup files in: ${backupBaseDir}`);
    
    const backupFiles = findBackupFiles(backupBaseDir);
    
    console.log(`📁 Found ${backupFiles.length} backup files to move\n`);
    
    for (const file of backupFiles) {
      // Determine the relative path from the base backup directory
      const relativePath = path.relative(backupBaseDir, path.dirname(file));
      const fileName = path.basename(file);
      
      // Create the destination path preserving subdirectory structure
      let destPath;
      if (relativePath && relativePath !== '.') {
        const subDirPath = path.join(processedBackupsDir, relativePath);
        if (!fs.existsSync(subDirPath)) {
          fs.mkdirSync(subDirPath, { recursive: true });
        }
        destPath = path.join(subDirPath, fileName);
      } else {
        destPath = path.join(processedBackupsDir, fileName);
      }
      
      // Move the file
      try {
        fs.renameSync(file, destPath);
        movedFiles.push(`${file} → ${destPath}`);
        console.log(`✅ Moved: ${fileName}`);
      } catch (moveError) {
        skippedFiles.push(`${file} (reason: ${moveError.message})`);
        console.log(`⚠️  Skipped: ${fileName} (reason: ${moveError.message})`);
      }
    }
    
    console.log(`\n✅ Movement completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Moved: ${movedFiles.length} files`);
    console.log(`   Skipped: ${skippedFiles.length} files`);
    console.log(`   Destination: ${processedBackupsDir}`);
    
    if (skippedFiles.length > 0) {
      console.log(`\n📋 Skipped files:`);
      skippedFiles.forEach(file => console.log(`   - ${file}`));
    }
    
  } catch (error) {
    console.log(`❌ Error during file movement:`, error.message);
  }
}

// Run the function
moveProcessedBackups();