import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase URL or Service Role Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set DRY_RUN = false to actually apply updates
const DRY_RUN = false;

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
  filePath: string;
  name: string;
  dateLabel: string;
  timestamp: Date;
  services: Service[];
  roomTypes: RoomType[];
  pricing: ServicePricing[];
  serviceCategories: ServiceCategory[];
}

function getFriendlyDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function parsePgArrayString(str: string): string[] | null {
  if (typeof str !== 'string') return null;
  const clean = str.trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    const content = clean.slice(1, -1).trim();
    if (!content) return [];
    
    const items: string[] = [];
    let currentItem = '';
    let inQuote = false;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        items.push(currentItem.trim().replace(/^"|"$/g, ''));
        currentItem = '';
      } else {
        currentItem += char;
      }
    }
    items.push(currentItem.trim().replace(/^"|"$/g, ''));
    return items;
  }
  return null;
}

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

function parseSqlSeed(sqlContent: string): {
  services: Service[];
  roomTypes: RoomType[];
  pricing: ServicePricing[];
  serviceCategories: ServiceCategory[];
} {
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

function safeParseJson(content: string): any {
  try {
    const clean = content.trim();
    const parsed = JSON.parse(clean);
    
    // Check if it has a wrapped result with untrusted boundaries
    if (parsed && typeof parsed.result === 'string') {
      const resStr = parsed.result;
      const boundaryMatch = resStr.match(/<untrusted-data-[a-f0-9-]+>([\s\S]*?)<\/untrusted-data-[a-f0-9-]+>/) 
        || resStr.match(/<untrusted-data-[a-f0-9-]+>\s*([\s\S]*?)$/);
      if (boundaryMatch) {
        try {
          return JSON.parse(boundaryMatch[1].trim());
        } catch (e) {}
      }
      
      const startBracket = resStr.indexOf('[');
      const endBracket = resStr.lastIndexOf(']');
      if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
        try {
          return JSON.parse(resStr.substring(startBracket, endBracket + 1));
        } catch (e) {}
      }
    }
    
    return parsed;
  } catch (e) {
    const str = content.trim();
    const startBracket = str.indexOf('[');
    const endBracket = str.lastIndexOf(']');
    if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
      try {
        return JSON.parse(str.substring(startBracket, endBracket + 1));
      } catch (ex) {}
    }
    return null;
  }
}

function loadBackupData(filePath: string, name: string, dateLabel: string, timestamp: Date, rawContent: string): BackupSource | null {
  const parsed = safeParseJson(rawContent);
  if (!parsed) return null;
  
  let services: Service[] = [];
  let roomTypes: RoomType[] = [];
  let pricing: ServicePricing[] = [];
  let serviceCategories: ServiceCategory[] = [];

  const fileName = path.basename(filePath).toLowerCase();
  const data = parsed.data || parsed;
  
  if (Array.isArray(data)) {
    if (fileName.includes('services')) {
      services = data;
    } else if (fileName.includes('room_type') || fileName.includes('room-type') || fileName.includes('room_types')) {
      roomTypes = data;
    } else if (fileName.includes('pricing') || fileName.includes('price')) {
      pricing = data;
    } else if (fileName.includes('category') || fileName.includes('categories')) {
      serviceCategories = data;
    }
  } else {
    services = Array.isArray(data.services) ? data.services : [];
    roomTypes = Array.isArray(data.room_types) ? data.room_types : [];
    pricing = Array.isArray(data.service_pricing) ? data.service_pricing : [];
    serviceCategories = Array.isArray(data.service_categories) ? data.service_categories : [];
  }
  
  if (services.length === 0 && pricing.length === 0 && roomTypes.length === 0 && serviceCategories.length === 0) {
    return null;
  }
  
  return {
    filePath,
    name,
    dateLabel,
    timestamp,
    services,
    roomTypes,
    pricing,
    serviceCategories
  };
}

function isPricingDifferent(
  activeRooms: RoomType[], 
  activePrices: ServicePricing[], 
  backupRooms: RoomType[], 
  backupPrices: ServicePricing[]
): boolean {
  if (backupPrices.length === 0) return false;

  const activeRoomMap = new Map<string, string>();
  activeRooms.forEach(r => activeRoomMap.set(r.id, r.name.trim().toLowerCase()));

  const backupRoomMap = new Map<string, string>();
  backupRooms.forEach(r => backupRoomMap.set(r.id, r.name.trim().toLowerCase()));

  for (const bkp of backupPrices) {
    const backupRoomName = bkp.variant_id ? backupRoomMap.get(bkp.variant_id) : null;
    
    const match = activePrices.find(act => {
      if (act.label !== bkp.label) return false;
      if (act.date_from !== bkp.date_from) return false;
      if (act.date_to !== bkp.date_to) return false;
      
      const activeRoomName = act.variant_id ? activeRoomMap.get(act.variant_id) : null;
      if (activeRoomName !== backupRoomName) return false;
      
      return true;
    });

    if (match) {
      if (Number(match.price) !== Number(bkp.price)) return true;
      if (Number(match.price_child || 0) !== Number(bkp.price_child || 0)) return true;
      if (Number(match.price_teen || 0) !== Number(bkp.price_teen || 0)) return true;
      if (Number(match.price_infant || 0) !== Number(bkp.price_infant || 0)) return true;
      if (match.currency !== bkp.currency) return true;
      if (match.price_type !== bkp.price_type) return true;
      if (match.meal_plan_id !== bkp.meal_plan_id) return true;
      
      // Compare occupancy pricing structure
      let actOccupancy = match.occupancy_pricing;
      let bkpOccupancy = bkp.occupancy_pricing;
      if (typeof actOccupancy === 'string') {
        try { actOccupancy = JSON.parse(actOccupancy); } catch(e){}
      }
      if (typeof bkpOccupancy === 'string') {
        try { bkpOccupancy = JSON.parse(bkpOccupancy); } catch(e){}
      }
      
      if (JSON.stringify(actOccupancy) !== JSON.stringify(bkpOccupancy)) return true;
    } else {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log('=== Database Reconciler and Cleaning - May 2026 ===');
  console.log(`DRY_RUN mode: ${DRY_RUN ? 'ON (Simulating only)' : 'OFF (Will perform updates!)'}`);
  
  // 1. Fetch active database state
  const activeServices = await fetchAllFromTable('services');
  const activeRoomTypes = await fetchAllFromTable('room_types');
  const activePricing = await fetchAllFromTable('service_pricing');
  
  const activeRoomsByService = new Map<string, RoomType[]>();
  activeRoomTypes.forEach(rt => {
    if (!activeRoomsByService.has(rt.service_id)) {
      activeRoomsByService.set(rt.service_id, []);
    }
    activeRoomsByService.get(rt.service_id)!.push(rt);
  });

  const activePricingByService = new Map<string, ServicePricing[]>();
  activePricing.forEach(ap => {
    if (!activePricingByService.has(ap.service_id)) {
      activePricingByService.set(ap.service_id, []);
    }
    activePricingByService.get(ap.service_id)!.push(ap);
  });

  // 2. Scan folder recursively for SQL, JSON backups, and Folder backups
  const targetDir = path.resolve('./supabase');
  const backupSources: BackupSource[] = [];
  const pathsToDelete: string[] = [];

  console.log(`Scanning directory: ${targetDir}...`);

  function scanDirRecursively(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    
    // Check if this directory contains services.json and service_pricing.json directly or via data/
    let servicesFile = path.join(currentDir, 'services.json');
    let pricingFile = path.join(currentDir, 'service_pricing.json');
    let roomTypesFile = path.join(currentDir, 'room_types.json');
    let categoriesFile = path.join(currentDir, 'service_categories.json');
    let hasFolderBackup = fs.existsSync(servicesFile) && fs.existsSync(pricingFile);
    let isNested = false;

    if (!hasFolderBackup) {
      const dataDir = path.join(currentDir, 'data');
      if (fs.existsSync(dataDir)) {
        servicesFile = path.join(dataDir, 'services.json');
        pricingFile = path.join(dataDir, 'service_pricing.json');
        roomTypesFile = path.join(dataDir, 'room_types.json');
        categoriesFile = path.join(dataDir, 'service_categories.json');
        if (fs.existsSync(servicesFile) && fs.existsSync(pricingFile)) {
          hasFolderBackup = true;
          isNested = true;
        }
      }
    }

    if (hasFolderBackup) {
      const stats = fs.statSync(currentDir);
      const folderName = path.basename(currentDir);
      
      console.log(`Found local Folder backup: ${folderName}`);
      const services = safeParseJson(fs.readFileSync(servicesFile, 'utf8')) || [];
      const pricing = safeParseJson(fs.readFileSync(pricingFile, 'utf8')) || [];
      const roomTypes = fs.existsSync(roomTypesFile) ? (safeParseJson(fs.readFileSync(roomTypesFile, 'utf8')) || []) : [];
      const serviceCategories = fs.existsSync(categoriesFile) ? (safeParseJson(fs.readFileSync(categoriesFile, 'utf8')) || []) : [];
      
      let dateStr = stats.mtime.toISOString();
      const folderDateMatch = folderName.match(/(\d{4}-\d{2}-\d{2})/);
      if (folderDateMatch) dateStr = folderDateMatch[1];
      const dateLabel = getFriendlyDateLabel(dateStr);
      
      backupSources.push({
        filePath: currentDir,
        name: `Folder: ${folderName}`,
        dateLabel,
        timestamp: stats.mtime,
        services,
        roomTypes,
        pricing,
        serviceCategories
      });
      
      // Mark files for deletion (folders under backups should be deleted, but not root files)
      const isRootFolder = currentDir === targetDir || path.dirname(currentDir) === targetDir;
      if (!isRootFolder) {
        if (isNested) {
          const dataDir = path.join(currentDir, 'data');
          pathsToDelete.push(servicesFile, pricingFile);
          if (fs.existsSync(roomTypesFile)) pathsToDelete.push(roomTypesFile);
          if (fs.existsSync(categoriesFile)) pathsToDelete.push(categoriesFile);
          
          const schemaDir = path.join(currentDir, 'schema');
          if (fs.existsSync(schemaDir)) {
            fs.readdirSync(schemaDir).forEach(f => pathsToDelete.push(path.join(schemaDir, f)));
            pathsToDelete.push(schemaDir);
          }
          fs.readdirSync(dataDir).forEach(f => {
            const fullF = path.join(dataDir, f);
            if (!pathsToDelete.includes(fullF)) pathsToDelete.push(fullF);
          });
          pathsToDelete.push(dataDir);
        } else {
          // Delete all files directly inside currentDir
          fs.readdirSync(currentDir).forEach(f => {
            const fullF = path.join(currentDir, f);
            if (fs.statSync(fullF).isFile()) {
              pathsToDelete.push(fullF);
            } else if (fs.statSync(fullF).isDirectory()) {
              fs.readdirSync(fullF).forEach(subF => pathsToDelete.push(path.join(fullF, subF)));
              pathsToDelete.push(fullF);
            }
          });
        }
        pathsToDelete.push(currentDir); // Finally the directory itself
      }
      
      console.log(`  -> Loaded Folder backup: ${services.length} services, ${pricing.length} pricing records.`);
      return; // Don't scan inside this folder
    }

    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      if (!fs.existsSync(fullPath)) continue;
      
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        // Exclude standard folders
        if (item === 'migrations' || item === 'archive' || item === '.temp' || item === '.git' || item === 'node_modules' || item === 'app' || item === 'components' || item === 'lib') {
          continue;
        }
        scanDirRecursively(fullPath);
        // Schedule directory for deletion (it will only be deleted if empty after file deletions)
        const isRoot = fullPath === targetDir || fullPath === path.join(targetDir, 'backups');
        if (!isRoot) {
          pathsToDelete.push(fullPath);
        }
      } else {
        const lowerName = item.toLowerCase();
        
        // Exclude critical configurations/backups we want to keep
        if (item === 'tl_comprehensive_backup.sql' || item === 'config.toml' || item === '.gitignore') {
          continue;
        }

        const isRootFile = path.dirname(fullPath) === targetDir;

        // Process SQL files
        if (item.endsWith('.sql') && (lowerName.includes('seed') || lowerName.includes('backup') || lowerName.includes('structure') || lowerName.includes('infrastructure') || lowerName.includes('policies') || lowerName.includes('policy'))) {
          console.log(`Found local SQL backup: ${item}`);
          const content = fs.readFileSync(fullPath, 'utf8');
          const headerMatch = content.match(/Generated:\s*([^\n\r]+)/);
          const timestamp = headerMatch ? new Date(headerMatch[1]) : stats.mtime;
          const dateLabel = getFriendlyDateLabel(timestamp.toISOString());
          
          const parsed = parseSqlSeed(content);
          if (parsed.services.length > 0 || parsed.pricing.length > 0 || parsed.roomTypes.length > 0) {
            backupSources.push({
              filePath: fullPath,
              name: `SQL: ${item}`,
              dateLabel,
              timestamp,
              ...parsed
            });
            if (!isRootFile) {
              pathsToDelete.push(fullPath);
            }
            console.log(`  -> Parsed SQL backup: ${parsed.services.length} services, ${parsed.pricing.length} pricing records.`);
          } else {
            if (!isRootFile) {
              pathsToDelete.push(fullPath);
            }
          }
        } 
        // Process JSON files
        else if (item.endsWith('.json')) {
          console.log(`Found local JSON backup: ${item}`);
          const content = fs.readFileSync(fullPath, 'utf8');
          
          let dateStr = stats.mtime.toISOString();
          const dateMatch = item.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) dateStr = dateMatch[1];
          const dateLabel = getFriendlyDateLabel(dateStr);
          
          const source = loadBackupData(fullPath, `JSON: ${item}`, dateLabel, stats.mtime, content);
          if (source) {
            backupSources.push(source);
            if (!isRootFile) {
              pathsToDelete.push(fullPath);
            }
            console.log(`  -> Parsed JSON backup: ${source.services.length} services, ${source.pricing.length} pricing records, ${source.roomTypes.length} room types.`);
          } else {
            if (!isRootFile) {
              pathsToDelete.push(fullPath);
            }
          }
        }
      }
    }
  }

  scanDirRecursively(targetDir);

  console.log(`\nLoaded ${backupSources.length} backup files/folders for comparison.`);

  // 3. Compare and identify distinct/different services & prices
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

  // 3. Heal active services and room types using backups
  console.log('\n=== Healing Active Services & Room Types ===');
  
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

  const roomTypeColumns = [
    'name', 'amenities', 'max_occupancy', 'min_stay_days', 'max_infants',
    'max_children', 'max_teens', 'max_adults', 'image_url', 'images',
    'meal_plan', 'description', 'service_fee'
  ];

  const servicesToUpdate = new Map<string, any>(); // serviceId -> updated fields
  const roomTypesToUpdate = new Map<string, any>(); // roomTypeId -> updated fields

  for (const actSvc of activeServices) {
    if (!actSvc.name) continue;
    const normalizedName = actSvc.name.trim();
    const backupVers = serviceVersionsMap.get(normalizedName) || [];
    
    // Sort versions newest first so we get the latest backup data first
    backupVers.sort((a, b) => b.source.timestamp.getTime() - a.source.timestamp.getTime());

    let serviceDirty = false;
    const updatedFields: any = {};

    for (const col of serviceColumns) {
      const actVal = actSvc[col];
      const isActEmpty = actVal === null || actVal === undefined || actVal === '' || 
                         (Array.isArray(actVal) && actVal.length === 0) ||
                         (typeof actVal === 'object' && Object.keys(actVal).length === 0);

      if (isActEmpty) {
        // Find a backup version that has a value
        for (const ver of backupVers) {
          let bkpVal = ver.service[col];
          
          // Try to sanitize string arrays/jsonb
          if (col === 'gallery_images' || col === 'amenities' || col === 'highlights' || col === 'included' || col === 'not_included' || col === 'meal_plans') {
            if (typeof bkpVal === 'string') {
              const parsedArray = parsePgArrayString(bkpVal);
              if (parsedArray) {
                bkpVal = parsedArray;
              } else {
                try { bkpVal = JSON.parse(bkpVal); } catch(e){}
              }
            }
          }

          const isBkpEmpty = bkpVal === null || bkpVal === undefined || bkpVal === '' ||
                             (Array.isArray(bkpVal) && bkpVal.length === 0) ||
                             (typeof bkpVal === 'object' && Object.keys(bkpVal).length === 0);

          if (!isBkpEmpty) {
            updatedFields[col] = bkpVal;
            serviceDirty = true;
            console.log(`  🔧 Service "${actSvc.name}": Filling empty field "${col}" with value from "${ver.source.name}"`);
            break; // Stop at the first (newest) non-empty backup value found
          }
        }
      }
    }

    if (serviceDirty) {
      servicesToUpdate.set(actSvc.id, updatedFields);
      // Update our local activeServices copy as well so downstream pricing comparison sees the healed data
      Object.assign(actSvc, updatedFields);
    }

    // Now heal room types for this service
    const actRooms = activeRoomsByService.get(actSvc.id) || [];
    for (const actRoom of actRooms) {
      let roomDirty = false;
      const roomUpdatedFields: any = {};

      for (const col of roomTypeColumns) {
        const actVal = actRoom[col];
        const isActEmpty = actVal === null || actVal === undefined || actVal === '' || 
                           (Array.isArray(actVal) && actVal.length === 0) ||
                           (typeof actVal === 'object' && Object.keys(actVal).length === 0);

        if (isActEmpty) {
          // Find matching room in backup versions
          for (const ver of backupVers) {
            const bkpRoom = ver.rooms.find(r => r.name && r.name.trim().toLowerCase() === actRoom.name.trim().toLowerCase());
            if (bkpRoom) {
              let bkpVal = bkpRoom[col];
              
              if (col === 'amenities' || col === 'images') {
                if (typeof bkpVal === 'string') {
                  const parsedArray = parsePgArrayString(bkpVal);
                  if (parsedArray) {
                    bkpVal = parsedArray;
                  } else {
                    try { bkpVal = JSON.parse(bkpVal); } catch(e){}
                  }
                }
              }

              const isBkpEmpty = bkpVal === null || bkpVal === undefined || bkpVal === '' ||
                                 (Array.isArray(bkpVal) && bkpVal.length === 0) ||
                                 (typeof bkpVal === 'object' && Object.keys(bkpVal).length === 0);

              if (!isBkpEmpty) {
                roomUpdatedFields[col] = bkpVal;
                roomDirty = true;
                console.log(`    🔧 Room "${actRoom.name}" under "${actSvc.name}": Filling empty field "${col}"`);
                break;
              }
            }
          }
        }
      }

      if (roomDirty) {
        roomTypesToUpdate.set(actRoom.id, roomUpdatedFields);
        Object.assign(actRoom, roomUpdatedFields);
      }
    }
  }

  // Update in Database if not DRY_RUN
  if (!DRY_RUN) {
    if (servicesToUpdate.size > 0) {
      console.log(`Updating ${servicesToUpdate.size} healed services in database...`);
      for (const [id, fields] of servicesToUpdate.entries()) {
        const { error } = await supabase
          .from('services')
          .update(fields)
          .eq('id', id);
        if (error) {
          console.error(`  ❌ Error updating service ${id}:`, error.message);
        } else {
          console.log(`  ✅ Service ${id} updated successfully.`);
        }
      }
    }

    if (roomTypesToUpdate.size > 0) {
      console.log(`Updating ${roomTypesToUpdate.size} healed room types in database...`);
      for (const [id, fields] of roomTypesToUpdate.entries()) {
        const { error } = await supabase
          .from('room_types')
          .update(fields)
          .eq('id', id);
        if (error) {
          console.error(`  ❌ Error updating room type ${id}:`, error.message);
        } else {
          console.log(`  ✅ Room type ${id} updated successfully.`);
        }
      }
    }
  } else {
    console.log(`[DRY RUN] Would update ${servicesToUpdate.size} services and ${roomTypesToUpdate.size} room types.`);
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

  for (const [serviceName, versions] of serviceVersionsMap.entries()) {
    // Sort versions newest first
    versions.sort((a, b) => b.source.timestamp.getTime() - a.source.timestamp.getTime());

    const activeMatches = activeServices.filter(as => as.name && as.name.trim().toLowerCase() === serviceName.toLowerCase());
    
    if (activeMatches.length === 0) {
      const newestVersion = versions[0];
      if (newestVersion.pricing.length === 0 && newestVersion.rooms.length === 0 && newestVersion.service.service_type === 'hotel') {
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
      console.log(`➕ Missing Service: "${serviceName}" | Rooms: ${newestVersion.rooms.length}, Pricing: ${newestVersion.pricing.length}`);
    } else {
      const mainActiveService = activeMatches[0];
      const activeRooms = activeRoomsByService.get(mainActiveService.id) || [];
      const activePrices = activePricingByService.get(mainActiveService.id) || [];

      const uniqueBackupPricingStructures: typeof versions = [];

      for (const ver of versions) {
        if (ver.pricing.length === 0) continue;

        const isPricingSame = !isPricingDifferent(activeRooms, activePrices, ver.rooms, ver.pricing);

        if (!isPricingSame) {
          let isSameAsOtherBackup = false;
          for (const uniqueVer of uniqueBackupPricingStructures) {
            if (!isPricingDifferent(uniqueVer.rooms, uniqueVer.pricing, ver.rooms, ver.pricing)) {
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
        if (duplicateExists) continue;

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
          reason: `Pricing Mismatch (Backup has different pricing details)`,
          backupSource: uniqueVer.source.name
        });
        console.log(`⚠️ Pricing Mismatch for "${serviceName}": Will duplicate as "${duplicateName}"`);
      }
    }
  }

  // 4. Execute inserts if not DRY_RUN
  if (servicesToInsert.length > 0) {
    if (DRY_RUN) {
      console.log(`\n[DRY RUN] Would insert/duplicate ${servicesToInsert.length} services.`);
    } else {
      console.log(`\nInserting ${servicesToInsert.length} distinct services/pricing into Supabase...`);
      for (const item of servicesToInsert) {
        const servicePayload = { ...item.serviceData };
        delete servicePayload.id;
        delete servicePayload.created_at;
        delete servicePayload.updated_at;
        
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
        console.log(`  ✅ Inserted service: "${item.name}" -> ID: ${newServiceId}`);

        const roomIdMap = new Map<string, string>();

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
          }
        }

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

          // Sanitize jsonb columns to ensure they are valid JSON objects or NULL
          const jsonbCols = ['occupancy_pricing', 'net_occupancy_pricing'];
          jsonbCols.forEach(col => {
            if (pPayload[col] !== undefined && pPayload[col] !== null) {
              let val = pPayload[col];
              if (typeof val === 'string') {
                try { val = JSON.parse(val); } catch(e){}
              }
              if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                pPayload[col] = val;
              } else {
                pPayload[col] = null;
              }
            } else {
              pPayload[col] = null;
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
      }
    }
  } else {
    console.log('No different services or pricing variants found to insert.');
  }

  // 5. Delete backup files after they have been processed
  console.log('\nCleaning up processed backup files...');
  let deletedFilesCount = 0;
  
  // Sort paths to delete files first, then directories
  pathsToDelete.sort((a, b) => {
    const isADir = fs.existsSync(a) && fs.statSync(a).isDirectory();
    const isBDir = fs.existsSync(b) && fs.statSync(b).isDirectory();
    if (isADir && !isBDir) return 1;
    if (!isADir && isBDir) return -1;
    return b.length - a.length; // Delete deeply nested files first
  });

  for (const p of pathsToDelete) {
    if (fs.existsSync(p)) {
      try {
        const stats = fs.statSync(p);
        if (stats.isDirectory()) {
          // Only delete if empty
          const children = fs.readdirSync(p);
          if (children.length === 0) {
            fs.rmdirSync(p);
            console.log(`🗑️ Deleted empty directory: ${path.basename(p)}`);
          } else {
            console.warn(`⚠️ Warning: Directory not empty, skipping: ${path.basename(p)}`);
          }
        } else {
          fs.unlinkSync(p);
          deletedFilesCount++;
          console.log(`🗑️ Deleted file: ${path.basename(p)}`);
        }
      } catch (err: any) {
        console.error(`❌ Failed to delete ${p}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Process complete. Deleted ${deletedFilesCount} backup files.`);
}

main().catch(console.error);
