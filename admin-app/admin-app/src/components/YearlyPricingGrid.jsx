import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, 
  AlertCircle, CheckCircle2, Trash2, Banknote,
  Loader2, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../utils/swal';

/*
const AGE_GROUPS = [
  { key: 'price',       label: 'Adult Rate',  color: 'blue' },
  { key: 'infant_price', label: 'Infant',      color: 'green' },
  { key: 'child_price',  label: 'Child',       color: 'amber' },
  { key: 'teen_price',   label: 'Teen',        color: 'purple' }
];
*/

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const emptyGrid = (year) => 
  MONTHS.map(name => ({
    name,
    year,
    price: '',
    infant_price: '',
    child_price: '',
    teen_price: '',
    notes: '',
    expanded: false,
    days: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      price: '',
      infant_price: '',
      child_price: '',
      teen_price: ''
    }))
  }));

const hydrateGrid = (base, records, _year) => {
  const grid = [...base];
  records.forEach(rec => {
    const mi = rec.month - 1;
    if (mi < 0 || mi > 11) return;
    
    const patch = {
      price: rec.adult_price || '',
      infant_price: rec.infant_price || '',
      child_price: rec.child_price || '',
      teen_price: rec.teen_price || ''
    };

    if (rec.day === null || rec.day === 0) {
      grid[mi] = { ...grid[mi], ...patch, notes: rec.notes || '' };
    } else {
      const dayIdx = rec.day - 1;
      if (grid[mi]?.days[dayIdx]) {
        grid[mi].days[dayIdx] = { ...grid[mi].days[dayIdx], ...patch };
      }
    }
  });
  return grid;
};

const YearlyPricingGrid = ({ serviceId, variants = [] }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants]);

  useEffect(() => {
    if (serviceId && selectedVariant) {
      loadPricing();
    }
  }, [serviceId, selectedVariant, year]);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', serviceId)
        .eq('variant_id', selectedVariant.name || selectedVariant.id)
        .eq('year', year);

      if (error) throw error;
      setGrid(hydrateGrid(emptyGrid(year), data || [], year));
    } catch (err) {
      console.error('Field to load pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMonth = (mi, field, val) => {
    setGrid(prev => prev.map((m, i) => i === mi ? { ...m, [field]: val } : m));
  };

  const updateDay = (mi, di, field, val) => {
    setGrid(prev => prev.map((m, i) => {
      if (i !== mi) return m;
      const newDays = [...m.days];
      newDays[di] = { ...newDays[di], [field]: val };
      return { ...m, days: newDays };
    }));
  };

  const copyMonthToDays = (mi) => {
    const m = grid[mi];
    setGrid(prev => prev.map((month, i) => {
      if (i !== mi) return month;
      return {
        ...month,
        days: month.days.map(d => ({
          ...d,
          price: d.price || m.price,
          infant_price: d.infant_price || m.infant_price,
          child_price: d.child_price || m.child_price,
          teen_price: d.teen_price || m.teen_price
        }))
      };
    }));
  };

  const handleSave = async () => {
    if (!serviceId || !selectedVariant) return;
    setSaving(true);
    try {
      const rows = [];
      grid.forEach((m, mi) => {
        // Month default
        if (m.price || m.infant_price || m.child_price || m.teen_price || m.notes) {
          rows.push({
            service_id: serviceId,
            variant_id: selectedVariant.name || selectedVariant.id,
            year: year,
            month: mi + 1,
            day: null,
            adult_price: parseFloat(m.price) || null,
            infant_price: parseFloat(m.infant_price) || null,
            child_price: parseFloat(m.child_price) || null,
            teen_price: parseFloat(m.teen_price) || null,
            notes: m.notes || null
          });
        }
        // Day overrides
        m.days.forEach(d => {
          if (d.price || d.infant_price || d.child_price || d.teen_price) {
            rows.push({
              service_id: serviceId,
              variant_id: selectedVariant.name || selectedVariant.id,
              year: year,
              month: mi + 1,
              day: d.day,
              adult_price: parseFloat(d.price) || null,
              infant_price: parseFloat(d.infant_price) || null,
              child_price: parseFloat(d.child_price) || null,
              teen_price: parseFloat(d.teen_price) || null
            });
          }
        });
      });

      // 1. Delete existing for this set
      await supabase.from('service_pricing')
        .delete()
        .eq('service_id', serviceId)
        .eq('variant_id', selectedVariant.name || selectedVariant.id)
        .eq('year', year);

      // 2. Insert new
      if (rows.length > 0) {
        const { error } = await supabase.from('service_pricing').insert(rows);
        if (error) throw error;
      }

      showAlert('Success', 'Yearly pricing updated successfully', 'success');
    } catch (err) {
      console.error('Save error:', err);
      showAlert('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleMonth = (mi) => {
    setGrid(prev => prev.map((m, i) => i === mi ? { ...m, expanded: !m.expanded } : m));
  };

  if (!serviceId) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Variant</label>
            <div className="flex gap-2">
              {variants.map(v => (
                <button
                  key={v.id || v.name}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    (selectedVariant?.id === v.id || selectedVariant?.name === v.name)
                      ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-red-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-brand-red hover:text-brand-red'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-10 w-[1px] bg-slate-200 mx-2" />

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendar Year</label>
            <div className="flex gap-1">
              {[2025, 2026, 2027].map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    year === y
                      ? 'bg-brand-charcoal text-white border-brand-charcoal'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-brand-charcoal hover:text-brand-charcoal'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-8 py-3 bg-brand-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-100 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save {year} Grid
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Month</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Adult</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-green-600">Infant</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-amber-600">Child</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-purple-600">Teen</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right px-2">Actions</div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
          {grid.map((m, mi) => (
            <div key={mi} className="bg-white transition-colors hover:bg-slate-50/50">
              <div className="grid grid-cols-12 items-center px-6 py-4">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{m.name}</span>
                  {m.price ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-slate-300" />}
                </div>
                
                <div className="col-span-2 pr-4">
                  <div className="relative">
                    <Banknote size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={m.price}
                      onChange={e => updateMonth(mi, 'price', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-brand-red outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="col-span-2 pr-4">
                  <input
                    type="number"
                    value={m.infant_price}
                    onChange={e => updateMonth(mi, 'infant_price', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2 pr-4">
                  <input
                    type="number"
                    value={m.child_price}
                    onChange={e => updateMonth(mi, 'child_price', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2 pr-4">
                  <input
                    type="number"
                    value={m.teen_price}
                    onChange={e => updateMonth(mi, 'teen_price', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2 px-2">
                  {m.price && (
                    <button 
                      onClick={() => copyMonthToDays(mi)}
                      className="p-2 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                      title="Apply to all days"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => toggleMonth(mi)}
                    className={`p-2 rounded-lg transition-all ${m.expanded ? 'bg-brand-red text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                  >
                    {m.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {m.expanded && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-4">
                  <div className="grid grid-cols-7 gap-3">
                    {m.days.map((d, di) => (
                      <div key={di} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2 relative group-day">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400">{d.day}</span>
                          <button 
                            onClick={() => {
                              ['price', 'infant_price', 'child_price', 'teen_price'].forEach(f => updateDay(mi, di, f, ''));
                            }}
                            className="text-slate-200 hover:text-brand-red transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <input
                            type="number"
                            value={d.price}
                            onChange={e => updateDay(mi, di, 'price', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-900 outline-none focus:ring-1 focus:ring-brand-red"
                            placeholder={m.price || '0'}
                          />
                          <input
                            type="number"
                            value={d.child_price}
                            onChange={e => updateDay(mi, di, 'child_price', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-amber-600 outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder={m.child_price || '0'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YearlyPricingGrid;
