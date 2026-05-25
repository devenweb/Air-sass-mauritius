require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Comprehensive Database Comparison Script
 * 
 * This script compares data from a backup SQL file with the current database,
 * focusing on identifying all pricing-related differences across all tables.
 */

async function comprehensiveCompare() {
    console.log('🔍 Starting Comprehensive Database Comparison...');
    
    // Define backup directory path - correcting path to go to web-app directory
    const backupDir = path.join(__dirname, '..', '..', 'web-app', 'supabase', 'backups', 'sql_2026-05-15');
    const fullPath = path.resolve(backupDir);
    
    console.log(`📂 Checking backup directory: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ Backup directory does not exist: ${fullPath}`);
        process.exit(1);
    }

    // Look for backup files
    const backupFiles = fs.readdirSync(fullPath).filter(file => file.endsWith('.sql'));
    
    if (backupFiles.length === 0) {
        console.error(`❌ No SQL backup files found in: ${fullPath}`);
        process.exit(1);
    }

    console.log(`📊 Found ${backupFiles.length} backup files:`);
    backupFiles.forEach(file => console.log(`   - ${file}`));

    // Find the seed/data file which likely contains the actual data
    const dataFile = backupFiles.find(f => f.includes('seed') || f.includes('data')) || backupFiles[0];
    const dataFilePath = path.join(fullPath, dataFile);

    console.log(`📖 Reading backup data from: ${dataFilePath}`);

    // Parse the backup SQL file to extract INSERT statements
    const backupData = parseSqlFile(dataFilePath);
    console.log(`📋 Parsed ${Object.keys(backupData).length} tables from backup`);

    // Initialize Supabase client with environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
        console.log(`   Current values: VITE_SUPABASE_URL=${supabaseUrl}, VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? '***HIDDEN***' : 'undefined'}`);
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('🔗 Connected to Supabase database');

    // Track all differences
    const allDifferences = {};
    const pricingDifferences = {};

    // Check all tables in the backup data
    for (const tableName of Object.keys(backupData)) {
        console.log(`\n🔍 Examining table: ${tableName}`);
        
        const differences = await compareTable(supabase, tableName, backupData[tableName]);
        
        if (differences && differences.length > 0) {
            allDifferences[tableName] = differences;
            console.log(`⚠️  Found ${differences.length} differences in ${tableName}`);
            
            // Filter for pricing-related differences
            const pricingDiffs = differences.filter(diff => 
                Object.keys(diff.changes).some(field => 
                    isPricingField(field, diff.changes[field])
                )
            );
            
            if (pricingDiffs.length > 0) {
                if (!pricingDifferences[tableName]) pricingDifferences[tableName] = [];
                pricingDifferences[tableName].push(...pricingDiffs);
                
                console.log(`💰 Found ${pricingDiffs.length} pricing-related differences in ${tableName}:`);
                
                pricingDiffs.slice(0, 3).forEach((diff, index) => { // Show first 3 pricing diffs
                    console.log(`   ${index + 1}. Record ID: ${diff.id}`);
                    Object.keys(diff.changes).forEach(field => {
                        const oldValue = diff.changes[field].old;
                        const newValue = diff.changes[field].new;
                        
                        if (isPricingField(field, { old: oldValue, new: newValue })) {
                            console.log(`      💰 ${field}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)} (PRICING CHANGE)`);
                        }
                    });
                });
                
                if (pricingDiffs.length > 3) {
                    console.log(`      ... and ${pricingDiffs.length - 3} more pricing changes`);
                }
            } else {
                console.log(`   No direct pricing changes detected (but ${differences.length - pricingDiffs.length} other differences exist)`);
            }
        } else {
            console.log(`✅ No differences found in ${tableName}`);
        }
    }

    // Also check for tables in the current database that weren't in the backup
    console.log('\n🔍 Checking for tables in current DB not in backup...');
    console.log(`   ℹ️  Skipping system tables check due to Supabase restrictions on system catalog access`);
    console.log(`      To identify new tables, you can manually check your schema against the parsed backup tables:`);
    console.log(`      Tables in backup: ${Object.keys(backupData).join(', ')}`);

    // Final summary
    console.log('\n📊 COMPREHENSIVE SUMMARY:');
    console.log(`Total tables with differences: ${Object.keys(allDifferences).length}`);
    
    console.log('\n💰 PRICING-RELATED DIFFERENCES:');
    let totalPricingChanges = 0;
    for (const [tableName, diffs] of Object.entries(pricingDifferences)) {
        const count = diffs.length;
        console.log(`   ${tableName}: ${count} pricing changes`);
        totalPricingChanges += count;
    }
    
    console.log(`\n💰 TOTAL PRICING CHANGES ACROSS ALL TABLES: ${totalPricingChanges}`);
    
    console.log('\n📋 ALL TABLES WITH ANY DIFFERENCES:');
    for (const [tableName, diffs] of Object.entries(allDifferences)) {
        const pricingCount = pricingDifferences[tableName] ? pricingDifferences[tableName].length : 0;
        console.log(`   ${tableName}: ${diffs.length} total changes (${pricingCount} pricing)`);
    }

    console.log('\n📋 TABLES IN BACKUP BUT NOT CHECKED (empty in current DB):');
    const allBackupTables = Object.keys(backupData);
    const checkedTables = Object.keys(allDifferences);
    const uncheckedTables = allBackupTables.filter(table => !checkedTables.includes(table));
    console.log(`   ${uncheckedTables.join(', ') || 'None'}`);

    return { allDifferences, pricingDifferences };
}

/**
 * Determine if a field is pricing-related
 */
function isPricingField(fieldName, fieldChange) {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Check if field name suggests pricing
    const isPricingName = lowerFieldName.includes('price') || 
        lowerFieldName.includes('cost') || 
        lowerFieldName.includes('rate') ||
        lowerFieldName.includes('amount') ||
        lowerFieldName.includes('fee') ||
        lowerFieldName.includes('charge') ||
        lowerFieldName.includes('tariff') ||
        lowerFieldName.includes('payment') ||
        lowerFieldName.includes('revenue') ||
        lowerFieldName.includes('income') ||
        lowerFieldName.includes('expense') ||
        lowerFieldName.includes('discount') ||
        lowerFieldName.includes('tax') ||
        lowerFieldName.includes('subtotal') ||
        lowerFieldName.includes('total');
    
    if (isPricingName) return true;
    
    // For site_settings, check if the value itself contains pricing info
    if (fieldName === 'value' && typeof fieldChange.old === 'object' && fieldChange.old !== null) {
        return JSON.stringify(fieldChange.old).toLowerCase().includes('price');
    }
    
    return false;
}

/**
 * Parse SQL file to extract INSERT statements into a structured format
 */
function parseSqlFile(filePath) {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const tableData = {};
    
    // Match INSERT INTO statements that may have ON CONFLICT clauses
    // This regex captures the table name, column names, and values separately
    const insertRegex = /INSERT INTO (?:"?public\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\(([^)]+)\)\s*VALUES\s*\((.+?)\)(?:\s+ON CONFLICT|$)/gs;
    
    let match;
    while ((match = insertRegex.exec(sqlContent)) !== null) {
        const tableName = match[1];
        const columnsStr = match[2];
        const valuesStr = match[3];
        
        // Parse column names
        const columns = parseColumns(columnsStr);
        
        // Parse values, handling complex values like JSON
        const values = parseValuesComplex(valuesStr);
        
        // Create a record object mapping columns to values
        const record = {};
        for (let i = 0; i < columns.length; i++) {
            let value = values[i] || null;
            
            // Special handling for JSON-like strings in site_settings.value
            if (tableName === 'site_settings' && columns[i] === 'value' && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
                try {
                    value = JSON.parse(value);
                } catch(e) {
                    // If it's not valid JSON, keep the string
                }
            }
            
            record[columns[i]] = value;
        }
        
        if (!tableData[tableName]) {
            tableData[tableName] = [];
        }
        
        tableData[tableName].push(record);
    }
    
    return tableData;
}

/**
 * Parse column names from the column specification
 */
function parseColumns(columnsStr) {
    // Split by comma, but be careful of content inside quotes
    const columns = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < columnsStr.length; i++) {
        const char = columnsStr[i];
        
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = null;
            current += char;
        } else if (char === ',' && !inQuotes) {
            columns.push(current.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        columns.push(current.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    }
    
    return columns;
}

/**
 * Parse values accounting for quoted strings, JSON, and other complex values
 */
function parseValuesComplex(valuesStr) {
    const values = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let parenDepth = 0;
    let i = 0;
    
    while (i < valuesStr.length) {
        const char = valuesStr[i];
        
        if (char === '(' && !inSingleQuote && !inDoubleQuote) {
            parenDepth++;
            current += char;
        } else if (char === ')' && !inSingleQuote && !inDoubleQuote) {
            if (parenDepth === 0) {
                // End of value group
                break;
            }
            parenDepth--;
            current += char;
        } else if (char === "'" && !inDoubleQuote && !inSingleQuote) {
            inSingleQuote = true;
            current += char;
        } else if (char === "'" && inSingleQuote && valuesStr[i-1] !== '\\') {
            inSingleQuote = false;
            current += char;
        } else if (char === '"' && !inSingleQuote && !inDoubleQuote) {
            inDoubleQuote = true;
            current += char;
        } else if (char === '"' && inDoubleQuote && valuesStr[i-1] !== '\\') {
            inDoubleQuote = false;
            current += char;
        } else if (char === ',' && !inSingleQuote && !inDoubleQuote && parenDepth === 0) {
            values.push(normalizeValue(current));
            current = '';
        } else {
            current += char;
        }
        
        i++;
    }
    
    if (current.trim()) {
        values.push(normalizeValue(current.trim()));
    }
    
    return values;
}

/**
 * Compare a specific table between backup data and current database
 */
async function compareTable(supabase, tableName, backupRecords) {
    try {
        // Get current data from the table
        let { data: currentData, error } = await supabase
            .from(tableName)
            .select('*');
        
        if (error) {
            console.error(`❌ Error fetching data from table ${tableName}:`, error.message);
            return null;
        }

        if (!currentData || currentData.length === 0) {
            console.log(`   ℹ️  Table ${tableName} is empty in current database`);
            return backupRecords.map((record, index) => ({
                id: record.id || record.key || `new-${index}`,
                changes: { all: { old: null, new: record } }
            }));
        }

        // Create a map of current records by ID/key for quick lookup
        const currentRecordMap = {};
        currentData.forEach(record => {
            // Try to use 'id' or 'key' field as the identifier
            const id = record.id || record.key || JSON.stringify(record);
            currentRecordMap[id] = record;
        });

        // Create a map of backup records by ID/key for quick lookup
        const backupRecordMap = {};
        backupRecords.forEach(record => {
            // Try to use 'id' or 'key' field as the identifier
            const id = record.id || record.key || JSON.stringify(record);
            backupRecordMap[id] = record;
        });

        const differences = [];

        // Check records that exist in backup but not in current DB
        for (const id in backupRecordMap) {
            if (!currentRecordMap.hasOwnProperty(id)) {
                differences.push({
                    id: id,
                    changes: { all: { old: null, new: backupRecordMap[id] } }
                });
            }
        }

        // Check records that exist in current DB but not in backup
        for (const id in currentRecordMap) {
            if (!backupRecordMap.hasOwnProperty(id)) {
                differences.push({
                    id: id,
                    changes: { all: { old: currentRecordMap[id], new: null } }
                });
            }
        }

        // Check records that exist in both but have different values
        for (const id in currentRecordMap) {
            if (backupRecordMap.hasOwnProperty(id)) {
                const currentRecord = currentRecordMap[id];
                const backupRecord = backupRecordMap[id];
                
                const recordChanges = compareRecords(backupRecord, currentRecord);
                if (Object.keys(recordChanges).length > 0) {
                    differences.push({
                        id: id,
                        changes: recordChanges
                    });
                }
            }
        }

        return differences;
    } catch (error) {
        console.error(`❌ Error comparing table ${tableName}:`, error.message);
        return null;
    }
}

/**
 * Compare two record objects and return the differences
 */
function compareRecords(backupRecord, currentRecord) {
    const changes = {};

    // Get all unique keys from both records
    const allKeys = new Set([
        ...Object.keys(backupRecord), 
        ...Object.keys(currentRecord)
    ]);

    for (const key of allKeys) {
        const backupValue = backupRecord[key];
        const currentValue = currentRecord[key];

        // Deep comparison for objects (especially for JSON values in site_settings)
        if (typeof backupValue === 'object' && typeof currentValue === 'object' && backupValue !== null && currentValue !== null) {
            if (!objectsEqual(backupValue, currentValue)) {
                changes[key] = {
                    old: backupValue,
                    new: currentValue
                };
            }
        } else {
            // Normalize values for comparison
            const normalizedBackup = normalizeValue(backupValue);
            const normalizedCurrent = normalizeValue(currentValue);

            if (normalizedBackup !== normalizedCurrent) {
                changes[key] = {
                    old: backupValue,
                    new: currentValue
                };
            }
        }
    }

    return changes;
}

/**
 * Check if two objects are equal (shallow comparison)
 */
function objectsEqual(obj1, obj2) {
    if (obj1 === null && obj2 === null) return true;
    if (obj1 === null || obj2 === null) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
}

/**
 * Normalize values for comparison (handle nulls, quotes, etc.)
 */
function normalizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        // Remove surrounding quotes if they exist
        return value.replace(/^'|'$/g, '').replace(/^"|"$/g, '').trim();
    }
    return String(value).trim();
}

// Run the comparison process
if (require.main === module) {
    comprehensiveCompare().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { comprehensiveCompare };