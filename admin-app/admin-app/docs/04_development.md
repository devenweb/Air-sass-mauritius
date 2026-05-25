# 04 Development & DevOps Guide

## Local Setup
1. **Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Configuration**:
   Create a `.env` file in the root with:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Launch**:
   ```bash
   npm run dev
   ```

---

## Build & Deployment
- **Production Bundle**:
  ```bash
  npm run build
  ```
- **Platform**: Hosted on **Vercel** with automatic deployments on `main` branch pushes.
- **Asset Bundling**: Ensure all thematic images are placed in `src/assets` to be correctly resolved by the `import.meta.glob` engine.

---

## Operational Scripts
- **Data Backup**: Utility scripts found in `scripts/` to snapshot the `services` table before major imports.
- **SEO Sync**: Automatically triggers meta-tag updates when saving settings in the Global Settings module.
