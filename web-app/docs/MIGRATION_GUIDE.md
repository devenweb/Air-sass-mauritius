# WordPress to New Web App Migration Guide

> [!NOTE]
> **Migration Status: COMPLETE** — The WordPress-to-Royal Travel Agency migration was completed in early 2026.
> This document is kept for reference and historical context only. A copy is also preserved in `docs/archive/MIGRATION_GUIDE.md`.
> The migration scripts (`wordpress-migration.ts`, `woocommerce-migration.ts`) remain in `scripts/` as read-only references.

This guide explains how to migrate data from a WordPress website to the Royal Travel Agency web application.

## Prerequisites

1. Access to your WordPress website (and WooCommerce if applicable)
2. WordPress API credentials (if using WooCommerce)
3. Environment variables configured for your Supabase connection
4. Node.js and npm installed

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WordPress site URL
WORDPRESS_SITE_URL=https://your-wordpress-site.com

# WooCommerce API credentials (only needed if you have WooCommerce)
WC_CONSUMER_KEY=your_consumer_key
WC_CONSUMER_SECRET=your_consumer_secret
```

## Setup

1. Install required dependencies:

```bash
npm install axios
```

2. If not already installed:

```bash
npm install @supabase/supabase-js
```

## Running the Migration

### For WordPress Posts/Pages/Media:

```bash
npx ts-node scripts/wordpress-migration.ts
```

### For WooCommerce Products:

```bash
npx ts-node scripts/woocommerce-migration.ts
```

## Important Notes

1. **Backup First**: Always backup your Supabase database before running migration scripts.

2. **Rate Limiting**: The scripts include delays to be respectful to your WordPress server, but check with your hosting provider for acceptable request rates.

3. **Schema Mapping**: The scripts assume certain table structures in Supabase. You'll likely need to adjust the column mappings in the insertion functions to match your actual database schema.

4. **Custom Fields**: If your WordPress site has custom fields or metadata, you'll need to extend the scripts to handle these appropriately.

5. **Media Files**: The migration handles references to media files, but you may need to download and re-upload actual image files to your new hosting solution.

6. **Testing**: Test with a small subset of data first before running the full migration.

## Customization

The scripts are designed to be extended. You may need to:

- Modify the database table names to match your schema
- Adjust field mappings based on how your new application expects data
- Add additional data transformations
- Include other WordPress content types (custom post types, comments, etc.)

## Troubleshooting

- If you get rate-limited by your WordPress site, increase the delay in the script
- Check that your Supabase credentials have appropriate permissions
- Ensure your WordPress REST API is enabled and accessible
- For WooCommerce, confirm that API access is enabled in WooCommerce settings
