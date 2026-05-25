import { importServicesFromDealmu } from './importServicesFromDealmu';
import { importHotelsFromDealmu } from './importHotelsFromDealmu';

async function importAllFromDealmu() {
  console.log('Starting comprehensive import from deal.mu...');
  
  try {
    console.log('Step 1: Importing general services...');
    await importServicesFromDealmu();
    
    console.log('Step 2: Importing hotels...');
    await importHotelsFromDealmu();
    
    console.log('All imports completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importAllFromDealmu()
    .then(() => {
      console.log('Complete import from deal.mu finished successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Complete import from deal.mu failed:', error);
      process.exit(1);
    });
}