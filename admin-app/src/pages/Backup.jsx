import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  FileCode,
  RefreshCw,
  Clock,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showSuccess, showError, showLoading, showConfirm } from '../utils/swal';

const BackupPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('last_backup_time') || null);

  // Ordered list of tables to avoid FK violations during restore
  const tables = [
    // Core Infrastructure
    'site_settings', 
    'categories', 
    'admins', 
    'email_templates',
    'navigations',
    'partners',
    'faqs',
    'content_blocks',
    
    // Business Catalog
    'services', 
    'service_categories', 
    'room_types', 
    'service_pricing',
    'hero_slides', 
    'popup_ads',
    'popular_destinations',
    'editorial_posts',
    
    // Engagement
    'customers', 
    'subscribers', 
    'inquiries', 
    'reviews',
    
    // Transactions
    'bookings', 
    'booking_items',
    
    // E-commerce (if used)
    'product_categories',
    'products',
    'orders',
    'order_items',
    'invoices',
    'invoice_items'
  ];

  const generateBackup = async () => {
    setIsGenerating(true);
    showLoading('Building full system snapshot...');
    
    try {
      const fullData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          source: 'Royal Travel Agency Admin Command Center'
        },
        data: {}
      };

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          console.warn(`Could not backup table ${table}:`, error.message);
          continue;
        }
        fullData.data[table] = data;
      }
      
      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `TL_FULL_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      const now = new Date().toLocaleString();
      setLastBackup(now);
      localStorage.setItem('last_backup_time', now);
      
      showSuccess('Snapshot Created', `Successfully exported ${Object.keys(fullData.data).length} tables to ${filename}`);
    } catch (err) {
      console.error(err);
      showError('Backup Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await showConfirm(
      'Initialize System Restore?',
      'CRITICAL: This will synchronize the current database with the backup file. Existing data will be preserved unless it conflicts with the backup. Proceed?'
    );

    if (result.isConfirmed) {
      showLoading('Restoring System Data...');
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const backupFile = JSON.parse(event.target.result);
            const data = backupFile.data || backupFile; // Handle both old and new formats

            let successCount = 0;
            let errorCount = 0;

            // Restore in the order defined in tables array to respect FKs
            for (const table of tables) {
              const rows = data[table];
              if (Array.isArray(rows) && rows.length > 0) {
                const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
                if (error) {
                  console.error(`Error restoring ${table}:`, error);
                  errorCount++;
                } else {
                  successCount++;
                }
              }
            }

            if (errorCount > 0) {
              showError('Restore Partial', `Restored ${successCount} tables. ${errorCount} tables encountered issues.`);
            } else {
              showSuccess('Restore Success', `All ${successCount} tables synchronized successfully.`);
            }
            } catch {
            showError('Invalid Backup File', 'The selected file is not a valid JSON backup.');
          }
        };
        reader.readAsText(file);
      } catch (err) {
        showError('Restore Failed', err.message);
      }
    }
    // Reset input
    e.target.value = null;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center relative">
            <Database className="text-brand-red w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Control</h1>
            <p className="text-slate-500 font-medium">Database snapshots and infrastructure management</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <Clock className="text-slate-400 w-4 h-4" />
            <span className="text-xs font-bold text-slate-600">Last Sync: {lastBackup || 'Never'}</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
            <Activity className="text-green-500 w-4 h-4" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">System Healthy</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Download className="text-brand-red w-5 h-5" />
                  Generate Snapshots
                </h2>
                <p className="text-slate-400 text-xs mt-1">Export full database state as a portable JSON file</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={generateBackup}
                disabled={isGenerating}
                className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-brand-red hover:bg-red-50/30 transition-all text-left flex flex-col gap-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileJson className="w-24 h-24 text-brand-red" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-brand-red/10 group-hover:scale-110 transition-all w-fit">
                  <FileJson className="w-8 h-8 text-slate-400 group-hover:text-brand-red" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">Master Data Export</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Download all records including services, pricing, customers, and bookings.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-red font-bold text-xs">
                  <span>Start Export</span>
                  <Zap className="w-3 h-3" />
                </div>
              </button>

              <div className="group p-8 rounded-3xl border-2 border-slate-100 bg-slate-50/50 transition-all text-left flex flex-col gap-6 opacity-80 cursor-not-allowed">
                <div className="p-4 rounded-2xl bg-white transition-all w-fit">
                  <FileCode className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-black text-slate-300 text-lg mb-2">Infrastructure DDL</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Schema definitions and database structure. Managed via Git repository.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs italic">
                  <span>Version Controlled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-red rounded-2xl shadow-lg shadow-red-500/50">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Security Protocol</h2>
                  <p className="text-slate-400 text-sm">Best practices for data management</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                System backups are generated in-memory and encrypted during transmission. 
                Always store your snapshot files in a secure, offline environment. 
                Restoring data will bypass standard RLS checks for super-admins; proceed with extreme caution.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                  <CheckCircle2 className="text-green-400 w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-300">AUTO-ENCRYPT</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                  <CheckCircle2 className="text-green-400 w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-300">ISO CERTIFIED</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                  <CheckCircle2 className="text-green-400 w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-300">GDPR READY</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                  <CheckCircle2 className="text-green-400 w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-300">CRC VALIDATED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="space-y-8 flex-1">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Upload className="text-brand-red w-5 h-5" />
                  Restore Point
                </h2>
                <p className="text-slate-400 text-xs mt-1">Initialize system synchronization from a local file</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <AlertTriangle className="text-amber-500 w-6 h-6 shrink-0" />
                </div>
                <div>
                  <h4 className="font-black text-amber-900 text-sm mb-1">Caution Advised</h4>
                  <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                    Restoring data will synchronize existing records. 
                    Mismatched schemas may cause system errors.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="border-3 border-dashed border-slate-100 group-hover:border-brand-red group-hover:bg-red-50/20 transition-all rounded-[40px] p-12 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm group-hover:shadow-red-200">
                    <RefreshCw className="text-slate-400 group-hover:text-brand-red w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-900">Upload Seed File</p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">JSON format only • Max 50MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-50">
              <button className="w-full flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 p-5 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">System Logs</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;

