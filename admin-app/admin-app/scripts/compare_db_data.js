const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Database Comparison Script
 * 
 * This script compares data from a backup SQL file with the current database,
 * focusing on identifying differences, especially in pricing-related tables.
 */

async function compareDatabaseData() {
    console.log('🔍 Starting Database Data Comparison...');
    
    // Define backup directory path
    const backupDir = path.join('..', 'web-app', 'supabase', 'backups', 'sql_2026-05-15');
    const fullPath = path.resolve(__dirname, backupDir);
    
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
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('🔗 Connected to Supabase database');

    // Compare specific tables that likely contain pricing data
    const pricingTables = ['room_types', 'tour_packages', 'pricing', 'services', 'bookings'];
    const allDifferences = {};

    for (const tableName of pricingTables) {
        if (backupData[tableName]) {
            console.log(`\n🔍 Comparing table: ${tableName}`);
            const differences = await compareTable(supabase, tableName, backupData[tableName]);
            
            if (differences && differences.length > 0) {
                allDifferences[tableName] = differences;
                console.log(`⚠️  Found ${differences.length} differences in ${tableName}:`);
                
                differences.forEach((diff, index) => {
                    console.log(`   ${index + 1}. Record ID: ${diff.id}`);
                    Object.keys(diff.changes).forEach(field => {
                        const oldValue = diff.changes[field].old;
                        const newValue = diff.changes[field].new;
                        
                        // Highlight pricing changes specifically
                        if (field.toLowerCase().includes('price') || 
                            field.toLowerCase().includes('cost') || 
                            field.toLowerCase().includes('rate')) {
                            console.log(`      💰 ${field}: ${oldValue} → ${newValue} (PRICING CHANGE)`);
                        } else {
                            console.log(`      📝 ${field}: ${oldValue} → ${newValue}`);
                        }
                    });
                });
            } else {
                console.log(`✅ No differences found in ${tableName}`);
            }
        } else {
            console.log(`\n⚠️  Table ${tableName} not found in backup data`);
        }
    }

    // Also check any other tables that exist in the backup
    for (const tableName of Object.keys(backupData)) {
        if (!pricingTables.includes(tableName) && tableName !== dataFile) {
            console.log(`\n🔍 Comparing other table: ${tableName}`);
            const differences = await compareTable(supabase, tableName, backupData[tableName]);
            
            if (differences && differences.length > 0) {
                allDifferences[tableName] = differences;
                console.log(`⚠️  Found ${differences.length} differences in ${tableName}:`);
                
                // Only show pricing-related differences for non-pricing tables
                const pricingDiffs = differences.filter(diff => 
                    Object.keys(diff.changes).some(field => 
                        field.toLowerCase().includes('price') || 
                        field.toLowerCase().includes('cost') || 
                        field.toLowerCase().includes('rate')
                    )
                );
                
                if (pricingDiffs.length > 0) {
                    pricingDiffs.forEach((diff, index) => {
                        console.log(`   ${index + 1}. Record ID: ${diff.id} (PRICING RELATED)`);
                        Object.keys(diff.changes).forEach(field => {
                            if (field.toLowerCase().includes('price') || 
                                field.toLowerCase().includes('cost') || 
                                field.toLowerCase().includes('rate')) {
                                const oldValue = diff.changes[field].old;
                                const newValue = diff.changes[field].new;
                                console.log(`      💰 ${field}: ${oldValue} → ${newValue} (PRICING CHANGE)`);
                            }
                        });
                    });
                } else {
                    console.log(`ℹ️  ${differences.length} non-pricing differences found (not displayed)`);
                }
            }
        }
    }

    console.log('\n📊 Summary of all differences:');
    if (Object.keys(allDifferences).length > 0) {
        for (const [tableName, diffs] of Object.entries(allDifferences)) {
            const pricingChanges = diffs.filter(diff => 
                Object.keys(diff.changes).some(field => 
                    field.toLowerCase().includes('price') || 
                    field.toLowerCase().includes('cost') || 
                    field.toLowerCase().includes('rate')
                )
            );
            
            console.log(`   📁 ${tableName}: ${diffs.length} total changes (${pricingChanges.length} pricing-related)`);
        }
    } else {
        console.log('   ✅ No differences found between backup and current data');
    }

    return allDifferences;
}

/**
 * Parse SQL file to extract INSERT statements into a structured format
 */
function parseSqlFile(filePath) {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const lines = sqlContent.split('\n');
    const tableData = {};
    
    // Regular expression to match INSERT INTO statements
    const insertRegex = /INSERT INTO "?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\([^)]+\)\s*VALUES\s*(.*)$/i;
    
    for (const line of lines) {
        const match = line.trim().match(insertRegex);
        if (match) {
            const tableName = match[1];
            let valuesPart = match[2];
            
            // Handle multiple rows in one INSERT statement
            // Remove outer parentheses and split by '),('
            valuesPart = valuesPart.replace(/^\(/, '').replace(/\);?$/, '');
            const rows = valuesPart.includes('),(') ? 
                valuesPart.split(/\)\s*,\s*\(/) : [valuesPart];
            
            if (!tableData[tableName]) {
                tableData[tableName] = [];
            }
            
            for (let row of rows) {
                // Clean up the row and split by comma
                row = row.replace(/^\(|\)$/g, '');
                
                // Handle quoted values that might contain commas
                const values = parseValues(row);
                
                // We'll store the values as an array for now
                // In a more sophisticated implementation, we'd match to column names
                tableData[tableName].push(values);
            }
        }
    }
    
    return tableData;
}

/**
 * Parse values accounting for quoted strings that may contain commas
 */
function parseValues(valuesString) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < valuesString.length; i++) {
        const char = valuesString[i];
        
        if ((char === "'" || char === '"') && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            currentValue += char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = null;
            currentValue += char;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    if (currentValue.trim()) {
        values.push(currentValue.trim());
    }
    
    return values;
}

/**
 * Compare a specific table between backup data and current database
 */
async function compareTable(supabase, tableName, backupRows) {
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
            return backupRows.map((row, index) => ({
                id: `new-${index}`,
                changes: { all: { old: null, new: row } }
            }));
        }

        // Attempt to match records by ID if available, otherwise use a heuristic
        const differences = [];
        
        // For this implementation, we'll do a basic comparison
        // A more robust implementation would map column names from the INSERT statement
        for (let i = 0; i < Math.max(backupRows.length, currentData.length); i++) {
            const backupRow = i < backupRows.length ? backupRows[i] : null;
            const currentRow = i < currentData.length ? currentData[i] : null;
            
            if (!currentRow) {
                // Row exists in backup but not in current DB
                differences.push({
                    id: `missing-${i}`,
                    changes: { all: { old: null, new: backupRow } }
                });
            } else if (!backupRow) {
                // Row exists in current DB but not in backup
                differences.push({
                    id: currentRow.id || `extra-${i}`,
                    changes: { all: { old: currentRow, new: null } }
                });
            } else {
                // Both exist, compare them
                const rowChanges = compareRows(backupRow, currentRow);
                if (Object.keys(rowChanges).length > 0) {
                    differences.push({
                        id: currentRow.id || i,
                        changes: rowChanges
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
 * Compare two row objects and return the differences
 */
function compareRows(backupRow, currentRow) {
    const changes = {};
    
    // Convert the backup row from array to object for easier comparison
    // This is a simplified approach - in a real implementation, we'd need to know the column names
    const backupObj = Array.isArray(backupRow) ? convertArrayToObj(backupRow, currentRow) : backupRow;
    
    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(backupObj), ...Object.keys(currentRow)]);
    
    for (const key of allKeys) {
        const backupValue = backupObj[key];
        const currentValue = currentRow[key];
        
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
    
    return changes;
}

/**
 * Convert array values to object using keys from current row as reference
 */
function convertArrayToObj(arrayRow, currentRow) {
    const obj = {};
    const keys = Object.keys(currentRow);
    
    // Map array indices to object keys
    for (let i = 0; i < keys.length && i < arrayRow.length; i++) {
        obj[keys[i]] = arrayRow[i];
    }
    
    return obj;
}

/**
 * Normalize values for comparison (handle nulls, quotes, etc.)
 */
function normalizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        // Remove surrounding quotes if they exist
        return value.replace(/^'|'$/g, '').trim();
    }
    return String(value).trim();
}

// Run the comparison process
if (require.main === module) {
    compareDatabaseData().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { compareDatabaseData };