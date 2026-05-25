# Safe Project Isolation Guide

To prevent **Royal Travel Agency 2026** and other distinct projects from overriding each other, you must maintain strict isolation across four layers: **Directory**, **Vercel**, **Supabase**, and **Environment Variables**.

---

## 1. Vercel Project Isolation (The "Override" Root Cause)
The issue experienced previously was caused by the local folder being "Linked" to the wrong Vercel project.

### **How to verify your link:**
Run this in any `web-app` or `admin-app` folder:
```bash
vercel project ls
```
It should show the currently linked project with a checkmark.

### **How to safely switch/re-link:**
If you copy a folder or move between project environments, run:
```bash
vercel link
```
1. It will ask: "Set up [path]?" -> **Yes**
2. "Link to existing project?" -> **Yes**
3. Select the **correct** project name (e.g., `Royal Travel Agency-2026-web` vs other project IDs).

---

## 2. Environment Variable Hygiene
Never hardcode Supabase URLs or Keys. Always use `.env.local` which is excluded from Git.

### **Royal Travel Agency (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tbyudagfjspedeqtlgjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **Other Projects (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_OTHER_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> [!IMPORTANT]
> **Check before you build:** Run `cat .env.local` to ensure you aren't pointing to the wrong database.

---

## 3. Terminal & Workspace Context
To avoid working in the wrong project by accident:

*   **Distinct VS Code Windows**: Open `Desktop\Royal Travel Agency 2026` in its own dedicated window.
*   **Color Theme**: Set a specific VS Code theme for this project (e.g., "Dark") so you instantly know where you are.
*   **Git Check**: Before any push, run:
    ```bash
    git remote -v
    ```
    Ensure the URL points to the correct GitHub repository.

---

## 4. Supabase CLI Context
If you use the Supabase CLI, each project needs to be linked to its specific remote database.

### **To link a folder to Supabase:**
```bash
supabase link --project-ref [PROJECT_ID]
```
*   Royal Travel Agency: `tbyudagfjspedeqtlgjv`
*   Other Projects: `[OTHER_ID]`

---

## 5. The "Sanity Check" Command
Before doing a deployment (`vercel --prod`), run this simple checklist in your terminal:

1.  `pwd` (Print Working Directory) -> Am I in the right folder?
2.  `git remote -v` -> Am I pushing to the right GitHub?
3.  `vercel project ls` -> Am I deploying to the right Vercel site?
4.  `grep SUPABASE_URL .env.local` -> Am I using the right database?

By following these 4 commands, you will **never** override your projects.
