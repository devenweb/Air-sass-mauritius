require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Adds missing columns to the service_pricing table
 */
async function addMissingColumns() {
  console.log("Adding missing columns to service_pricing table...");

  try {
    // Add the capacity column if it doesn't exist
    const { error: capacityError } = await supabase.rpc('alter_table_add_column_if_not_exists', {
      table_name: 'service_pricing',
      column_name: 'capacity',
      column_type: 'INTEGER',
      default_value: 0
    });

    if (capacityError && capacityError.code !== '42701') {
      console.log('Capacity column may already exist or another error occurred:', capacityError.message);
    }

    // Alternative approach using raw SQL to add the column if it doesn't exist
    const { error: rawSQLError } = await supabase
      .from('service_pricing')
      .select('capacity')
      .limit(1);

    if (rawSQLError && rawSQLError.code === '42703') {
      console.log('Column does not exist, attempting to add it via SQL...');
      
      // Execute raw SQL to add the missing column
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE service_pricing ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;'
      });

      if (sqlError) {
        console.log('Error executing SQL to add capacity column:', sqlError.message);
      } else {
        console.log('Successfully added capacity column to service_pricing table');
      }
    } else if (!rawSQLError) {
      console.log('Capacity column already exists in service_pricing table');
    }

    // Check for other potentially missing columns that were being accessed in previous scripts
    const additionalColumns = [
      { name: 'duration', type: 'TEXT', default: null },
      { name: 'duration_type', type: 'TEXT', default: null }
    ];

    for (const col of additionalColumns) {
      const { error: colError } = await supabase
        .from('service_pricing')
        .select(col.name)
        .limit(1);

      if (colError && colError.code === '42703') {
        console.log(`Column ${col.name} does not exist, attempting to add it...`);

        const { error: addColError } = await supabase.rpc('execute_sql', {
          sql: `ALTER TABLE service_pricing ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${col.default ? ` DEFAULT ${col.default}` : ' DEFAULT NULL'};`
        });

        if (addColError) {
          console.log(`Error adding ${col.name} column:`, addColError.message);
        } else {
          console.log(`Successfully added ${col.name} column to service_pricing table`);
        }
      } else if (!colError) {
        console.log(`${col.name} column already exists in service_pricing table`);
      }
    }

    console.log("Completed checking and adding missing columns to service_pricing table");
  } catch (error) {
    console.error('Error during column addition process:', error);
  }
}

/**
 * Helper function to execute raw SQL (requires proper permissions)
 */
async function executeRawSQL(sql) {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: sql
  });
  
  return { data, error };
}

// Run the function
addMissingColumns()
  .then(() => console.log('Column addition process completed'))
  .catch(error => console.error('Error during column addition:', error));