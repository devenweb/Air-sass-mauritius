import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set to false to actually apply the changes to the database
const DRY_RUN = true;

interface Service {
  id: string;
  name: string;
  description?: string;
  service_type?: string;
  [key: string]: any;
}

interface RoomType {
  id: string;
  service_id: string;
  name: string;
  [key: string]: any;
}

interface ServicePricing {
  id: string;
  service_id: string;
  variant_id?: string;
  label: string;
  date_from: string;
  date_to: string;
  price: number;
  price_child?: number;
  price_teen?: number;
  price_infant?: number;
  currency?: string;
  price_type?: string;
  occupancy_pricing?: any;
  meal_plan_id?: string;
  [key: string]: any;
}

interface ServiceCategory {
  id: string;
  service_id: string;
  category_id: string;
}

interface BackupSource {
  name: string;      // E.g., "Backup branch: backup/2026-05-18_1854"
  dateLabel: string; // E.g., "May 18"
  timestamp: Date;
  services: Service[];
  roomTypes: RoomType[];
  pricing: ServicePricing[];
  serviceCategories: ServiceCategory[];
}

/**
 * Format date for friendly suffix
 */
function getFriendlyDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Fetch all records from active DB with pagination
 */
async function fetchAllFromTable(tableName: string): Promise<any[]> {
  console.log(`Fetching active data for "${tableName}"...`);
  const allRecords: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + step - 1);
      
    if (error) {
      console.error(`Error fetching table ${tableName}:`, error);
      throw error;
    }
    
    if (!data || data.length === 0) break;
    allRecords.push(...data);
    
    if (data.length < step) break;
    from += step;
  }
  
  console.log(`  Fetched ${allRecords.length} records from active DB table "${tableName}"`);
  return allRecords;
}

/**
 * Get branches containing backup keyword
 */
function getBackupBranches(): Array<{ name: string; commitDate: string; timestamp: Date }> {
  try {
    const branchesOutput = execSync('git branch -a', { encoding: 'utf8' });
    const lines = branchesOutput.split('\n').map(b => b.replace('*', '').trim()).filter(b => b.length > 0 && !b.includes('->'));
    const backupBranches = lines.filter(b => b.toLowerCase().includes('backup'));
    
    const branchesInfo = [];
    for (const b of backupBranches) {
      try {
        const commitDateStr = execSync(`git log -1 --format="%ci" "${b}"`, { encoding: 'utf8' }).trim();
        const timestamp = new Date(commitDateStr);
        branchesInfo.push({
          name: b,
          commitDate: commitDateStr,
          timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp
        });
      } catch (e) {
        branchesInfo.push({
          name: b,
          commitDate: new Date().toISOString(),
          timestamp: new Date()
        });
      }
    }
    
    return branchesInfo.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (err) {
    console.error('Error getting git branches:', err);
    return [];
  }
}

/**
 * Safely parse SQL value
 */
function parseSqlValue(valStr: string): any {
  let clean = valStr.trim();
  if (clean.toUpperCase() === 'NULL' || clean === '') return null;
  
  if (clean.toUpperCase().startsWith('ARRAY[') && clean.endsWith(']')) {
    const arrayContent = clean.substring(6, clean.length - 1).trim();
    if (!arrayContent) return [];
    
    const items: any[] = [];
    let currentItem = '';
    let inString = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      if (char === "'") {
        inString = !inString;
        currentItem += char;
      } else if (char === ',' && !inString) {
        items.push(parseSqlValue(currentItem));
        currentItem = '';
      } else {
        currentItem += char;
      }
    }
    if (currentItem.trim()) {
      items.push(parseSqlValue(currentItem));
    }
    return items;
  }

  let isJsonb = false;
  if (clean.endsWith('::jsonb')) {
    clean = clean.substring(0, clean.length - 7).trim();
    isJsonb = true;
  }
  
  if (clean.toLowerCase() === 'true') return true;
  if (clean.toLowerCase() === 'false') return false;
  
  if (clean.startsWith("'") && clean.endsWith("'")) {
    let inner = clean.slice(1, -1);
    inner = inner.replace(/''/g, "'");
    
    if (inner.startsWith('{') && inner.endsWith('}')) {
      const content = inner.slice(1, -1).trim();
      if (!content) return [];
      
      const items: string[] = [];
      let currentItem = '';
      let inQuote = false;
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          items.push(currentItem.trim());
          currentItem = '';
        } else {
          currentItem += char;
        }
      }
      items.push(currentItem.trim());
      return items;
    }
    
    if (isJsonb || (inner.startsWith('[') && inner.endsWith(']'))) {
      try {
        return JSON.parse(inner);
      } catch (e) {
        return inner;
      }
    }
    return inner;
  }
  
  const num = Number(clean);
  if (!isNaN(num)) return num;
  
  return clean;
}

/**
 * Parses block of values from SQL INSERT statement
 */
function parseValuesBlock(columns: string[], blockStr: string): any[] {
  const records: any[] = [];
  let i = 0;
  
  while (i < blockStr.length) {
    while (i < blockStr.length && blockStr[i] !== '(') i++;
    if (i >= blockStr.length) break;
    i++; // move past '('
    
    const rowValues: any[] = [];
    let currentVal = '';
    let inString = false;
    let escape = false;
    let bracketDepth = 0;
    let parenDepth = 0;
    
    while (i < blockStr.length) {
      const char = blockStr[i];
      if (escape) {
        currentVal += char;
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '\'') {
        inString = !inString;
        currentVal += char;
      } else if (char === '[' && !inString) {
        bracketDepth++;
        currentVal += char;
      } else if (char === ']' && !inString) {
        bracketDepth--;
        currentVal += char;
      } else if (char === '(' && !inString) {
        parenDepth++;
        currentVal += char;
      } else if (char === ')' && !inString && parenDepth > 0) {
        parenDepth--;
        currentVal += char;
      } else if (char === ',' && !inString && bracketDepth === 0 && parenDepth === 0) {
        rowValues.push(parseSqlValue(currentVal));
        currentVal = '';
      } else if (char === ')' && !inString && bracketDepth === 0 && parenDepth === 0) {
        rowValues.push(parseSqlValue(currentVal));
        currentVal = '';
        i++;
        break;
      } else {
        currentVal += char;
      }
      i++;
    }
    
    if (rowValues.length >= Math.min(columns.length, 2)) {
      const record: any = {};
      columns.forEach((col, idx) => {
        record[col] = rowValues[idx];
      });
      records.push(record);
    }
  }
  
  return records;
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (escape) {
      current += char;
      escape = false;
    } else if (char === '\\') {
      current += char;
      escape = true;
    } else if (char === '\'') {
      inString = !inString;
      current += char;
    } else if (char === ';' && !inString) {
      statements.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    statements.push(current);
  }
  return statements;
}

/**
 * Extract records for critical tables from SQL content
 */
function parseSqlSeed(sqlContent: string): {
  services: Service[];
  roomTypes: RoomType[];
  pricing: ServicePricing[];
  serviceCategories: ServiceCategory[];
} {
  // Strip comments from SQL content to prevent parser getting confused by parentheses inside comments
  const cleanSql = sqlContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => {
      const commentIndex = line.indexOf('--');
      if (commentIndex !== -1) {
        let inQuote = false;
        for (let j = 0; j < commentIndex; j++) {
          if (line[j] === "'") inQuote = !inQuote;
        }
        if (!inQuote) {
          return line.substring(0, commentIndex);
        }
      }
      return line;
    })
    .join('\n');

  const result = {
    services: [] as Service[],
    roomTypes: [] as RoomType[],
    pricing: [] as ServicePricing[],
    serviceCategories: [] as ServiceCategory[]
  };

  const tableMap = {
    'services': 'services',
    'room_types': 'roomTypes',
    'service_pricing': 'pricing',
    'service_categories': 'serviceCategories'
  } as const;

  const statements = splitSqlStatements(cleanSql);
  const regex = /INSERT\s+INTO\s+public\.(\w+)\s*\(([\w\s,`"'\.]+?)\)\s*VALUES/i;

  for (const stmt of statements) {
    const match = regex.exec(stmt);
    if (!match) continue;

    const tableName = match[1].toLowerCase();
    if (!(tableName in tableMap)) continue;

    const columns = match[2].split(',').map(c => c.trim().replace(/["'`]/g, ''));
    const targetKey = tableMap[tableName as keyof typeof tableMap];

    const valuesBlock = stmt.substring(match.index + match[0].length);
    const records = parseValuesBlock(columns, valuesBlock);

    result[targetKey].push(...(records as any));
  }

  return result;
}

/**
 * Safely parse JSON or return null
 */
function safeParseJson(content: string): any {
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Load backup source from JSON string or file structure
 */
function loadBackupData(sourceName: string, dateLabel: string, timestamp: Date, rawContent: string): BackupSource | null {
  const parsed = safeParseJson(rawContent);
  if (!parsed) return null;
  
  const data = parsed.data || parsed;
  
  const services = Array.isArray(data.services) ? data.services : [];
  const roomTypes = Array.isArray(data.room_types) ? data.room_types : [];
  const pricing = Array.isArray(data.service_pricing) ? data.service_pricing : [];
  const serviceCategories = Array.isArray(data.service_categories) ? data.service_categories : [];
  
  if (services.length === 0 && pricing.length === 0) return null;
  
  return {
    name: sourceName,
    dateLabel,
    timestamp,
    services,
    roomTypes,
    pricing,
    serviceCategories
  };
}

/**
 * Retrieve file content from a git branch file path
 */
function getFileFromGit(branch: string, filePath: string): string | null {
  try {
    return execSync(`git show "${branch}:${filePath}"`, { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== Database Reconciler - May 2026 ===');
  console.log(`DRY_RUN mode: ${DRY_RUN ? 'ON (Simulating only, no db changes)' : 'OFF (Will perform updates!)'}`);
  console.log('Connecting to database...');
  
  // 1. Fetch active data from current Supabase DB
  const activeServices = await fetchAllFromTable('services');
  const activeRoomTypes = await fetchAllFromTable('room_types');
  const activePricing = await fetchAllFromTable('service_pricing');
  const activeServiceCategories = await fetchAllFromTable('service_categories');
  
  // Cache active room type names by service ID
  const activeRoomsByService = new Map<string, RoomType[]>();
  activeRoomTypes.forEach(rt => {
    if (!activeRoomsByService.has(rt.service_id)) {
      activeRoomsByService.set(rt.service_id, []);
    }
    activeRoomsByService.get(rt.service_id)!.push(rt);
  });

  // Cache active pricing by service ID
  const activePricingByService = new Map<string, ServicePricing[]>();
  activePricing.forEach(ap => {
    if (!activePricingByService.has(ap.service_id)) {
      activePricingByService.set(ap.service_id, []);
    }
    activePricingByService.get(ap.service_id)!.push(ap);
  });

  // Cache category maps
  const activeServiceCategoriesMap = new Map<string, string[]>();
  activeServiceCategories.forEach(sc => {
    if (!activeServiceCategoriesMap.has(sc.service_id)) {
      activeServiceCategoriesMap.set(sc.service_id, []);
    }
    activeServiceCategoriesMap.get(sc.service_id)!.push(sc.category_id);
  });

  // 2. Scan and load all backups
  const backupSources: BackupSource[] = [];
  
  // A. Local Full Backups and seed files
  const searchDirs = [
    { dir: path.resolve('../admin-app/supabase'), sourcePrefix: 'Admin Supabase' },
    { dir: path.resolve('supabase'), sourcePrefix: 'Web Supabase' },
    { dir: path.resolve('../../supabase'), sourcePrefix: 'Workspace Root Supabase' }
  ];

  function scanDirRecursively(currentDir: string, prefix: string) {
    if (!fs.existsSync(currentDir)) return;
    
    // Check if this directory itself has a data/services.json and data/service_pricing.json
    const dataDir = path.join(currentDir, 'data');
    if (fs.existsSync(dataDir)) {
      const servicesFile = path.join(dataDir, 'services.json');
      const pricingFile = path.join(dataDir, 'service_pricing.json');
      const roomTypesFile = path.join(dataDir, 'room_types.json');
      const categoriesFile = path.join(dataDir, 'service_categories.json');
      
      if (fs.existsSync(servicesFile) && fs.existsSync(pricingFile)) {
        const stats = fs.statSync(currentDir);
        const folderName = path.basename(currentDir);
        console.log(`Loading local backup directory: ${prefix} -> ${folderName}...`);
        const services = safeParseJson(fs.readFileSync(servicesFile, 'utf8')) || [];
        const pricing = safeParseJson(fs.readFileSync(pricingFile, 'utf8')) || [];
        const roomTypes = fs.existsSync(roomTypesFile) ? (safeParseJson(fs.readFileSync(roomTypesFile, 'utf8')) || []) : [];
        const serviceCategories = fs.existsSync(categoriesFile) ? (safeParseJson(fs.readFileSync(categoriesFile, 'utf8')) || []) : [];
        
        let dateStr = stats.mtime.toISOString();
        const folderDateMatch = folderName.match(/(\d{4}-\d{2}-\d{2})/);
        if (folderDateMatch) dateStr = folderDateMatch[1];
        const dateLabel = getFriendlyDateLabel(dateStr);
        
        backupSources.push({
          name: `${prefix} Folder: ${folderName}`,
          dateLabel,
          timestamp: stats.mtime,
          services,
          roomTypes,
          pricing,
          serviceCategories
        });
        console.log(`  -> Successfully parsed Folder backup: ${services.length} services, ${pricing.length} pricing records.`);
      }
    }

    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      // Skip node_modules, .git, and .next
      if (item === 'node_modules' || item === '.git' || item === '.next' || item === 'dist') continue;
      
      const fullPath = path.join(currentDir, item);
      if (!fs.existsSync(fullPath)) continue;
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        scanDirRecursively(fullPath, prefix);
      } else {
        const lowerName = item.toLowerCase();
        if (item.endsWith('.sql') && lowerName.includes('seed')) {
          console.log(`Loading local SQL seed backup: ${prefix} -> ${item}...`);
          const content = fs.readFileSync(fullPath, 'utf8');
          const headerMatch = content.match(/Generated:\s*([^\n\r]+)/);
          const timestamp = headerMatch ? new Date(headerMatch[1]) : stats.mtime;
          const dateLabel = getFriendlyDateLabel(timestamp.toISOString());
          
          const parsed = parseSqlSeed(content);
          if (parsed.services.length > 0) {
            backupSources.push({
              name: `${prefix} SQL: ${item}`,
              dateLabel,
              timestamp,
              ...parsed
            });
            console.log(`  -> Successfully parsed SQL seed: ${parsed.services.length} services, ${parsed.pricing.length} pricing records.`);
          }
        } else if (item.endsWith('.json') && (lowerName.includes('seed') || lowerName.startsWith('tl_full_backup_') || lowerName.startsWith('tl_seed_backup_'))) {
          console.log(`Loading local JSON backup/seed: ${prefix} -> ${item}...`);
          const content = fs.readFileSync(fullPath, 'utf8');
          
          let dateStr = stats.mtime.toISOString();
          const dateMatch = item.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) dateStr = dateMatch[1];
          const dateLabel = getFriendlyDateLabel(dateStr);
          
          const source = loadBackupData(`${prefix} JSON: ${item}`, dateLabel, stats.mtime, content);
          if (source) {
            backupSources.push(source);
            console.log(`  -> Successfully parsed JSON backup/seed: ${source.services.length} services, ${source.pricing.length} pricing records.`);
          }
        }
      }
    }
  }

  for (const { dir, sourcePrefix } of searchDirs) {
    if (fs.existsSync(dir)) {
      console.log(`Scanning local directory recursively: ${dir}...`);
      scanDirRecursively(dir, sourcePrefix);
    }
  }


  // B. Git Branches containing "backup"
  const branches = getBackupBranches();
  console.log(`Scanning ${branches.length} backup branches in Git...`);
  
  for (const branch of branches) {
    const cleanBranchName = branch.name.replace('remotes/origin/', '');
    console.log(`Checking branch: "${branch.name}" (Date: ${branch.commitDate})`);
    
    const sqlPaths = [
      'apps/admin-app/supabase/backups/seed.sql',
      'apps/admin-app/supabase/seed.sql',
      'supabase/backups/seed.sql',
      'supabase/seed.sql'
    ];
    
    let foundInBranch = false;
    for (const sp of sqlPaths) {
      const content = getFileFromGit(branch.name, sp);
      if (content) {
        const parsed = parseSqlSeed(content);
        if (parsed.services.length > 0) {
          const dateLabel = getFriendlyDateLabel(branch.commitDate);
          backupSources.push({
            name: `Git Branch: ${cleanBranchName} (SQL)`,
            dateLabel,
            timestamp: branch.timestamp,
            ...parsed
          });
          foundInBranch = true;
          console.log(`  -> Successfully parsed SQL seed from branch path "${sp}": ${parsed.services.length} services, ${parsed.pricing.length} pricing records.`);
          break;
        }
      }
    }
    
    if (foundInBranch) continue;
    
    const pathsToCheck = [
      'apps/web-app/supabase/backups',
      'apps/admin-app/supabase/backups',
      'supabase/backups'
    ];
    
    for (const p of pathsToCheck) {
      try {
        const treeOutput = execSync(`git ls-tree -r --name-only "${branch.name}" -- "${p}"`, { encoding: 'utf8' });
        const files = treeOutput.split('\n').filter(f => f.trim().endsWith('.json'));
        
        const fullBackupFile = files.find(f => f.includes('TL_FULL_BACKUP_'));
        if (fullBackupFile) {
          const content = getFileFromGit(branch.name, fullBackupFile);
          if (content) {
            const dateMatch = fullBackupFile.match(/TL_FULL_BACKUP_(\d{4}-\d{2}-\d{2})/);
            const dateStr = dateMatch ? dateMatch[1] : branch.commitDate;
            const dateLabel = getFriendlyDateLabel(dateStr);
            const source = loadBackupData(`Git Branch: ${cleanBranchName} (JSON)`, dateLabel, branch.timestamp, content);
            if (source) {
              backupSources.push(source);
              foundInBranch = true;
              console.log(`  -> Successfully loaded full JSON from branch: ${fullBackupFile}`);
              break;
            }
          }
        }
        
        const servicesFile = files.find(f => f.endsWith('services.json'));
        const pricingFile = files.find(f => f.endsWith('service_pricing.json'));
        const roomTypesFile = files.find(f => f.endsWith('room_types.json'));
        const categoriesFile = files.find(f => f.endsWith('service_categories.json'));
        
        if (servicesFile && pricingFile) {
          const sContent = getFileFromGit(branch.name, servicesFile);
          const pContent = getFileFromGit(branch.name, pricingFile);
          const rtContent = roomTypesFile ? getFileFromGit(branch.name, roomTypesFile) : null;
          const scContent = categoriesFile ? getFileFromGit(branch.name, categoriesFile) : null;
          
          if (sContent && pContent) {
            const services = safeParseJson(sContent) || [];
            const pricing = safeParseJson(pContent) || [];
            const roomTypes = rtContent ? (safeParseJson(rtContent) || []) : [];
            const serviceCategories = scContent ? (safeParseJson(scContent) || []) : [];
            
            const dateLabel = getFriendlyDateLabel(branch.commitDate);
            backupSources.push({
              name: `Git Branch: ${cleanBranchName} (Folder JSON)`,
              dateLabel,
              timestamp: branch.timestamp,
              services,
              roomTypes,
              pricing,
              serviceCategories
            });
            foundInBranch = true;
            console.log(`  -> Successfully parsed Folder JSONs from branch: ${servicesFile}`);
            break;
          }
        }
      } catch (e) {
        // ignore folder not found errors
      }
    }
  }

  console.log(`\nLoaded ${backupSources.length} total backup sources.`);
  if (backupSources.length === 0) {
    console.error('No backup sources found! Exiting.');
    return;
  }

  // 3. Process backup sources to identify missing services and pricing mismatches
  const serviceVersionsMap = new Map<string, Array<{ source: BackupSource; service: Service; rooms: RoomType[]; pricing: ServicePricing[]; categories: string[] }>>();

  for (const source of backupSources) {
    const roomsByService = new Map<string, RoomType[]>();
    source.roomTypes.forEach(rt => {
      if (!roomsByService.has(rt.service_id)) {
        roomsByService.set(rt.service_id, []);
      }
      roomsByService.get(rt.service_id)!.push(rt);
    });

    const pricingByService = new Map<string, ServicePricing[]>();
    source.pricing.forEach(p => {
      if (!pricingByService.has(p.service_id)) {
        pricingByService.set(p.service_id, []);
      }
      pricingByService.get(p.service_id)!.push(p);
    });

    const catsByService = new Map<string, string[]>();
    source.serviceCategories.forEach(sc => {
      if (!catsByService.has(sc.service_id)) {
        catsByService.set(sc.service_id, []);
      }
      catsByService.get(sc.service_id)!.push(sc.category_id);
    });

    for (const service of source.services) {
      if (!service.name) continue;
      const normalizedName = service.name.trim();
      
      const rooms = roomsByService.get(service.id) || [];
      const pricing = pricingByService.get(service.id) || [];
      const categories = catsByService.get(service.id) || [];
      
      if (!serviceVersionsMap.has(normalizedName)) {
        serviceVersionsMap.set(normalizedName, []);
      }
      
      serviceVersionsMap.get(normalizedName)!.push({
        source,
        service,
        rooms,
        pricing,
        categories
      });
    }
  }

  const servicesToInsert: Array<{
    name: string;
    originalId: string;
    serviceData: Service;
    roomsToInsert: RoomType[];
    pricingToInsert: ServicePricing[];
    categoriesToInsert: string[];
    reason: string;
    backupSource: string;
  }> = [];

  console.log('\n--- Analyzing and Comparing with Active Database ---');

  for (const [serviceName, versions] of serviceVersionsMap.entries()) {
    // Sort versions: newest first
    versions.sort((a, b) => b.source.timestamp.getTime() - a.source.timestamp.getTime());

    const activeMatches = activeServices.filter(as => as.name && as.name.trim().toLowerCase() === serviceName.toLowerCase());
    
    if (activeMatches.length === 0) {
      const newestVersion = versions[0];
      
      if (newestVersion.pricing.length === 0 && newestVersion.rooms.length === 0 && newestVersion.service.service_type === 'hotel') {
        console.log(`ℹ️ Skipping completely empty missing service: "${serviceName}"`);
        continue;
      }

      servicesToInsert.push({
        name: serviceName,
        originalId: newestVersion.service.id,
        serviceData: newestVersion.service,
        roomsToInsert: newestVersion.rooms,
        pricingToInsert: newestVersion.pricing,
        categoriesToInsert: newestVersion.categories,
        reason: 'Completely Missing',
        backupSource: newestVersion.source.name
      });
      console.log(`❌ Missing Service Detected: "${serviceName}" (will restore original from ${newestVersion.source.name}, pricing count: ${newestVersion.pricing.length})`);
    } else {
      const mainActiveService = activeMatches[0];
      const activeRooms = activeRoomsByService.get(mainActiveService.id) || [];
      const activePrices = activePricingByService.get(mainActiveService.id) || [];

      const uniqueBackupPricingStructures: typeof versions = [];

      for (const ver of versions) {
        // Safety: Skip comparing pricing if backup has 0 pricing overrides
        // but active has pricing overrides (to avoid false-positive duplication).
        if (ver.pricing.length === 0 && activePrices.length > 0) {
          continue;
        }

        // Safety: Skip comparing pricing if backup source is truncated.
        // Truncated backups (capped at 1000 records total) cause false-positive mismatches.
        if (ver.source.pricing.length < 5000) {
          continue;
        }

        const isPricingSame = comparePricingGrids(
          activeRooms, 
          activePrices, 
          ver.rooms, 
          ver.pricing
        );

        if (!isPricingSame) {
          let isSameAsOtherBackup = false;
          for (const uniqueVer of uniqueBackupPricingStructures) {
            if (comparePricingGrids(uniqueVer.rooms, uniqueVer.pricing, ver.rooms, ver.pricing)) {
              isSameAsOtherBackup = true;
              break;
            }
          }
          if (!isSameAsOtherBackup) {
            uniqueBackupPricingStructures.push(ver);
          }
        }
      }

      for (const uniqueVer of uniqueBackupPricingStructures) {
        const sourceLabel = uniqueVer.source.dateLabel;
        const duplicateName = `${serviceName} (From Backup: ${sourceLabel})`;

        if (servicesToInsert.some(s => s.name === duplicateName)) continue;
        
        const duplicateExists = activeServices.some(as => as.name && as.name.trim().toLowerCase() === duplicateName.toLowerCase());
        if (duplicateExists) {
          continue;
        }

        servicesToInsert.push({
          name: duplicateName,
          originalId: uniqueVer.service.id,
          serviceData: {
            ...uniqueVer.service,
            name: duplicateName,
            description: uniqueVer.service.description 
              ? `${uniqueVer.service.description} (Imported from backup variant: ${uniqueVer.source.name})`
              : `(Imported from backup variant: ${uniqueVer.source.name})`
          },
          roomsToInsert: uniqueVer.rooms,
          pricingToInsert: uniqueVer.pricing,
          categoriesToInsert: uniqueVer.categories,
          reason: `Pricing Mismatch (Backup: ${uniqueVer.pricing.length} overrides, Active: ${activePrices.length} overrides)`,
          backupSource: uniqueVer.source.name
        });
        console.log(`⚠️  Pricing Mismatch for "${serviceName}": Backup has different pricing. Will duplicate as "${duplicateName}"`);
      }
    }
  }

  // 4. Summarize Reconciliation Plan
  console.log('\n==================================================');
  console.log('RECONCILIATION SUMMARY PLAN');
  console.log('==================================================');
  console.log(`Total items to insert/duplicate: ${servicesToInsert.length}`);
  
  const missing = servicesToInsert.filter(s => s.reason === 'Completely Missing');
  const mismatches = servicesToInsert.filter(s => s.reason.startsWith('Pricing Mismatch'));

  console.log(`\nCompletely Missing Services to Restore (${missing.length}):`);
  missing.forEach(m => {
    console.log(` - "${m.name}" (from ${m.backupSource}) | Rooms: ${m.roomsToInsert.length}, Price Records: ${m.pricingToInsert.length}`);
  });

  console.log(`\nPricing Mismatch Services to Duplicate (${mismatches.length}):`);
  mismatches.forEach(m => {
    console.log(` - "${m.name}" (from ${m.backupSource}) | Reason: ${m.reason} | Rooms: ${m.roomsToInsert.length}, Price Records: ${m.pricingToInsert.length}`);
  });
  console.log('==================================================\n');

  if (servicesToInsert.length === 0) {
    console.log('No modifications needed! Database is fully up-to-date with all backups.');
    return;
  }

  if (DRY_RUN) {
    console.log('This is a DRY RUN. No changes were written to the database.');
    console.log('To apply these changes, please change the DRY_RUN constant at the top of the file to false and re-run.');
    return;
  }

  // 5. Execute Insertions (only when DRY_RUN is false)
  console.log('Starting DB Reconciliation inserts...');
  let successCount = 0;
  
  for (const item of servicesToInsert) {
    console.log(`\nInserting service: "${item.name}"...`);
    
    const servicePayload = { ...item.serviceData };
    delete servicePayload.id;
    delete servicePayload.created_at;
    delete servicePayload.updated_at;
    
    const serviceColumns = [
      'name', 'description', 'location', 'region', 'rating', 'image_url', 
      'amenities', 'service_type', 'duration_days', 'duration_hours', 'max_group_size',
      'itinerary', 'stock', 'status', 'cta_text', 'cta_link', 'gallery_images',
      'meta_title', 'meta_description', 'seo_keywords', 'special_features', 
      'seasonality', 'highlights', 'included', 'not_included', 'cancellation_policy',
      'terms_and_conditions', 'thumbnail_url', 'banner_url', 'featured', 'priority',
      'secondary_image_url', 'is_seasonal_deal', 'deal_note', 'is_active',
      'is_coming_soon', 'short_description', 'max_adults', 'max_children',
      'child_age_limit', 'meal_plans', 'activity_type', 'service_fee', 'badge_text'
    ];
    
    const sanitizedService: any = {};
    serviceColumns.forEach(col => {
      if (servicePayload[col] !== undefined) {
        sanitizedService[col] = servicePayload[col];
      }
    });

    const { data: newService, error: serviceError } = await supabase
      .from('services')
      .insert([sanitizedService])
      .select()
      .single();

    if (serviceError) {
      console.error(`  ❌ Error inserting service "${item.name}":`, serviceError.message);
      continue;
    }
    
    const newServiceId = newService.id;
    console.log(`  ✅ Inserted service: "${item.name}" -> New ID: ${newServiceId}`);

    // B. Insert room types and keep track of mapped IDs
    const roomIdMap = new Map<string, string>();
    const roomTypeColumns = [
      'name', 'amenities', 'max_occupancy', 'min_stay_days', 'max_infants',
      'max_children', 'max_teens', 'max_adults', 'image_url', 'images',
      'meal_plan', 'description', 'service_fee'
    ];

    for (const rt of item.roomsToInsert) {
      const roomPayload: any = { service_id: newServiceId };
      roomTypeColumns.forEach(col => {
        if (rt[col] !== undefined) {
          roomPayload[col] = rt[col];
        }
      });

      const { data: newRoom, error: roomError } = await supabase
        .from('room_types')
        .insert([roomPayload])
        .select()
        .single();

      if (roomError) {
        console.error(`    ❌ Error inserting room type "${rt.name}":`, roomError.message);
      } else {
        roomIdMap.set(rt.id, newRoom.id);
        console.log(`    ✅ Inserted room type: "${rt.name}" -> New ID: ${newRoom.id}`);
      }
    }

    // C. Insert pricing records linked to the new service and room types
    const pricingColumns = [
      'label', 'date_from', 'date_to', 'price', 'currency', 'price_type', 'notes',
      'price_infant', 'price_child', 'price_teen', 'units_available', 'is_stop_sell',
      'occupancy_pricing', 'meal_plan_id', 'service_fee', 'net_price', 'net_price_teen',
      'net_price_child', 'net_price_infant', 'net_occupancy_pricing', 'capacity',
      'duration', 'duration_type'
    ];

    const pricingPayloads = item.pricingToInsert.map(p => {
      const pPayload: any = { service_id: newServiceId };
      pricingColumns.forEach(col => {
        if (p[col] !== undefined) {
          pPayload[col] = p[col];
        }
      });
      if (p.variant_id && roomIdMap.has(p.variant_id)) {
        pPayload.variant_id = roomIdMap.get(p.variant_id);
      } else {
        pPayload.variant_id = null;
      }

      // Sanitize occupancy_pricing and net_occupancy_pricing to prevent jsonb_each errors
      const jsonbCols = ['occupancy_pricing', 'net_occupancy_pricing'];
      jsonbCols.forEach(col => {
        if (pPayload[col] !== undefined) {
          const val = pPayload[col];
          if (Array.isArray(val) && val.length === 0) {
            pPayload[col] = null;
          } else if (typeof val === 'string' && (val === '[]' || val === '{}' || val === '')) {
            pPayload[col] = null;
          }
        }
      });

      return pPayload;
    });

    if (pricingPayloads.length > 0) {
      const chunkSize = 200;
      let pricingSuccessCount = 0;
      for (let i = 0; i < pricingPayloads.length; i += chunkSize) {
        const chunk = pricingPayloads.slice(i, i + chunkSize);
        const { error: pricingError } = await supabase
          .from('service_pricing')
          .insert(chunk);
          
        if (pricingError) {
          console.error(`    ❌ Error inserting pricing chunk (index ${i}):`, pricingError.message);
        } else {
          pricingSuccessCount += chunk.length;
        }
      }
      console.log(`    ✅ Inserted ${pricingSuccessCount}/${pricingPayloads.length} pricing records.`);
    }

    // D. Insert service category associations
    if (item.categoriesToInsert.length > 0) {
      const categoryPayloads = item.categoriesToInsert.map(catId => ({
        service_id: newServiceId,
        category_id: catId
      }));

      const { error: catError } = await supabase
        .from('service_categories')
        .insert(categoryPayloads);

      if (catError) {
        console.error(`    ❌ Error inserting categories links:`, catError.message);
      } else {
        console.log(`    ✅ Linked service to ${item.categoriesToInsert.length} categories.`);
      }
    }

    successCount++;
  }

  console.log(`\n🎉 DB Reconciled successfully! Restored/duplicated ${successCount}/${servicesToInsert.length} services.`);
}

/**
 * Compare two pricing grids to determine if they are identical
 */
function comparePricingGrids(
  activeRooms: RoomType[], 
  activePrices: ServicePricing[], 
  backupRooms: RoomType[], 
  backupPrices: ServicePricing[]
): boolean {
  if (activePrices.length !== backupPrices.length) return false;
  
  const activeRoomMap = new Map<string, string>();
  activeRooms.forEach(r => activeRoomMap.set(r.id, r.name.trim().toLowerCase()));

  const backupRoomMap = new Map<string, string>();
  backupRooms.forEach(r => backupRoomMap.set(r.id, r.name.trim().toLowerCase()));

  const sortedActive = [...activePrices].sort((a, b) => {
    const keyA = `${a.label}-${a.date_from}-${a.date_to}`;
    const keyB = `${b.label}-${b.date_from}-${b.date_to}`;
    return keyA.localeCompare(keyB);
  });

  const sortedBackup = [...backupPrices].sort((a, b) => {
    const keyA = `${a.label}-${a.date_from}-${a.date_to}`;
    const keyB = `${b.label}-${b.date_from}-${b.date_to}`;
    return keyA.localeCompare(keyB);
  });

  for (let i = 0; i < sortedActive.length; i++) {
    const act = sortedActive[i];
    const bkp = sortedBackup[i];

    if (act.label !== bkp.label) return false;
    if (act.date_from !== bkp.date_from) return false;
    if (act.date_to !== bkp.date_to) return false;
    if (Number(act.price) !== Number(bkp.price)) return false;
    if (Number(act.price_child || 0) !== Number(bkp.price_child || 0)) return false;
    if (Number(act.price_teen || 0) !== Number(bkp.price_teen || 0)) return false;
    if (Number(act.price_infant || 0) !== Number(bkp.price_infant || 0)) return false;
    if (act.currency !== bkp.currency) return false;
    if (act.price_type !== bkp.price_type) return false;
    if (act.meal_plan_id !== bkp.meal_plan_id) return false;

    const activeRoomName = act.variant_id ? activeRoomMap.get(act.variant_id) : null;
    const backupRoomName = bkp.variant_id ? backupRoomMap.get(bkp.variant_id) : null;
    if (activeRoomName !== backupRoomName) return false;
    
    if (JSON.stringify(act.occupancy_pricing) !== JSON.stringify(bkp.occupancy_pricing)) return false;
  }

  return true;
}

main().catch(console.error);
