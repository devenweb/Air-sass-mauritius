import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name since __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample travel-related titles for different sections of the Travel Lounge website
const titleSets = {
  services: [
    "Luxury Mauritius Getaways",
    "Adventure Tours & Excursions",
    "Premium Accommodation Deals",
    "Exclusive Island Experiences",
    "Tailor-made Holiday Packages",
    "Private Charter Services",
    "Cultural Heritage Tours",
    "Water Sports Adventures",
    "Wellness & Spa Retreats",
    "Gourmet Dining Experiences"
  ],
  promotions: [
    "Limited-Time Summer Special Offers",
    "Early Bird Booking Discounts",
    "Last-Minute Luxury Escapes",
    "Family-Friendly Vacation Deals",
    "Romantic Getaways for Couples",
    "Group Travel Exclusive Rates",
    "VIP Concierge Services",
    "Seasonal Promotions & Events",
    "Member Exclusive Benefits",
    "Special Occasion Packages"
  ],
  destinations: [
    "Discover Mauritius Paradise",
    "Explore Rodrigues Island",
    "Adventures in the Indian Ocean",
    "Cultural Journeys Through Africa",
    "Exotic Beach Destinations",
    "Mountain & Nature Retreats",
    "City Exploration Packages",
    "Tropical Island Hopping",
    "Wildlife Safari Experiences",
    "Historical & Cultural Tours"
  ]
};

// Function to generate random titles for different sections
function generateTitles(section = 'services', count = 5) {
  const sectionTitles = titleSets[section] || titleSets.services;
  const shuffled = [...sectionTitles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Main function to generate and save titles
function main() {
  console.log("Generating titles for Travel Lounge admin app...\n");
  
  const servicesTitles = generateTitles('services', 5);
  const promotionsTitles = generateTitles('promotions', 5);
  const destinationsTitles = generateTitles('destinations', 5);
  
  const allTitles = {
    services: servicesTitles,
    promotions: promotionsTitles,
    destinations: destinationsTitles,
    timestamp: new Date().toISOString()
  };
  
  // Write to a JSON file
  const outputPath = path.join(__dirname, '..', 'generated_titles.json');
  fs.writeFileSync(outputPath, JSON.stringify(allTitles, null, 2));
  
  console.log("Generated Services Titles:");
  servicesTitles.forEach((title, i) => console.log(`${i + 1}. ${title}`));
  
  console.log("\nGenerated Promotion Titles:");
  promotionsTitles.forEach((title, i) => console.log(`${i + 1}. ${title}`));
  
  console.log("\nGenerated Destination Titles:");
  destinationsTitles.forEach((title, i) => console.log(`${i + 1}. ${title}`));
  
  console.log(`\nAll titles saved to: ${outputPath}`);
}

main();