require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Adds missing columns to the service_pricing table using raw SQL
 */
async function addMissingColumns() {
  console.log("Adding missing columns to service_pricing table using raw SQL...");

  try {
    // SQL to add the capacity column if it doesn't exist
    const addCapacitySQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'service_pricing' 
          AND column_name = 'capacity'
        ) THEN
          ALTER TABLE service_pricing ADD COLUMN capacity INTEGER DEFAULT 0;
          RAISE NOTICE 'Column capacity added to service_pricing';
        ELSE
          RAISE NOTICE 'Column capacity already exists in service_pricing';
        END IF;
      END $$;
    `;

    // Execute the SQL to add capacity column
    const { error: capacityError } = await supabase.rpc('execute_sql', {
      sql: addCapacitySQL
    });

    if (capacityError) {
      console.log('Error executing SQL for capacity column:', capacityError.message);
      console.log('This may happen if the RPC function does not exist in your Supabase setup');
    } else {
      console.log('Successfully handled capacity column in service_pricing table');
    }

    // Alternative approach - try to create a new table with the missing column and migrate data
    console.log("If direct column addition didn't work, you may need to:");
    console.log("1. Create a new table with the required columns");
    console.log("2. Copy data from the old table");
    console.log("3. Rename the new table to replace the old one");
    console.log("4. Or contact your DBA to add the missing columns directly via SQL");

    // Show the current structure of the service_pricing table
    console.log("\nCurrent structure of service_pricing table:");
    const { data: sampleData, error: selectError } = await supabase
      .from('service_pricing')
      .select('*')
      .limit(1);

    if (sampleData && sampleData[0]) {
      console.log("Available columns:", Object.keys(sampleData[0]));
    } else {
      console.log("Could not retrieve sample data:", selectError);
    }

    console.log("\nCompleted checking and attempting to add missing columns to service_pricing table");
  } catch (error) {
    console.error('Error during column addition process:', error);
  }
}

// Run the function
addMissingColumns()
  .then(() => console.log('Column addition process completed'))
  .catch(error => console.error('Error during column addition:', error));