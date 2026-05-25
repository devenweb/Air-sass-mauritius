# Data Import Scripts

This directory contains scripts for importing services and hotel data from external sources into our database.

## Available Scripts

### Import Services from deal.mu
Imports general services (activities, tours, etc.) from deal.mu:

```bash
npm run import-services
```

### Import Hotels from deal.mu
Imports hotel and accommodation data from deal.mu:

```bash
npm run import-hotels
```

### Import Everything from deal.mu
Imports both services and hotels from deal.mu:

```bash
npm run import-all
```

## Setup Instructions

Before running these scripts, you need to install dependencies and configure environment variables:

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file and add your Supabase credentials:
```bash
cp .env.example .env.local
# Edit .env.local with your actual Supabase credentials
```

## How It Works

1. The scripts use Puppeteer to scrape data from deal.mu
2. Data is cleaned and transformed to match our database schema
3. Data is inserted into the 'services' table in batches to prevent database overload
4. Each entry gets a unique ID and appropriate metadata

## Important Notes

- Make sure to add your Supabase URL and ANON key to the .env file
- The scripts include rate limiting to prevent being blocked by the target website
- Data is normalized to match our regional classifications
- Prices are parsed and converted to numeric values
- Services are categorized based on their names and descriptions

## Customization

You may need to update the selectors in the scraping functions to match the current structure of deal.mu if the site changes.

## Troubleshooting

If the scripts fail due to blocking, try:
- Increasing the delays between requests
- Using a proxy service
- Running the scripts during off-peak hours

If you get Supabase errors, make sure your environment variables are properly configured.

If modules are not found, make sure all dependencies are installed with `npm install`.