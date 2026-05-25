'use client'

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Banknote,
  LayoutGrid,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Utensils,
  DollarSign,
  Search,
  ShieldOff,
  Box
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert, showConfirm } from '../utils/swal';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DEFAULT_AGE_GROUPS = [
  { key: 'price',        label: 'Adult',   ageRange: '18+',    color: 'slate' },
  { key: 'price_teen',   label: 'Teen',    ageRange: '12-17',  color: 'purple' },
  { key: 'price_child',  label: 'Child',   ageRange: '3-11',   color: 'blue' },
  { key: 'price_infant', label: 'Infant',  ageRange: '0-2',    color: 'amber' },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const fmt = (v) => parseFloat(v || 0).toLocaleString();

const daysInMonth = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();

const isoDate = (y, mIdx, d) => `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const parseISODate = (str) => {
  if (!str) return null;
  const parts = str.split('-');
  return {
    year: parseInt(parts[0]),
    month: parseInt(parts[1]) - 1,
    day: parseInt(parts[2])
  };
};

const mapPricingToGrid = (pricing, grid, year) => {
  const sortedPricing = [...pricing].sort((a, b) => {
    const aLen = new Date(a.date_to).getTime() - new Date(a.date_from).getTime();
    const bLen = new Date(b.date_to).getTime() - new Date(b.date_from).getTime();
    return bLen - aLen; 
  });

  sortedPricing.forEach(r => {
    if (!r.date_from) return;

    const parsedFrom = parseISODate(r.date_from);
    const parsedTo = r.date_to ? parseISODate(r.date_to) : parsedFrom;
    const rFrom = new Date(parsedFrom.year, parsedFrom.month, parsedFrom.day);
    const rTo = new Date(parsedTo.year, parsedTo.month, parsedTo.day);

    MONTHS.forEach((monthName, monthIdx) => {
      const monthData = grid[monthIdx];
      const monthStart = new Date(year, monthIdx, 1);
      const monthEnd = new Date(year, monthIdx + 1, 0);

      if (rFrom > monthEnd || rTo < monthStart) return;

      const isMealRecord = r.variant_id === 'meal_supplements';
      const isFullMonth = (rFrom <= monthStart && rTo >= monthEnd);

      const processOccupancy = (target) => {
        const source = r.net_occupancy_pricing || r.occupancy_pricing;
        if (!source) return;
        Object.keys(source).forEach(k => {
            const val = source[k];
            if (typeof val === 'object') {
                target.tiers[k] = {
                    price: String(val.price ?? ''),
                    teen: String(val.teen ?? ''),
                    child: String(val.child ?? ''),
                    infant: String(val.infant ?? '')
                };
            } else {
                // Legacy support
                if (!target.tiers[k]) target.tiers[k] = { price: '', teen: '', child: '', infant: '' };
                target.tiers[k].price = String(val ?? '');
            }
        });
      };

      if (isFullMonth) {
        if (isMealRecord) {
          if (!monthData.meal_supplements) monthData.meal_supplements = [];
          const exists = monthData.meal_supplements.some(s => s.label === r.label);
          if (!exists) {
            monthData.meal_supplements.push({
              label:  r.label || 'Meal Plan',
              adult:  String(r.price        ?? ''),
              teen:   String(r.price_teen   ?? ''),
              child:  String(r.price_child  ?? ''),
              infant: String(r.price_infant ?? ''),
            });
          }
        } else {
          monthData.price = String(r.net_price ?? r.price ?? '');
          monthData.price_teen = String(r.net_price_teen ?? r.price_teen ?? '');
          monthData.price_child = String(r.net_price_child ?? r.price_child ?? '');
          monthData.price_infant = String(r.net_price_infant ?? r.price_infant ?? '');
          monthData.service_fee = r.service_fee;
          
          processOccupancy(monthData);

          monthData.units_available = r.units_available !== null ? String(r.units_available) : '';
          monthData.is_stop_sell = !!r.is_stop_sell;
          monthData.notes = r.notes || '';
        }
      }

      for (let d = 1; d <= monthEnd.getDate(); d++) {
        const dDate = new Date(year, monthIdx, d);
        if (dDate >= rFrom && dDate <= rTo) {
          const dayData = monthData.days[d - 1];
          if (!dayData) continue;

          if (isMealRecord) {
            if (!dayData.meal_supplements) dayData.meal_supplements = [];
            const exists = dayData.meal_supplements.some(s => s.label === r.label);
            if (!exists) {
              dayData.meal_supplements.push({
                label:  r.label || 'Meal Plan',
                adult:  String(r.price        ?? ''),
                teen:   String(r.price_teen   ?? ''),
                child:  String(r.price_child  ?? ''),
                infant: String(r.price_infant ?? ''),
              });
            }
          } else {
            dayData.price = String(r.net_price ?? r.price ?? '');
            dayData.price_teen = String(r.net_price_teen ?? r.price_teen ?? '');
            dayData.price_child = String(r.net_price_child ?? r.price_child ?? '');
            dayData.price_infant = String(r.net_price_infant ?? r.price_infant ?? '');
            dayData.service_fee = r.service_fee;
            
            processOccupancy(dayData);

            dayData.units_available = r.units_available !== null ? String(r.units_available) : '';
            dayData.is_stop_sell = !!r.is_stop_sell;
          }
        }
      }
    });
  });
  return grid;
};
const PaxMatrix = ({ tiers, onChange, maxAdults = 3, dark = false, hideHeaders = false }) => {
  const labels = { "1": "Single", "2": "Double", "3": "Triple", "4": "Quad", "5": "Pax 5", "6": "Pax 6" };
  const labelColor = dark ? 'text-slate-200' : 'text-slate-400';
  
  return (
    <div className={cn("w-full rounded-2xl border p-4 space-y-3", dark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/50 border-slate-100", hideHeaders && "border-none bg-transparent p-0")}>
      {!hideHeaders && (
        <div className="grid grid-cols-5 gap-3 mb-1">
          <span className={cn("text-[9px] font-black uppercase", labelColor)}>Occupancy</span>
          <span className={cn("text-[9px] font-black uppercase text-center", labelColor)}>Adult</span>
          <span className={cn("text-[9px] font-black uppercase text-center", labelColor)}>Teen</span>
          <span className={cn("text-[9px] font-black uppercase text-center", labelColor)}>Child</span>
          <span className={cn("text-[9px] font-black uppercase text-center", labelColor)}>Infant</span>
        </div>
      )}
      {Array.from({ length: maxAdults }).map((_, i) => {
        const k = String(i + 1);
        const t = tiers[k] || { price: '', teen: '', child: '', infant: '' };
        return (
          <div key={k} className="grid grid-cols-5 gap-3 items-center">
            <span className={cn("text-[10px] font-black uppercase tracking-tighter", dark ? "text-slate-100" : "text-slate-400")}>{labels[k] || `Pax ${k}`}</span>
            {[
              { f: 'price',  l: 'Adult',  bg: 'bg-slate-900',  c: 'border-slate-200 focus:ring-slate-900' },
              { f: 'teen',   l: 'Teen',   bg: 'bg-purple-600', c: 'border-purple-100 focus:ring-purple-500' },
              { f: 'child',  l: 'Child',  bg: 'bg-blue-600',   c: 'border-blue-100 focus:ring-blue-500' },
              { f: 'infant', l: 'Infant', bg: 'bg-amber-600', c: 'border-amber-100 focus:ring-amber-500' }
            ].map(tier => (
              <div key={tier.f} className="relative group">
                <span className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 ${tier.bg} text-white text-[6px] font-black uppercase tracking-widest pointer-events-none z-10 rounded-full shadow-sm`}>
                  {tier.l}
                </span>
                <input 
                  type="number"
                  value={t[tier.f]}
                  onChange={e => onChange(k, tier.f, e.target.value)}
                  placeholder=""
                  className={cn(
                    "w-full border rounded-lg px-2 py-2 text-[11px] font-black outline-none transition-all text-center placeholder-slate-200 shadow-sm",
                    dark ? "bg-white text-slate-900 border-slate-600" : "bg-white text-slate-900 hover:border-slate-300",
                    tier.c
                  )}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const MealSupplementList = ({ sups = [], onAdd, onUpdate, onRemove, dark = false, mealPlans = [] }) => (
  <div className={cn("mt-4 space-y-3 p-4 rounded-xl border transition-all", dark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50/50 border-slate-300")}>
    <div className="flex items-center justify-between mb-2">
      <span className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", dark ? "text-slate-100" : "text-slate-500")}>
        <Utensils className="w-3.5 h-3.5 text-red-500" /> Seasonal Meal Supplements
      </span>
      <button 
        type="button"
        onClick={onAdd}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm",
          dark ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-white border-slate-300 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
        )}
      >
        <Plus className="w-3 h-3" /> ADD MEAL PLAN
      </button>
    </div>

    {sups.length === 0 && (
      <div className={cn("text-center py-6 text-xs italic border border-dashed rounded-lg", dark ? "text-slate-400 border-slate-700" : "text-slate-400 border-slate-300")}>
        No specific meal supplements defined for this period
      </div>
    )}

    <div className="space-y-2">
      {sups.map((s, idx) => (
        <div key={idx} className={cn(
          "flex flex-col sm:flex-row gap-3 p-4 rounded-xl border shadow-sm transition-all",
          dark ? (idx % 2 === 1 ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-800/40 border-slate-700') : (idx % 2 === 1 ? 'bg-slate-100/60 border-slate-300' : 'bg-white border-slate-300')
        )}>
          <div className="flex-1">
            <label className={cn("block text-[9px] font-bold uppercase mb-1", dark ? "text-slate-400" : "text-slate-400")}>Plan Name</label>
            <input 
              list="meal-plan-names"
              value={s.label}
              onChange={e => onUpdate(idx, 'label', e.target.value)}
              placeholder="Select or type name..."
              className={cn(
                "w-full text-xs font-bold border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-slate-900",
                dark ? "bg-slate-900/50 border-slate-600 text-white" : "bg-slate-50/30 border-slate-200"
              )}
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2 flex-[2]">
            {['adult', 'teen', 'child', 'infant'].map(field => (
              <div key={field}>
                <label className={cn("block text-[9px] font-bold uppercase mb-1 capitalize", dark ? "text-slate-400" : "text-slate-400")}>{field}</label>
                <input 
                  type="number"
                  value={s[field]}
                  onChange={e => onUpdate(idx, field, e.target.value)}
                  placeholder=""
                  className={cn(
                    "w-full text-xs border rounded-lg px-2 py-2 outline-none focus:ring-1 focus:ring-slate-900",
                    dark ? "bg-slate-900/50 border-slate-600 text-white" : "bg-slate-50/30 border-slate-200"
                  )}
                />
              </div>
            ))}
          </div>

          <div className="flex items-end">
            <button 
              type="button"
              onClick={() => onRemove(idx)}
              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>

    <datalist id="meal-plan-names">
      {mealPlans.length > 0 ? (
        mealPlans.map(mp => (
          <option key={mp.id} value={mp.label} />
        ))
      ) : (
        <>
          <option value="Bed & Breakfast" />
          <option value="Half Board" />
          <option value="Full Board" />
        </>
      )}
    </datalist>
  </div>
);
/*
const PriceCell = ({ value, onChange, placeholder, colorClass }) => (
  <div className="flex flex-col gap-1">
    <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all
      ${value ? 'border-brand-red bg-red-50/30 ring-1 ring-red-100' : 'border-slate-300 bg-white hover:border-slate-400'}
    `}>
      <span className="text-[10px] font-black text-slate-400 italic">Rs</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs font-black text-slate-800 outline-none placeholder-slate-300"
      />
    </div>
  </div>
);
*/
const PriceManager = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSvc, setSelectedSvc] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVar, setSelectedVar] = useState(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState({ id: 'base', label: 'Base Rate' });
  const [year, setYear] = useState(new Date().getFullYear());
  const [grid, setGrid] = useState([]);
  const [pricingModelOverride, setPricingModelOverride] = useState(null);

  const isHotel = pricingModelOverride 
    ? (pricingModelOverride === 'hotel') 
    : (selectedSvc?.service_type === 'hotel');
  const [bulk, setBulk] = useState({ 
    price: '', price_teen: '', price_child: '', price_infant: '',
    units_available: '', is_stop_sell: null, service_fee: '',
    tiers: {
      "1": { price: '', teen: '', child: '', infant: '' },
      "2": { price: '', teen: '', child: '', infant: '' },
      "3": { price: '', teen: '', child: '', infant: '' },
      "4": { price: '', teen: '', child: '', infant: '' },
      "5": { price: '', teen: '', child: '', infant: '' },
      "6": { price: '', teen: '', child: '', infant: '' }
    }
  });
  const [bulkMeals, setBulkMeals] = useState([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [filterType, setFilterType] = useState(null);
  const [svcSearch, setSvcSearch] = useState('');

  // ── Dynamic Age Groups ──
  const getAgeGroups = () => {
    if (!selectedSvc || !isHotel) {
      return DEFAULT_AGE_GROUPS;
    }

    const groups = [];
    const maxAdults = selectedVar?.max_adults || 2;

    const labels = {
      1: 'Single',
      2: 'Double',
      3: 'Triple',
      4: 'Quadruple',
      5: 'Pax 5',
      6: 'Pax 6'
    };

    for (let i = 1; i <= maxAdults; i++) {
      if (i > 6) break;
      groups.push({
        key: `pax_${i}`,
        label: labels[i] || `${i} Adults`,
        ageRange: '18+',
        color: i === 1 ? 'slate' : 'red'
      });
    }

    // Add supplements
    groups.push({ key: 'price_teen', label: 'Teen', ageRange: '12-17', color: 'purple' });
    groups.push({ key: 'price_child', label: 'Child', ageRange: '3-11', color: 'blue' });
    groups.push({ key: 'price_infant', label: 'Infant', ageRange: '0-2', color: 'amber' });

    return groups;
  };

  const AGE_GROUPS = getAgeGroups();

  // ── Load initial data ──────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [catRes, svcRes] = await Promise.all([
          supabase.from('categories').select('id, name').order('name'),
          supabase.from('services').select('id, name, service_type, meal_plans, service_categories(category_id)').order('name')
        ]);
        
        if (!catRes.error) setCategories(catRes.data);
        if (!svcRes.error) setServices(svcRes.data || []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // ── Load variants when service changes ──────────────────────
  useEffect(() => {
    const loadVariants = async () => {
      setSelectedVar(null);
      setVariants([]);
      if (!selectedSvc) {
        setPricingModelOverride(null);
        return;
      }
      
      setPricingModelOverride(selectedSvc.service_type === 'hotel' ? 'hotel' : 'activity');

      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('service_id', selectedSvc.id)
        .order('name');

      if (!error) {
        if (data.length === 0) {
          const baseVar = { id: null, name: 'Standard Package' };
          setVariants([baseVar]);
          setSelectedVar(baseVar);
          console.log('[PriceManager] No room types found, synthesized Standard Rate');
        } else {
          setVariants(data);
          // If room type changes, reset meal plan to base to avoid ID mismatch
          setSelectedMealPlan({ id: 'base', label: 'Base Rate' });
          if (data.length === 1) {
            setSelectedVar(data[0]);
          } else {
            setSelectedVar(null);
          }
        }
      }
    };
    loadVariants();
  }, [selectedSvc]);

  // ── Hydrate grid when variant/mealPlan/year changes ──────────────────
  useEffect(() => {
    if (selectedSvc && selectedVar) hydrateGrid();
    else setGrid([]);
  }, [selectedVar, selectedMealPlan, year]);

  const hydrateGrid = async () => {
    setLoading(true);
    try {
      let initialGrid = MONTHS.map((name, i) => ({
        name,
        expanded: false,
        price: '', price_teen: '', price_child: '', price_infant: '',
        notes: '',
        units_available: '',
        is_stop_sell: false,
        meal_supplements: [],
        // New Tiered Occupancy Structure
        service_fee: null,
        tiers: {
          "1": { price: '', teen: '', child: '', infant: '' },
          "2": { price: '', teen: '', child: '', infant: '' },
          "3": { price: '', teen: '', child: '', infant: '' },
          "4": { price: '', teen: '', child: '', infant: '' },
          "5": { price: '', teen: '', child: '', infant: '' },
          "6": { price: '', teen: '', child: '', infant: '' }
        },
        days: Array.from({ length: daysInMonth(year, i) }, (_, di) => ({
          day: di + 1,
          price: '', price_teen: '', price_child: '', price_infant: '',
          units_available: '',
          is_stop_sell: false,
          meal_supplements: [],
          service_fee: null,
          tiers: {
            "1": { price: '', teen: '', child: '', infant: '' },
            "2": { price: '', teen: '', child: '', infant: '' },
            "3": { price: '', teen: '', child: '', infant: '' },
            "4": { price: '', teen: '', child: '', infant: '' },
            "5": { price: '', teen: '', child: '', infant: '' },
            "6": { price: '', teen: '', child: '', infant: '' }
          }
        }))
      }));

      let pricingQuery = supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', selectedSvc.id)
        .gte('date_to', `${year}-01-01`)
        .lte('date_from', `${year}-12-31`);

      if (selectedVar.id) {
        pricingQuery = pricingQuery.eq('variant_id', selectedVar.id);
      } else {
        pricingQuery = pricingQuery.is('variant_id', null);
      }

      // Handle Meal Plan filtering
      if (selectedMealPlan && selectedMealPlan.id !== 'base') {
        pricingQuery = pricingQuery.eq('meal_plan_id', selectedMealPlan.id);
      } else {
        pricingQuery = pricingQuery.is('meal_plan_id', null);
      }

      const { data: pricing, error } = await pricingQuery;

      const { data: meals } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', selectedSvc.id)
        .eq('variant_id', 'meal_supplements')
        .gte('date_to', `${year}-01-01`)
        .lte('date_from', `${year}-12-31`);

      const allPricing = [...(pricing || []), ...(meals || [])];
      setGrid(mapPricingToGrid(allPricing, initialGrid, year));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // ── Handlers ────────────────────────────────────────────────
  const updateDay = (mi, di, field, val, tierKey) => {
    setGrid(prev => prev.map((m, i) => {
      if (i !== mi) return m;
      const days = [...m.days];
      const d = { ...days[di] };
      
      if (tierKey) {
        const tiers = { ...d.tiers };
        tiers[tierKey] = { ...tiers[tierKey], [field]: val };
        d.tiers = tiers;
      } else {
        d[field] = val;
        // Sync with tier 1 if not a hotel
        if (!isHotel) {
          const tiers = { ...d.tiers };
          const tKey = '1';
          const tierField = field === 'price' ? 'price' : field.replace('price_', '');
          tiers[tKey] = { ...tiers[tKey], [tierField]: val };
          d.tiers = tiers;
        }
      }
      
      days[di] = d;
      return { ...m, days };
    }));
  };

  const updateMonth = (mi, field, val, tierKey) => {
    setGrid(prev => prev.map((m, i) => {
        if (i !== mi) return m;
        const newM = { ...m };
        
        if (tierKey) {
            const tiers = { ...newM.tiers };
            tiers[tierKey] = { ...tiers[tierKey], [field]: val };
            newM.tiers = tiers;
        } else {
            newM[field] = val;
            // Sync with tier 1 if not a hotel
            if (!isHotel) {
              const tiers = { ...newM.tiers };
              const tKey = '1';
              const tierField = field === 'price' ? 'price' : field.replace('price_', '');
              tiers[tKey] = { ...tiers[tKey], [tierField]: val };
              newM.tiers = tiers;
            }
        }
        return newM;
    }));
  };

  const toggleMonth = (mi) => {
    setGrid(prev => prev.map((m, i) => i === mi ? { ...m, expanded: !m.expanded } : m));
  };

  const copyMonthToDays = (mi) => {
      setGrid(prev => prev.map((m, i) => {
        if (i !== mi) return m;
        
        const days = m.days.map(d => ({
          ...d,
          price: m.price,
          price_teen: m.price_teen,
          price_child: m.price_child,
          price_infant: m.price_infant,
          units_available: m.units_available,
          is_stop_sell: m.is_stop_sell,
          tiers: JSON.parse(JSON.stringify(m.tiers))
        }));
        return { ...m, days };
      }));
  };

  const addMealSupplement = (mi, di = null) => {
    setGrid(prev => prev.map((m, i) => {
      if (i !== mi) return m;
      const newSup = { label: '', adult: '', teen: '', child: '', infant: '' };
      
      if (di === null) {
        return { ...m, meal_supplements: [...(m.meal_supplements || []), newSup] };
      } else {
        const days = [...m.days];
        days[di] = { ...days[di], meal_supplements: [...(days[di].meal_supplements || []), newSup] };
        return { ...m, days };
      }
    }));
  };

  const updateMealSupplement = (mi, di, mealIdx, field, val) => {
    setGrid(prev => prev.map((m, i) => {
      if (i !== mi) return m;
      if (di === null) {
        const meal_supplements = [...(m.meal_supplements || [])];
        meal_supplements[mealIdx] = { ...meal_supplements[mealIdx], [field]: val };
        return { ...m, meal_supplements };
      } else {
        const days = [...m.days];
        const meal_supplements = [...(days[di].meal_supplements || [])];
        meal_supplements[mealIdx] = { ...meal_supplements[mealIdx], [field]: val };
        days[di] = { ...days[di], meal_supplements };
        return { ...m, days };
      }
    }));
  };

  const removeMealSupplement = (mi, di, mealIdx) => {
    setGrid(prev => prev.map((m, i) => {
      if (i !== mi) return m;
      if (di === null) {
        return { ...m, meal_supplements: m.meal_supplements.filter((_, idx) => idx !== mealIdx) };
      } else {
        const days = [...m.days];
        days[di] = { 
          ...days[di], 
          meal_supplements: days[di].meal_supplements.filter((_, idx) => idx !== mealIdx) 
        };
        return { ...m, days };
      }
    }));
  };

  const applyBulk = () => {
    const hasBaseValue = Object.values(bulk).some(v => v !== '' && typeof v !== 'object');
    const hasTiers = Object.values(bulk.tiers).some(t => t.price || t.teen || t.child || t.infant);
    const hasMeals = bulkMeals.length > 0;
    
    if (!hasBaseValue && !hasMeals && !hasTiers) return;

    setGrid(prev => prev.map((m, mi) => {
      // Update month tiers
      const monthTiers = JSON.parse(JSON.stringify(m.tiers));
      if (hasTiers) {
        Object.keys(bulk.tiers).forEach(k => {
          const bt = bulk.tiers[k];
          if (bt.price || bt.teen || bt.child || bt.infant) {
            monthTiers[k] = {
              price: bt.price,
              teen: bt.teen,
              child: bt.child,
              infant: bt.infant
            };
          }
        });
      }

      // If not a hotel, sync bulk adult/teen/child/infant to tier 1
      if (!isHotel && hasBaseValue) {
        monthTiers['1'] = {
          ...monthTiers['1'],
          price:  bulk.price        || monthTiers['1']?.price,
          teen:   bulk.price_teen   || monthTiers['1']?.teen,
          child:  bulk.price_child  || monthTiers['1']?.child,
          infant: bulk.price_infant || monthTiers['1']?.infant
        };
      }

      // Propagate to all days in this month
      const updatedDays = m.days.map(d => ({
        ...d,
        price:        bulk.price        || d.price,
        price_teen:   bulk.price_teen   || d.price_teen,
        price_child:  bulk.price_child  || d.price_child,
        price_infant: bulk.price_infant || d.price_infant,
        units_available: bulk.units_available || d.units_available,
        is_stop_sell: bulk.is_stop_sell !== null ? bulk.is_stop_sell : d.is_stop_sell,
        service_fee: bulk.service_fee !== '' ? bulk.service_fee : d.service_fee,
        meal_supplements: hasMeals ? bulkMeals.map(s => ({...s})) : d.meal_supplements,
        tiers: JSON.parse(JSON.stringify(monthTiers))
      }));

      return {
        ...m,
        price:        bulk.price        || m.price,
        price_teen:   bulk.price_teen   || m.price_teen,
        price_child:  bulk.price_child  || m.price_child,
        price_infant: bulk.price_infant || m.price_infant,
        units_available: bulk.units_available || m.units_available,
        is_stop_sell: bulk.is_stop_sell ?? m.is_stop_sell,
        service_fee: bulk.service_fee !== '' ? bulk.service_fee : m.service_fee,
        meal_supplements: hasMeals ? bulkMeals.map(s => ({...s})) : m.meal_supplements,
        tiers: monthTiers,
        days: updatedDays
      };
    }));
  };

  const handleSave = async () => {
    if (!selectedSvc || !selectedVar) return;
    setSaving(true);
    try {
      // If pricing model override is active and differs, update service_type in public.services
      // Original code commented out to satisfy 'Never remove any code' rule:
      // if (pricingModelOverride && pricingModelOverride !== selectedSvc.service_type) {
      //   const { error: typeUpdateErr } = await supabase
      //     .from('services')
      //     .update({ service_type: pricingModelOverride })
      //     .eq('id', selectedSvc.id);
      //     
      //   if (typeUpdateErr) {
      //     throw new Error(`Failed to update service type: ${typeUpdateErr.message}`);
      //   } else {
      //     selectedSvc.service_type = pricingModelOverride;
      //   }
      // }

      // New logic: Only update if transitioning between 'hotel' and non-hotel (activity) models
      const shouldUpdateDBType = 
        (pricingModelOverride === 'hotel' && selectedSvc.service_type !== 'hotel') ||
        (pricingModelOverride === 'activity' && selectedSvc.service_type === 'hotel');

      if (shouldUpdateDBType) {
        const nextType = pricingModelOverride;
        const { error: typeUpdateErr } = await supabase
          .from('services')
          .update({ service_type: nextType })
          .eq('id', selectedSvc.id);
          
        if (typeUpdateErr) {
          throw new Error(`Failed to update service type: ${typeUpdateErr.message}`);
        } else {
          selectedSvc.service_type = nextType;
        }
      }

      // 1. Delete existing for this variant in this year
      let delQuery = supabase.from('service_pricing')
        .delete()
        .eq('service_id', selectedSvc.id)
        .gte('date_to', `${year}-01-01`)
        .lte('date_from', `${year}-12-31`);

      if (selectedVar.id) {
        delQuery = delQuery.eq('variant_id', selectedVar.id);
      } else {
        delQuery = delQuery.is('variant_id', null);
      }

      // Match meal plan for deletion
      if (selectedMealPlan && selectedMealPlan.id !== 'base') {
        delQuery = delQuery.eq('meal_plan_id', selectedMealPlan.id);
      } else {
        delQuery = delQuery.is('meal_plan_id', null);
      }
      
      await delQuery;

      // Meal supplements (additives) are only managed when "Base Rate" is selected
      if (!selectedMealPlan || selectedMealPlan.id === 'base') {
        await supabase.from('service_pricing')
          .delete()
          .eq('service_id', selectedSvc.id)
          .eq('variant_id', 'meal_supplements')
          .gte('date_to', `${year}-01-01`)
          .lte('date_from', `${year}-12-31`);
      }

      const isHotel = pricingModelOverride 
        ? (pricingModelOverride === 'hotel') 
        : (selectedSvc?.service_type === 'hotel');
      const toInsert = [];
      const priceType = selectedVar?.price_type || (isHotel ? 'per_night' : 'per_person');

      // Helper to calculate gross price based on net and fee hierarchy
      const calculateGross = (net, recordFee) => {
        const netNum = parseFloat(net);
        if (isNaN(netNum) || netNum === 0) return null;
        const feeNum = parseFloat(recordFee);
        const effectiveFee = !isNaN(feeNum) ? feeNum : (selectedVar?.service_fee ?? selectedSvc?.service_fee ?? 0);
        return Math.round(netNum * (1 + (parseFloat(effectiveFee) || 0) / 100));
      };

      for (let mi = 0; mi < 12; mi++) {
        const m = grid[mi];

        const occPricing = {};
        Object.keys(m.tiers).forEach(k => {
          const t = m.tiers[k];
          if (t.price || t.teen || t.child || t.infant) {
            occPricing[k] = {
              price: parseFloat(t.price) || 0,
              teen: parseFloat(t.teen) || 0,
              child: parseFloat(t.child) || 0,
              infant: parseFloat(t.infant) || 0
            };
          }
        });

        const hasMonthData = m.price || m.price_infant || m.price_child || m.price_teen || m.is_stop_sell || Object.keys(occPricing).length > 0;

        if (hasMonthData) {
          toInsert.push({
            service_id:   selectedSvc.id,
            variant_id:   selectedVar.id || null,
            label:        selectedVar?.name || 'Standard Package',
            date_from:    isoDate(year, mi, 1),
            date_to:      isoDate(year, mi, daysInMonth(year, mi)),
            net_price:        parseFloat(m.price) || 0,
            net_price_teen:   parseFloat(m.price_teen)   || 0,
            net_price_child:  parseFloat(m.price_child)  || 0,
            net_price_infant: parseFloat(m.price_infant) || 0,
            price:            calculateGross(m.price, m.service_fee),
            price_teen:       calculateGross(m.price_teen, m.service_fee),
            price_child:      calculateGross(m.price_child, m.service_fee),
            price_infant:     calculateGross(m.price_infant, m.service_fee),
            net_occupancy_pricing: Object.keys(occPricing).length > 0 ? occPricing : null,
            occupancy_pricing: Object.keys(occPricing).length > 0 ? Object.fromEntries(
              Object.entries(occPricing).map(([k, v]) => {
                const gPrice = calculateGross(v.price, m.service_fee);
                const gTeen  = calculateGross(v.teen,  m.service_fee);
                const gChild = calculateGross(v.child, m.service_fee);
                const gInf   = calculateGross(v.infant, m.service_fee);
                
                return [k, {
                  price:  gPrice !== null ? gPrice : 0,
                  teen:   gTeen  !== null ? gTeen  : 0,
                  child:  gChild !== null ? gChild : 0,
                  infant: gInf   !== null ? gInf   : 0
                }];
              })
            ) : null,
            service_fee:  m.service_fee !== null && m.service_fee !== '' ? parseFloat(m.service_fee) : null,
            meal_plan_id: (selectedMealPlan && selectedMealPlan.id !== 'base') ? selectedMealPlan.id : null,
            currency:     'Rs',
            price_type:   priceType,
            units_available: m.units_available !== '' ? parseInt(m.units_available) : null,
            is_stop_sell: !!m.is_stop_sell,
            notes:        m.notes || null,
          });
        }

        // Only save additives if "Base Rate" (No specific absolute meal plan) is selected
        if (!selectedMealPlan || selectedMealPlan.id === 'base') {
          (m.meal_supplements || []).forEach(sup => {
            if (!sup.label.trim()) return;
            toInsert.push({
              service_id:   selectedSvc.id,
              variant_id:   'meal_supplements',
              label:        sup.label,
              date_from:    isoDate(year, mi, 1),
              date_to:      isoDate(year, mi, daysInMonth(year, mi)),
              price:        parseFloat(sup.adult)  || 0,
              price_teen:   parseFloat(sup.teen)   || 0,
              price_child:  parseFloat(sup.child)  || 0,
              price_infant: parseFloat(sup.infant) || 0,
              net_price:        parseFloat(sup.adult)  || 0,
              net_price_teen:   parseFloat(sup.teen)   || 0,
              net_price_child:  parseFloat(sup.child)  || 0,
              net_price_infant: parseFloat(sup.infant) || 0,
              service_fee:  0, // Additives/Supplements are usually net=gross in this UI
              currency:     'Rs',
              price_type:   'per_person',
            });
          });
        }

        for (const d of m.days) {
          const occPricing = {};
          Object.keys(d.tiers).forEach(k => {
            const t = d.tiers[k];
            if (t.price || t.teen || t.child || t.infant) {
              occPricing[k] = {
                price: parseFloat(t.price) || 0,
                teen: parseFloat(t.teen) || 0,
                child: parseFloat(t.child) || 0,
                infant: parseFloat(t.infant) || 0
              };
            }
          });

          const hasDayData = d.price || d.price_infant || d.price_child || d.price_teen || d.is_stop_sell || Object.keys(occPricing).length > 0;
          
          if (hasDayData) {
            toInsert.push({
              service_id:   selectedSvc.id,
              variant_id:   selectedVar.id || null,
              label:        selectedVar.name || 'Standard Package',
              date_from:    isoDate(year, mi, d.day),
              date_to:      isoDate(year, mi, d.day),
              net_price:        parseFloat(d.price) || 0,
              net_price_teen:   parseFloat(d.price_teen)   || 0,
              net_price_child:  parseFloat(d.price_child)  || 0,
              net_price_infant: parseFloat(d.price_infant) || 0,
              price:            calculateGross(d.price, d.service_fee),
              price_teen:       calculateGross(d.price_teen, d.service_fee),
              price_child:      calculateGross(d.price_child, d.service_fee),
              price_infant:     calculateGross(d.price_infant, d.service_fee),
              net_occupancy_pricing: Object.keys(occPricing).length > 0 ? occPricing : null,
              occupancy_pricing: Object.keys(occPricing).length > 0 ? Object.fromEntries(
                Object.entries(occPricing).map(([k, v]) => {
                  const gPrice = calculateGross(v.price, d.service_fee);
                  const gTeen  = calculateGross(v.teen,  d.service_fee);
                  const gChild = calculateGross(v.child, d.service_fee);
                  const gInf   = calculateGross(v.infant, d.service_fee);
                  
                  return [k, {
                    price:  gPrice !== null ? gPrice : 0,
                    teen:   gTeen  !== null ? gTeen  : 0,
                    child:  gChild !== null ? gChild : 0,
                    infant: gInf   !== null ? gInf   : 0
                  }];
                })
              ) : null,
              service_fee:  d.service_fee !== null && d.service_fee !== '' ? parseFloat(d.service_fee) : null,
              meal_plan_id: (selectedMealPlan && selectedMealPlan.id !== 'base') ? selectedMealPlan.id : null,
              currency:     'Rs',
              price_type:   priceType,
              units_available: d.units_available !== '' ? parseInt(d.units_available) : null,
              is_stop_sell: !!d.is_stop_sell,
            });
          }

          if (!selectedMealPlan || selectedMealPlan.id === 'base') {
            (d.meal_supplements || []).forEach(sup => {
              if (!sup.label.trim()) return;
              toInsert.push({
                service_id:   selectedSvc.id,
                variant_id:   'meal_supplements',
                label:        sup.label,
                date_from:    isoDate(year, mi, d.day),
                date_to:      isoDate(year, mi, d.day),
                price:        parseFloat(sup.adult)  || 0,
                price_teen:   parseFloat(sup.teen)   || 0,
                price_child:  parseFloat(sup.child)  || 0,
                price_infant: parseFloat(sup.infant) || 0,
                net_price:        parseFloat(sup.adult)  || 0,
                net_price_teen:   parseFloat(sup.teen)   || 0,
                net_price_child:  parseFloat(sup.child)  || 0,
                net_price_infant: parseFloat(sup.infant) || 0,
                service_fee:  0,
                currency:     'Rs',
                price_type:   'per_person',
              });
            });
          }
        }
      }

      if (toInsert.length === 0) {
        showAlert('No Data', 'No prices were entered. Please fill in at least one month before deploying.', 'warning');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('service_pricing').insert(toInsert);
      if (error) throw error;

      showAlert('Saved', `${toInsert.length} price records deployed for ${year}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch (err) {
      console.error(err);
      showAlert('Save Failed', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async () => {
    if (!newVariantName.trim() || !selectedSvc) return;
    setAddingVariant(true);
    // NOTE: Only insert columns that exist in room_types schema.
    // weekday_price / weekend_price were removed — those columns do not exist.
    const { data, error } = await supabase
      .from('room_types')
      .insert({ service_id: selectedSvc.id, name: newVariantName.trim(), max_adults: 2, max_occupancy: 2, service_fee: 0, min_stay_days: 1 })
      .select().single();

    if (error) {
        showAlert('Error', 'Could not add variant', 'error');
    } else {
      setVariants(prev => [...prev, data]);
      setNewVariantName('');
      setShowAddVariant(false);
      showAlert('Added', `Variant "${data.name}" added`, 'success');
    }
    setAddingVariant(false);
  };

  const handleDeleteVariant = async (v) => {
    const result = await showConfirm('Delete Variant', `Delete "${v.name}" and all its pricing? This cannot be undone.`);
    if (!result.isConfirmed) return;
    await supabase.from('room_types').delete().eq('id', v.id);
    setVariants(prev => prev.filter(x => x.id !== v.id));
    if (selectedVar?.id === v.id) { setSelectedVar(null); setGrid([]); }
    showAlert('Deleted', 'Variant deleted', 'success');
  };

  const handleSelectVar = (v) => {
    setSelectedVar(v);
  };

  const filledMonths = grid.filter(m => m.price).length;
  const variantLabel = isHotel ? 'Room Type' : 'Service Option / Rate';

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col animate-in fade-in duration-700">
      
      {/* ── Top Header ── */}
      <div className="w-full bg-white border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="text-red-600 w-6 h-6" />
            Price Manager
          </h1>
          <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">
            Institutional Inventory Control
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sync Status</p>
            <p className="text-[10px] font-bold text-green-600">Active Overrides</p>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
             <LayoutGrid className="text-slate-400 w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
      {/* ── Control Panel ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 1: Service Type */}
        <div className="bg-white rounded-2xl border border-slate-300 p-5 shadow-sm transition-all hover:border-slate-400">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">1 · Category</label>
          <div className="relative group">
            <select 
              value={filterType || ''}
              onChange={e => {
                setFilterType(e.target.value);
                setSelectedSvc(null);
                setSelectedVar(null);
              }}
              className="w-full text-xs border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red bg-white text-slate-800 font-bold appearance-none cursor-pointer transition-all hover:bg-slate-50">
              <option value="">All Categories</option>
              {categories.filter(cat => cat.name.toUpperCase() !== 'FLIGHT').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-red-500 transition-colors">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* 2: Service Selection */}
        <div className="bg-white rounded-2xl border border-slate-300 p-5 shadow-sm transition-all hover:border-slate-400">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">2 · Service</label>
          
          <div className="mb-3 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              value={svcSearch}
              onChange={e => setSvcSearch(e.target.value)}
              className="w-full text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="relative group">
            <select value={selectedSvc?.id || ''}
              onChange={e => {
                const svc = services.find(s => s.id === e.target.value);
                setSelectedSvc(svc);
                setSelectedMealPlan({ id: 'base', label: 'Base Rate' });
              }}
              className="w-full text-xs border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red bg-white text-slate-800 font-bold appearance-none cursor-pointer transition-all hover:bg-slate-50">
              <option value="">{filterType ? 'Select from category...' : 'Choose Service...'}</option>
              {services
                .filter(s => (!filterType || s.service_categories?.some(sc => sc.category_id === filterType)) && 
                        (!svcSearch || s.name.toLowerCase().includes(svcSearch.toLowerCase())))
                .slice(0, 200)
                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-red-500 transition-colors">
              <ChevronDown size={16} />
            </div>
          </div>
          {svcSearch && (
             <p className="mt-2 text-[9px] text-slate-400 italic">Showing matches for &quot;{svcSearch}&quot;</p>
          )}

          {selectedSvc && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pricing Engine Model</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPricingModelOverride('hotel')}
                  className={cn(
                    "py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5",
                    isHotel 
                      ? "bg-slate-900 text-white shadow-sm font-black" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 font-bold"
                  )}
                >
                  🏨 Hotel Model
                </button>
                <button
                  type="button"
                  onClick={() => setPricingModelOverride('activity')}
                  className={cn(
                    "py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5",
                    !isHotel 
                      ? "bg-slate-900 text-white shadow-sm font-black" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 font-bold"
                  )}
                >
                  🎟️ Activity Model
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3: Variant Selection */}
        <div className="bg-white rounded-2xl border border-slate-300 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">3 · {variantLabel}</label>
             <button onClick={() => setShowAddVariant(!showAddVariant)} className="p-1 hover:bg-red-50 text-brand-red rounded-lg transition">
               <Plus size={16} />
             </button>
          </div>
          {selectedSvc && (
            <>
              {showAddVariant && (
                <div className="flex gap-1.5 mb-2">
                  <input value={newVariantName} onChange={e => setNewVariantName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddVariant()}
                    placeholder={`New ${variantLabel}…`}
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-red" />
                  <button onClick={handleAddVariant} disabled={addingVariant}
                    className="px-3 py-1.5 bg-brand-red text-white rounded-lg text-xs font-bold hover:bg-red-700 transition disabled:opacity-50">
                    Add
                  </button>
                </div>
              )}
              {variants.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  No {variantLabel.toLowerCase()}s. Click + to add one.
                </p>
              ) : (
                <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {variants.map(v => (
                    <button
                      key={v.id || 'base-variant'}
                      onClick={() => {
                        console.log('[PriceManager] Selecting Variant:', v.name, v.id);
                        handleSelectVar(v);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group
                        ${selectedVar?.id === v.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{v.name}</p>
                          <p className={`text-[9px] ${selectedVar?.id === v.id ? 'text-slate-400' : 'text-slate-400'}`}>
                             Base: Rs {fmt(v.weekday_price)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={12} className={`transition-transform duration-300 ${selectedVar?.id === v.id ? 'translate-x-1 opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 4: Meal Plan (Absolute Pricing) */}
        {isHotel && (
          <div className="bg-white rounded-2xl border border-slate-300 p-4 shadow-sm animate-in slide-in-from-right duration-500">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">4 · Meal Plan</label>
            <div className="relative group">
              <select 
                value={selectedMealPlan?.id || 'base'}
                onChange={e => {
                  if (e.target.value === 'base') setSelectedMealPlan({ id: 'base', label: 'Base Rate' });
                  else {
                    const mp = selectedSvc.meal_plans?.find(m => m.id === e.target.value);
                    setSelectedMealPlan(mp);
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800 font-bold appearance-none cursor-pointer transition-all hover:bg-slate-50">
                <option value="base">Base Rate (Room Only / Supplements)</option>
                {(selectedSvc.meal_plans || [])
                  .map(mp => (
                    <option key={mp.id} value={mp.id}>{mp.label} (Absolute Price)</option>
                  ))
                }
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <Utensils size={14} className="shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-tight leading-tight">
                {selectedMealPlan?.id === 'base' 
                  ? "Standard Room Rates. Meal supplements are additives." 
                  : `Absolute rates for ${selectedMealPlan?.label}. Base supplements ignored.`}
              </p>
            </div>
          </div>
        )}

        {/* 5: Year */}
        <div className="bg-white rounded-2xl border border-slate-300 p-4 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">5 · Year</label>
          <select value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-red bg-white text-slate-800 font-semibold appearance-none cursor-pointer">
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Ready: show grid ── */}
      {selectedSvc && selectedVar ? (
        <div className="space-y-8">
          {/* ── Bulk Fill ── */}
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-500">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => setIsBulkOpen(!isBulkOpen)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20">
                  <LayoutGrid size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Bulk Propagation Tool</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Apply fixed rates to all 12 months</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isBulkOpen ? (
                   <button onClick={(e) => { e.stopPropagation(); applyBulk(); }}
                    className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition shadow-lg shadow-red-900/50">
                    <CheckCircle2 size={12} /> Sync All Months
                  </button>
                ) : null}
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  {isBulkOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isBulkOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-800"
                >
                  <div className="p-8 space-y-8">
                    {/* Occupancy / Base Prices Grid */}
                    <div className="flex flex-col gap-6">
                      {isHotel ? (
                        <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-inner">
                           <div className="flex items-center gap-3 mb-4">
                             <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                               <LayoutGrid className="w-4 h-4 text-red-500" />
                             </div>
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Global Occupancy Matrix</h4>
                           </div>
                           <PaxMatrix 
                             tiers={bulk.tiers}
                             onChange={(k, f, v) => setBulk(prev => {
                               const tiers = { ...prev.tiers };
                               tiers[k] = { ...tiers[k], [f]: v };
                               return { ...prev, tiers };
                             })}
                             maxAdults={selectedVar?.max_adults || 3}
                             dark={true}
                           />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {AGE_GROUPS.map(g => (
                            <div key={g.key} className="flex flex-col gap-2 bg-slate-800 p-4 rounded-2xl border border-slate-700 group hover:border-red-600/30 transition-all">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{g.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-600 italic">MUR</span>
                                <input type="number" value={bulk[g.key]}
                                  onChange={e => setBulk(prev => ({ ...prev, [g.key]: e.target.value }))}
                                  placeholder="0"
                                  className="w-full bg-transparent text-white text-base font-black outline-none placeholder-slate-700" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-8 border-t border-slate-800">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <Banknote className="w-3.5 h-3.5 text-green-500" /> Agency Service Fee
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                         <label className="text-[10px] font-black uppercase text-slate-500">Global Service Fee (%)</label>
                         <div className="flex items-center gap-3">
                            <span className="text-white font-black text-sm">%</span>
                            <input 
                              type="number" 
                              step="0.1"
                              min="0"
                              value={bulk.service_fee}
                              onChange={e => setBulk(prev => ({ ...prev, service_fee: e.target.value }))}
                              placeholder="Default (Service/Room Level)"
                              className="w-full bg-transparent text-white text-sm font-bold outline-none placeholder-slate-600"
                            />
                         </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800">
                      <MealSupplementList 
                        sups={bulkMeals}
                        onAdd={() => setBulkMeals(prev => [...prev, { label: '', adult: '', teen: '', child: '', infant: '' }])}
                        onUpdate={(mIdx, f, v) => {
                          const newMeals = [...bulkMeals];
                          newMeals[mIdx] = { ...newMeals[mIdx], [f]: v };
                          setBulkMeals(newMeals);
                        }}
                        onRemove={(mIdx) => setBulkMeals(prev => prev.filter((_, i) => i !== mIdx))}
                        dark={true}
                        mealPlans={selectedSvc?.meal_plans || []}
                      />
                    </div>

                    {/* Inventory & Availability Bulk Form */}
                    <div className="pt-8 border-t border-slate-800">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <ShieldOff className="w-3.5 h-3.5 text-orange-500" /> Inventory & Controls
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                           <label className="text-[10px] font-black uppercase text-slate-500">Global Stop-Sell</label>
                           <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">Close all dates to new bookings</span>
                              <button 
                                onClick={() => setBulk(prev => ({ ...prev, is_stop_sell: prev.is_stop_sell === true ? null : true }))}
                                className={cn(
                                  "w-12 h-6 rounded-full transition-all relative",
                                  bulk.is_stop_sell === true ? "bg-red-600" : "bg-slate-700"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-1 bg-white w-4 h-4 rounded-full transition-all",
                                  bulk.is_stop_sell === true ? "left-7" : "left-1"
                                )} />
                              </button>
                           </div>
                        </div>
                        <div className="flex flex-col gap-2 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                           <label className="text-[10px] font-black uppercase text-slate-500">Units Available</label>
                           <div className="flex items-center gap-3">
                              <Box className="w-4 h-4 text-slate-500" />
                              <input 
                                type="number" 
                                value={bulk.units_available}
                                onChange={e => setBulk(prev => ({ ...prev, units_available: e.target.value }))}
                                placeholder="e.g. 5"
                                className="w-full bg-transparent text-white text-sm font-bold outline-none placeholder-slate-600"
                              />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            {grid.map((m, mi) => (
              <div key={mi} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-500 hover:border-slate-300 group">
                <div className="p-6 flex items-center justify-between gap-6 bg-white">
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-slate-900 transition-colors">
                      <span className="text-xs font-black text-slate-900">{m.name.slice(0, 3).toUpperCase()}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{m.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{year}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    {isHotel ? (
                      <PaxMatrix 
                        tiers={m.tiers} 
                        onChange={(k, f, v) => updateMonth(mi, f, v, k)}
                        maxAdults={selectedVar?.max_adults || 3}
                      />
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {AGE_GROUPS.map(g => (
                          <div key={g.key} className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase w-8">{g.label.slice(0, 3)}</span>
                            <input 
                              type="number" 
                              value={m[g.key]} 
                              onChange={e => updateMonth(mi, g.key, e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-[11px] font-black text-slate-900 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            type="button" 
                            onClick={() => {
                               copyMonthToDays(mi);
                               if (!m.expanded) toggleMonth(mi);
                            }}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition shadow-sm"
                            title="Sync these prices to all days in this month"
                          >
                            <LayoutGrid size={16} />
                          </button>

                          <button type="button" onClick={() => toggleMonth(mi)}
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition border shadow-sm",
                              m.expanded 
                                ? 'text-red-600 bg-red-50 border-red-100' 
                                : 'text-slate-900 bg-white border-slate-300 hover:border-slate-900'
                            )}>
                            {m.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {m.expanded ? 'CLOSE' : 'EDIT'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {m.expanded && (
                         <div className="bg-white border-t border-slate-200 animate-in slide-in-from-top-4 duration-500">
                          <div className="px-8 py-8">
                            <MealSupplementList 
                              sups={m.meal_supplements}
                              onAdd={() => addMealSupplement(mi)}
                              onUpdate={(mealIdx, f, v) => updateMealSupplement(mi, null, mealIdx, f, v)}
                              onRemove={(mealIdx) => removeMealSupplement(mi, null, mealIdx)}
                              mealPlans={selectedSvc?.meal_plans || []}
                            />

                            {/* Monthly Details Controls */}
                            <div className="mt-6 flex flex-wrap gap-4 p-4 bg-white border border-slate-300 rounded-2xl">
                               <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                                  <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                                  <button 
                                    onClick={() => updateMonth(mi, 'is_stop_sell', !m.is_stop_sell)}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all",
                                      m.is_stop_sell 
                                        ? "bg-red-50 border-red-200 text-red-600" 
                                        : "bg-green-50 border-green-200 text-green-700"
                                    )}
                                  >
                                    <ShieldOff size={12} />
                                    {m.is_stop_sell ? 'STOP-SELL ACTIVE' : 'OPEN'}
                                  </button>
                               </div>
                               <div className="flex items-center gap-3">
                                  <label className="text-[10px] font-black uppercase text-slate-400">Units</label>
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Box size={12} className="text-slate-400" />
                                    <input 
                                      type="number" 
                                      value={m.units_available}
                                      onChange={e => updateMonth(mi, 'units_available', e.target.value)}
                                      placeholder="Unlimited"
                                      className="w-16 bg-transparent text-[11px] font-bold outline-none"
                                    />
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                                   <label className="text-[10px] font-black uppercase text-slate-400">Service Fee (%)</label>
                                   <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl">
                                     <span className="text-red-500 font-black text-[10px]">%</span>
                                     <input 
                                       type="number" 
                                       step="0.1"
                                       min="0"
                                       value={m.service_fee ?? ''}
                                       onChange={e => updateMonth(mi, 'service_fee', e.target.value)}
                                       placeholder="Default"
                                       className="w-16 bg-transparent text-[11px] font-black text-red-600 outline-none placeholder-red-200"
                                     />
                                   </div>
                                </div>
                             </div>
                          </div>
 
                          <div className="grid items-center px-8 py-3 dark:bg-slate-950 bg-slate-900 border-y border-white/5"
                            style={{ gridTemplateColumns: isHotel ? 'minmax(120px, 1fr) 4fr 120px' : 'minmax(120px, 1.2fr) 1fr 1fr 1fr 1fr minmax(140px, 1.5fr) 60px' }}>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Individual Date</span>
                            {isHotel ? (
                              <div className="grid grid-cols-5 gap-3">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Occupancy</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Adult</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Teen</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Child</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Infant</span>
                              </div>
                            ) : (
                              AGE_GROUPS.map(g => (
                                <span key={g.key} className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                  {g.label}
                                </span>
                              ))
                            )}
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Status</span>
                          </div>

                          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
                            {m.days.map((d, di) => {
                              const hasOverride = AGE_GROUPS.some(g => d[g.key] !== '' && d[g.key] !== m[g.key]);
                              return (
                                <div key={di}
                                  className={cn(
                                    "flex flex-col transition-colors",
                                    di % 2 === 1 ? 'bg-slate-50/40' : 'bg-white',
                                    hasOverride ? 'bg-red-50/30' : ''
                                  )}>
                                  
                                  <div 
                                    className="grid items-center gap-4 px-8 py-3"
                                    style={{ gridTemplateColumns: isHotel ? 'minmax(120px, 1fr) 4fr 120px' : 'minmax(120px, 1.2fr) 1fr 1fr 1fr 1fr minmax(140px, 1.5fr) 60px' }}>

                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-xs font-black text-slate-900 w-6">{d.day}</span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                        {new Date(year, mi, d.day).toLocaleDateString('en-US', { weekday: 'short' })}
                                      </span>
                                    </div>

                                    {isHotel ? (
                                      <div className="py-2">
                                        <PaxMatrix 
                                          tiers={d.tiers} 
                                          onChange={(k, f, v) => updateDay(mi, di, f, v, k)}
                                          maxAdults={selectedVar?.max_adults || 3}
                                          hideHeaders={true}
                                        />
                                      </div>
                                    ) : (
                                      AGE_GROUPS.map(g => (
                                        <div key={g.key} className="px-2">
                                          <input 
                                            type="number" 
                                            value={d[g.key]} 
                                            onChange={e => updateDay(mi, di, g.key, e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-transparent text-[11px] font-black text-slate-900 outline-none border-b border-transparent focus:border-slate-300"
                                          />
                                        </div>
                                      ))
                                    )}

                                    <div className="flex flex-col gap-2 items-end">
                                       <button 
                                        onClick={() => updateDay(mi, di, 'is_stop_sell', !d.is_stop_sell)}
                                        className={cn(
                                          "w-fit px-2 py-1 rounded-lg border text-[8px] font-black transition-all",
                                          d.is_stop_sell 
                                            ? "bg-red-50 border-red-200 text-red-600 ring-2 ring-red-100" 
                                            : "bg-slate-50 border-slate-200 text-slate-400"
                                        )}
                                        title={d.is_stop_sell ? 'Stop-Sell Active' : 'Available'}
                                      >
                                        <ShieldOff size={10} />
                                      </button>
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                         <Box size={10} className="text-slate-400" />
                                         <input 
                                            type="number" 
                                            value={d.units_available}
                                            onChange={e => updateDay(mi, di, 'units_available', e.target.value)}
                                            placeholder="∞"
                                            className="w-8 bg-transparent text-[9px] font-black outline-none"
                                         />
                                      </div>
                                       <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded-lg shadow-sm">
                                          <span className="text-[10px] font-black text-red-500">%</span>
                                          <input 
                                             type="number" 
                                             step="0.1"
                                             min="0"
                                             value={d.service_fee ?? ''}
                                             onChange={e => updateDay(mi, di, 'service_fee', e.target.value)}
                                             placeholder="Fee"
                                             className="w-8 bg-transparent text-[9px] font-black text-red-600 outline-none placeholder-red-200"
                                          />
                                       </div>
                                    </div>
                                    <div className="flex justify-end">
                                      {(AGE_GROUPS.some(g => d[g.key] !== '') || 
                                        (isHotel && Object.keys(d.tiers || {}).some(k => Object.values(d.tiers[k]).some(v => v !== ''))) ||
                                        (d.meal_supplements && d.meal_supplements.length > 0) ||
                                        d.is_stop_sell) && (
                                        <button onClick={() => {
                                          // Clear base age groups
                                          AGE_GROUPS.forEach(g => updateDay(mi, di, g.key, ''));
                                          // Clear stop sell
                                          updateDay(mi, di, 'is_stop_sell', false);
                                          // Clear tiers if hotel
                                          if (isHotel) {
                                            setGrid(prev => prev.map((month, mIdx) => {
                                              if (mIdx !== mi) return month;
                                              const days = [...month.days];
                                              days[di] = { ...days[di], tiers: {}, meal_supplements: [] };
                                              return { ...month, days };
                                            }));
                                          } else {
                                            // Clear meal supplements for non-hotels too
                                            setGrid(prev => prev.map((month, mIdx) => {
                                              if (mIdx !== mi) return month;
                                              const days = [...month.days];
                                              days[di] = { ...days[di], meal_supplements: [] };
                                              return { ...month, days };
                                            }));
                                          }
                                        }} className="text-slate-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-md" title="Clear all overrides for this day">
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Day Specific Meal Supplements */}
                                  <div className="px-8 pb-4">
                                    <MealSupplementList 
                                      sups={d.meal_supplements}
                                      onAdd={() => addMealSupplement(mi, di)}
                                      onUpdate={(mealIdx, f, v) => updateMealSupplement(mi, di, mealIdx, f, v)}
                                      onRemove={(mealIdx) => removeMealSupplement(mi, di, mealIdx)}
                                      mealPlans={selectedSvc?.meal_plans || []}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                   </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Bottom Save Bar ── */}
          <div className="sticky bottom-8 z-20 flex items-center justify-between bg-slate-900 rounded-3xl px-8 py-5 shadow-2xl border border-white/5 mx-auto">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-red-600 rounded-xl">
                 <Save size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Context</p>
                <p className="text-sm font-black text-white">
                  {selectedSvc?.name} <span className="text-slate-500 mx-2">/</span> {selectedVar?.name} <span className="text-slate-500 mx-2">/</span> {year}
                </p>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || loading}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 text-white text-sm font-black hover:bg-red-700 transition shadow-xl shadow-red-900/40 disabled:opacity-50 group">
              {saving ? 'Synchronizing…' : `Deploy ${year} Rates`}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-200">
            <Banknote size={32} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Financial Hub Inactive</h3>
          <p className="text-xs font-bold text-slate-400 max-w-sm uppercase tracking-widest leading-relaxed">
            Specify classification, service, and {variantLabel?.toLowerCase() || 'variant'} to initialize pricing controls
          </p>
        </div>
      )}
    </div>
  </div>
  );
};
export default PriceManager;
