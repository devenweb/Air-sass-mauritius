import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Hotel, Ship, Map, PackageCheck, Palmtree,
  Trash2, Plus, Save, RefreshCw, LayoutGrid, Info, ChevronRight, Settings2, DoorOpen, Utensils, X, Edit2
} from 'lucide-react';
import { showAlert, showConfirm } from '../utils/swal';
import ImageUpload from '../components/ImageUpload';

const SERVICE_TYPES = [
  { value: 'hotel',       label: 'Hotels',           icon: Hotel },
  { value: 'tour',        label: 'Group Tours',      icon: Map },
  { value: 'cruise',      label: 'Cruises',          icon: Ship },
  { value: 'activity',    label: 'Activities',       icon: PackageCheck },
  { value: 'sea_activity', label: 'Sea Activities',   icon: Ship },
  { value: 'land_activity', label: 'Land Activities',  icon: Map },
  { value: 'packages',    label: 'Travel Packages',  icon: PackageCheck },
  { value: 'land_package', label: 'Land Packages',    icon: PackageCheck },
  { value: 'day_package', label: 'Day Packages',     icon: PackageCheck },
  { value: 'evening_package', label: 'Evening Packages', icon: PackageCheck },
  { value: 'rodrigues',   label: 'Rodrigues',        icon: Palmtree },
];

const CONFIG_LABELS = {
  hotel: {
    mainLabel: 'Room Type Name',
    mainPlaceholder: 'e.g. Deluxe Sea View Suite',
    subtext: 'Enter a descriptive name for the new room type.',
    buttonLabel: 'Create Room',
    updateLabel: 'Update Room'
  },
  rodrigues: {
    mainLabel: 'Room Type Name',
    mainPlaceholder: 'e.g. Deluxe Sea View Suite',
    subtext: 'Enter a descriptive name for the new room type or guesthouse stay.',
    buttonLabel: 'Create Room',
    updateLabel: 'Update Room'
  },
  tour: {
    mainLabel: 'Tour Variant Name',
    mainPlaceholder: 'e.g. Full Day Private Tour',
    subtext: 'Enter a name for this specific tour option or itinerary variant.',
    buttonLabel: 'Create Tour Option',
    updateLabel: 'Update Option'
  },
  cruise: {
    mainLabel: 'Cabin Type Name',
    mainPlaceholder: 'e.g. Ocean View Suite - Deck 5',
    subtext: 'Enter the name of the cabin category or deck option.',
    buttonLabel: 'Create Cabin',
    updateLabel: 'Update Cabin'
  },
  activity: {
    mainLabel: 'Activity Option Name',
    mainPlaceholder: 'e.g. Entrance + Guided Walk + Lunch',
    subtext: 'Enter a name for this specific activity package or entrance tier.',
    buttonLabel: 'Create Option',
    updateLabel: 'Update Option'
  },
  day_package: {
    mainLabel: 'Variant Name',
    mainPlaceholder: 'e.g. Gold All-Inclusive Day Pass',
    subtext: 'Enter a name for this day package variant.',
    buttonLabel: 'Create Variant',
    updateLabel: 'Update Variant'
  },
  evening_package: {
    mainLabel: 'Evening Option Name',
    mainPlaceholder: 'e.g. VIP Dinner & Cultural Show',
    subtext: 'Enter a name for this specific evening experience.',
    buttonLabel: 'Create Option',
    updateLabel: 'Update Option'
  },
  sea_activity: {
    mainLabel: 'Sea Activity Option',
    mainPlaceholder: 'e.g. Private Boat + Snorkeling',
    subtext: 'Enter a name for this specific sea activity variant.',
    buttonLabel: 'Create Option',
    updateLabel: 'Update Option'
  },
  land_activity: {
    mainLabel: 'Land Activity Option',
    mainPlaceholder: 'e.g. Quad Bike + Safari',
    subtext: 'Enter a name for this specific land activity variant.',
    buttonLabel: 'Create Option',
    updateLabel: 'Update Option'
  },
  land_package: {
    mainLabel: 'Itinerary Name',
    mainPlaceholder: 'e.g. 5-Day Explorer Bundle',
    subtext: 'Enter a name for this land itinerary variant.',
    buttonLabel: 'Create Itinerary',
    updateLabel: 'Update Itinerary'
  },
  packages: {
    mainLabel: 'Itinerary Name',
    mainPlaceholder: 'e.g. West Malaysia - Kuala Lumpur - Sunway',
    subtext: 'Enter a name for this specific package itinerary or route.',
    buttonLabel: 'Create Itinerary',
    updateLabel: 'Update Itinerary'
  },
  default: {
    mainLabel: 'Configuration Name',
    mainPlaceholder: 'e.g. Standard Option',
    subtext: 'Enter a descriptive name for this service option.',
    buttonLabel: 'Create Configuration',
    updateLabel: 'Update Configuration'
  }
};

/*
const AGE_GROUPS = [
  { key: 'max_adults',   label: 'Adult',   range: '18+',   color: 'red',    icon: Users },
  { key: 'max_teens',    label: 'Teen',    range: '12–17', color: 'amber',  icon: Users },
  { key: 'max_children', label: 'Child',   range: '3–11',  color: 'blue',   icon: Users },
  { key: 'max_infants',  label: 'Infant',  range: '0–2',   color: 'purple', icon: Baby  },
];
*/

const RoomManager = () => {
  // Selection state
  const [serviceType, setServiceType] = useState('hotel');
  const [services, setServices] = useState([]);
  const [selectedSvc, setSelectedSvc] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [savingRoomId, setSavingRoomId] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [editingRoomData, setEditingRoomData] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomAdults, setNewRoomAdults] = useState(1);
  const [newRoomTeens, setNewRoomTeens] = useState(0);
  const [newRoomChildren, setNewRoomChildren] = useState(0);
  const [newRoomInfants, setNewRoomInfants] = useState(0);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);
  const [mealPlans, setMealPlans] = useState([]);
  const [savingMealPlans, setSavingMealPlans] = useState(false);

  // Load services for selected type
  useEffect(() => {
    if (!serviceType) return;
    
    const fetchServices = async () => {
      setLoading(true);
      let query = supabase
        .from('services')
        .select('id, name, service_type, room_types, meal_plans')
        .eq('is_active', true);
      
      if (serviceType === 'rodrigues') {
        query = query.eq('region', 'Rodrigues');
      } else {
        query = query.eq('service_type', serviceType);
      }
      
      const { data, error } = await query.order('name');
      
      if (!error) {
        setServices(data || []);
        if (data && data.length > 0) {
          // Keep current selection if possible, else select first
          if (!selectedSvc || !data.find(s => s.id === selectedSvc.id)) {
            // We don't auto-select here to avoid chain reactions if not desired, 
            // but for USability let's select none first.
            setSelectedSvc(null);
            setRoomTypes([]);
          }
        } else {
          setSelectedSvc(null);
          setRoomTypes([]);
        }
      }
      setLoading(false);
    };

    fetchServices();
  }, [serviceType]);

  // Load room types for selected service
  const fetchRooms = async () => {
    if (!selectedSvc) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('service_id', selectedSvc.id)
      .order('name');
    
    if (!error) {
      let fetched = data || [];
      
      // AUTO-SYNC: If no rooms found in table, but service has JSONB room_types, import them.
      if (fetched.length === 0 && selectedSvc.service_type === 'hotel' && selectedSvc.room_types?.length > 0) {
        setLoading(true);
        const toInsert = selectedSvc.room_types.map(rt => {
          const adults = rt.max_adults ?? rt.adults ?? rt.pax ?? 2;
          const occupancy = rt.max_occupancy ?? (adults + (rt.max_children || 0) + (rt.max_teens || 0));
          return {
            service_id: selectedSvc.id,
            name: rt.type || rt.name || 'Unnamed Room',
            max_adults: adults,
            max_children: rt.max_children || 0,
            max_teens: rt.max_teens || 0,
            max_infants: 0,
            max_occupancy: occupancy,
            min_stay_days: rt.min_stay || 1,
          };
        });

        const { data: synced, error: syncErr } = await supabase
          .from('room_types')
          .insert(toInsert)
          .select();
        
        if (!syncErr) {
          fetched = synced || [];
        }
      }

      setRoomTypes(fetched);
      setMealPlans(selectedSvc.meal_plans || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedSvc]);

  const handleUpdateRoom = async (room) => {
    const targetRoom = room || editingRoomData;
    if (!targetRoom) return;
    
    setSavingRoomId(targetRoom.id);
    const { error } = await supabase
      .from('room_types')
      .update({
        name: targetRoom.name,
        max_adults: parseInt(targetRoom.max_adults, 10) || 0,
        max_teens: parseInt(targetRoom.max_teens, 10) || 0,
        max_children: parseInt(targetRoom.max_children, 10) || 0,
        max_infants: parseInt(targetRoom.max_infants, 10) || 0,
        max_occupancy: parseInt(targetRoom.max_occupancy, 10) || 0,
        min_stay_days: parseInt(targetRoom.min_stay_days, 10) || 1,
        image_url: targetRoom.image_url,
        meal_plan: targetRoom.meal_plan,
        service_fee: parseFloat(targetRoom.service_fee) || 0,
        description: targetRoom.description
      })
      .eq('id', targetRoom.id);

    if (error) {
      console.error("Room update error:", error);
      showAlert('Error', `Failed to update configuration: ${error.message}`, 'error');
    } else {
      showAlert('Success', 'Configuration updated', 'success');
      setRoomTypes(prev => prev.map(r => r.id === targetRoom.id ? targetRoom : r));
      setShowEditRoom(false);
    }
    setSavingRoomId(null);
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim() || !selectedSvc) return;
    setAddingRoom(true);
    const { data, error } = await supabase
      .from('room_types')
      .insert({
        service_id: selectedSvc.id,
        name: newRoomName.trim(),
        max_adults: newRoomAdults,
        max_teens: newRoomTeens,
        max_children: newRoomChildren,
        max_infants: newRoomInfants,
        max_occupancy: newRoomAdults + newRoomTeens + newRoomChildren + newRoomInfants,
        service_fee: 0,
        min_stay_days: 1,
        description: newRoomDescription.trim()
      })
      .select()
      .single();

    if (error) {
      showAlert('Error', 'Failed to add room type', 'error');
    } else {
      setRoomTypes(prev => [...prev, data]);
      setNewRoomName('');
      setNewRoomAdults(2);
      setNewRoomTeens(0);
      setNewRoomChildren(0);
      setNewRoomInfants(0);
      setNewRoomDescription('');
      setShowAddRoom(false);
      showAlert('Added', 'New room type added successfully', 'success');
    }
    setAddingRoom(false);
  };

  const handleDeleteRoom = async (room) => {
    const res = await showConfirm('Delete Room Type', `Are you sure you want to delete "${room.name}"? This will also remove its associated pricing records.`);
    if (res.isConfirmed) {
      const { error } = await supabase.from('room_types').delete().eq('id', room.id);
      if (error) {
        showAlert('Error', 'Failed to delete room type', 'error');
      } else {
        setRoomTypes(prev => prev.filter(r => r.id !== room.id));
        showAlert('Deleted', 'Room type removed', 'success');
      }
    }
  };

  const updateRoomLocal = (id, field, value) => {
    setRoomTypes(prev => prev.map(r => {
      if (r.id !== id) return r;
      
      const val = ['image_url', 'meal_plan', 'description', 'name'].includes(field) 
        ? value 
        : (field === 'service_fee' ? parseFloat(value) || 0 : (value === '' ? 0 : parseInt(value)));
      
      const updated = { ...r, [field]: val };
      
      // Auto-recalculate max_occupancy if any count field changed
      if (['max_adults', 'max_teens', 'max_children', 'max_infants'].includes(field)) {
        updated.max_occupancy = (updated.max_adults || 0) + 
                               (updated.max_teens || 0) + 
                               (updated.max_children || 0) + 
                               (updated.max_infants || 0);
      }
      
      return updated;
    }));
  };

  const updateRoomNameLocal = (id, value) => {
    setRoomTypes(prev => prev.map(r => 
      r.id === id ? { ...r, name: value } : r
    ));
  };

  const handleUpdateMealPlans = async () => {
    if (!selectedSvc) return;
    setSavingMealPlans(true);
    const { error } = await supabase
      .from('services')
      .update({ meal_plans: mealPlans })
      .eq('id', selectedSvc.id);

    if (error) {
      showAlert('Error', 'Failed to update meal plans', 'error');
    } else {
      showAlert('Success', 'Meal plans updated', 'success');
      // Update the selectedSvc in state too
      setServices(prev => prev.map(s => s.id === selectedSvc.id ? { ...s, meal_plans: mealPlans } : s));
      setSelectedSvc(prev => prev ? { ...prev, meal_plans: mealPlans } : null);
    }
    setSavingMealPlans(false);
  };

  const addMealPlan = () => {
    setMealPlans(prev => [...prev, { id: Date.now().toString(), label: '' }]);
  };

  const removeMealPlan = (id) => {
    setMealPlans(prev => prev.filter(m => m.id !== id));
  };

  const updateMealPlan = (id, field, value) => {
    setMealPlans(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Settings2 size={24} className="text-brand-red" />
            Service Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Define occupancy limits, age groups, and pricing configurations for your catalog.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[8px]">1</span>
            Service Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setServiceType(type.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  serviceType === type.value 
                  ? 'bg-red-50 border-brand-red text-brand-red shadow-sm' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                }`}
              >
                <type.icon size={20} className="mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Service */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[8px]">2</span>
            Select {serviceType || 'Service'}
          </label>
          {loading && services.length === 0 ? (
            <div className="animate-pulse space-y-2">
              <div className="h-10 bg-slate-50 rounded-xl" />
            </div>
          ) : (
            <div className="relative">
              <select 
                value={selectedSvc?.id || ''}
                onChange={(e) => setSelectedSvc(services.find(s => s.id === e.target.value))}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-red appearance-none cursor-pointer"
              >
                <option value="">— Select from {services.length} items —</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={16} />
              </div>
            </div>
          )}
          {!selectedSvc && services.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <Info size={14} className="shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-tight">Please select a {serviceType} to view configurations</p>
            </div>
          )}
        </div>
      </div>

      {/* Room Types Grid */}
      {selectedSvc && (
        <div className="space-y-4">
          {/* Meal Plans Section */}
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                  Meal Plans Available
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">List the meal plans supported by this hotel</p>
              </div>
              <button 
                onClick={addMealPlan}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-amber-600 transition-all shadow-md"
              >
                <Plus size={14} /> Add Meal Plan
              </button>
            </div>
            
            <div className="p-8">
              {mealPlans.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Utensils size={24} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No meal plans configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mealPlans.map((meal) => (
                    <div key={meal.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-5 bg-slate-50 border border-slate-200 rounded-[24px] relative group">
                      <button 
                        onClick={() => removeMealPlan(meal.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                      
                      <div className="md:col-span-4">
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block ml-1">Plan Name</label>
                        <input 
                          value={meal.label}
                          onChange={(e) => updateMealPlan(meal.id, 'label', e.target.value)}
                          placeholder="e.g. Half Board"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-6 mt-4 border-t border-slate-100">
                <button 
                  onClick={handleUpdateMealPlans}
                  disabled={savingMealPlans}
                  className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {savingMealPlans ? (
                    <><RefreshCw size={16} className="animate-spin" /> Syncing...</>
                  ) : (
                    <><Save size={16} /> Save Meal Plans</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <DoorOpen size={18} className="text-blue-600" />
              Available Configurations ({roomTypes.length})
            </h2>
            {selectedSvc && (
              <button 
                onClick={() => setShowAddRoom(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
              >
                <Plus size={14} /> Add {(CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).buttonLabel.replace('Create ', '')}
              </button>
            )}
          </div>

          {roomTypes.length === 0 && !loading ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <LayoutGrid size={32} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-400 italic">No configurations found</h3>
              <p className="text-xs text-slate-300 mt-2">Add your first room type to get started.</p>
              <button 
                onClick={() => setShowAddRoom(true)}
                className="mt-6 flex items-center gap-2 text-brand-red font-black text-xs hover:underline"
              >
                <Plus size={14} /> Create One Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Media</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Configuration Name</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-red-500 border-b border-slate-100 text-center">Adults</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 text-center">Teens</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-blue-500 border-b border-slate-100 text-center">Children</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-purple-500 border-b border-slate-100 text-center">Infants</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">Total Max</th>
                      {(serviceType === 'hotel' || serviceType === 'rodrigues') && (
                        <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">Min Stay</th>
                      )}
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-brand-red border-b border-slate-100 text-center">Fee (%)</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {roomTypes.map(room => (
                      <tr key={room.id} className="group hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="relative group/img w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                             <ImageUpload
                                value={room.image_url}
                                onChange={(url) => updateRoomLocal(room.id, 'image_url', url)}
                                folder="rooms"
                                hideLabel
                                compact
                             />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <input 
                              value={room.name}
                              onChange={(e) => updateRoomNameLocal(room.id, e.target.value)}
                              className="bg-transparent border-none text-sm font-black text-slate-900 outline-none w-full focus:bg-white focus:ring-1 focus:ring-slate-100 rounded-lg px-2 py-1 -ml-2"
                              placeholder="Room Name"
                            />
                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Utensils size={10} className="text-amber-500" />
                              <input 
                                value={room.meal_plan || ''}
                                onChange={(e) => updateRoomLocal(room.id, 'meal_plan', e.target.value)}
                                className="bg-transparent border-none text-[9px] font-bold text-slate-500 outline-none w-full focus:bg-white focus:ring-1 focus:ring-slate-100 rounded-md px-1"
                                placeholder="Meal plan..."
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            min="0"
                            value={room.max_adults ?? 0}
                            onChange={(e) => updateRoomLocal(room.id, 'max_adults', e.target.value)}
                            className="w-16 mx-auto bg-slate-50 group-hover:bg-white border-none rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center outline-none ring-1 ring-slate-100 focus:ring-red-500 transition-all"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            min="0"
                            value={room.max_teens ?? 0}
                            onChange={(e) => updateRoomLocal(room.id, 'max_teens', e.target.value)}
                            className="w-16 mx-auto bg-slate-50 group-hover:bg-white border-none rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center outline-none ring-1 ring-slate-100 focus:ring-amber-500 transition-all"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            min="0"
                            value={room.max_children ?? 0}
                            onChange={(e) => updateRoomLocal(room.id, 'max_children', e.target.value)}
                            className="w-16 mx-auto bg-slate-50 group-hover:bg-white border-none rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center outline-none ring-1 ring-slate-100 focus:ring-blue-500 transition-all"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            min="0"
                            value={room.max_infants ?? 0}
                            onChange={(e) => updateRoomLocal(room.id, 'max_infants', e.target.value)}
                            className="w-16 mx-auto bg-slate-50 group-hover:bg-white border-none rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center outline-none ring-1 ring-slate-100 focus:ring-purple-500 transition-all"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="w-16 mx-auto bg-slate-100/50 rounded-xl px-3 py-2 text-xs font-black text-slate-400 text-center">
                            {room.max_occupancy}
                          </div>
                        </td>
                        {(serviceType === 'hotel' || serviceType === 'rodrigues') && (
                          <td className="px-4 py-4">
                            <input 
                              type="number"
                              min="1"
                              value={room.min_stay_days || 1}
                              onChange={(e) => updateRoomLocal(room.id, 'min_stay_days', e.target.value)}
                              className="w-16 mx-auto bg-slate-50 group-hover:bg-white border-none rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center outline-none ring-1 ring-slate-100 focus:ring-slate-400 transition-all"
                            />
                          </td>
                        )}
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            min="0"
                            step="0.1"
                            value={room.service_fee ?? 0}
                            onChange={(e) => updateRoomLocal(room.id, 'service_fee', e.target.value)}
                            className="w-16 mx-auto bg-slate-50 group-hover:bg-white border-none rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center outline-none ring-1 ring-slate-100 focus:ring-brand-red transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingRoomData(room);
                                setShowEditRoom(true);
                              }}
                              className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              title="Edit Room Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleUpdateRoom(room)}
                              disabled={savingRoomId === room.id}
                              className={`p-2 rounded-xl transition-all ${
                                savingRoomId === room.id 
                                  ? 'bg-slate-100 text-slate-400' 
                                  : 'bg-slate-900 text-white hover:bg-brand-red shadow-lg'
                              }`}
                              title="Quick Save"
                            >
                              {savingRoomId === room.id ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            </button>
                            <button 
                              onClick={() => handleDeleteRoom(room)}
                              className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Delete Room"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedSvc && !loading && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] py-40 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <DoorOpen size={40} className="text-brand-red opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Select a Service to Manage</h2>
          <p className="text-slate-400 max-w-sm mx-auto mt-2 text-sm">
            Choose a hotel or service from the selection steps above to start refining occupancy configurations.
          </p>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-8 pt-8 pb-6">
                <h3 className="text-xl font-black text-slate-900 mb-2">New Configuration</h3>
                <p className="text-xs text-slate-400 mb-6">{(CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).subtext}</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {(CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).mainLabel}
                    </label>
                    <input 
                      autoFocus
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                      placeholder={(CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).mainPlaceholder}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Itinerary/Variant Description
                    </label>
                    <textarea 
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Enter specific details for this itinerary (e.g. key highlights, specific inclusions)..."
                      rows={3}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red resize-none"
                    />
                  </div>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-red-500">Max Adults</label>
                    <input 
                      type="number"
                      min="0"
                      value={newRoomAdults}
                      onChange={(e) => setNewRoomAdults(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-500">Max Teens</label>
                    <input 
                      type="number"
                      min="0"
                      value={newRoomTeens}
                      onChange={(e) => setNewRoomTeens(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-500">Max Children</label>
                    <input 
                      type="number"
                      min="0"
                      value={newRoomChildren}
                      onChange={(e) => setNewRoomChildren(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-purple-500">Max Infants</label>
                    <input 
                      type="number"
                      min="0"
                      value={newRoomInfants}
                      onChange={(e) => setNewRoomInfants(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                </div>
              </div>
            
            <div className="px-8 pb-8 flex gap-3">
              <button 
                onClick={() => {
                  setShowAddRoom(false);
                  setNewRoomName('');
                  setNewRoomAdults(1);
                  setNewRoomTeens(0);
                  setNewRoomChildren(0);
                  setNewRoomInfants(0);
                }}
                className="flex-1 px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
                <button 
                  onClick={handleAddRoom}
                  disabled={addingRoom || !newRoomName.trim()}
                  className="flex-1 bg-brand-red text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {addingRoom ? 'Adding...' : (CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).buttonLabel}
                </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Room Modal */}
      {showEditRoom && editingRoomData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-8 pt-8 pb-6">
              <h3 className="text-xl font-black text-slate-900 mb-2">Edit Configuration</h3>
              <p className="text-xs text-slate-400 mb-6">Modify the occupancy rules and name for this service option.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {(CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).mainLabel}
                  </label>
                  <input 
                    value={editingRoomData.name}
                    onChange={(e) => setEditingRoomData({...editingRoomData, name: e.target.value})}
                    placeholder={(CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).mainPlaceholder}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-red">Agency Fee (%)</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingRoomData.service_fee || 0}
                    onChange={(e) => setEditingRoomData({...editingRoomData, service_fee: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Itinerary/Variant Description
                  </label>
                  <textarea 
                    value={editingRoomData.description || ''}
                    onChange={(e) => setEditingRoomData({...editingRoomData, description: e.target.value})}
                    placeholder="Enter specific details for this itinerary..."
                    rows={3}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red resize-none"
                  />
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-red-500">Max Adults</label>
                    <input 
                      type="number"
                      min="0"
                      value={editingRoomData.max_adults}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingRoomData({
                          ...editingRoomData, 
                          max_adults: val,
                          max_occupancy: val + (editingRoomData.max_teens || 0) + (editingRoomData.max_children || 0) + (editingRoomData.max_infants || 0)
                        });
                      }}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-500">Max Teens</label>
                    <input 
                      type="number"
                      min="0"
                      value={editingRoomData.max_teens}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingRoomData({
                          ...editingRoomData, 
                          max_teens: val,
                          max_occupancy: (editingRoomData.max_adults || 0) + val + (editingRoomData.max_children || 0) + (editingRoomData.max_infants || 0)
                        });
                      }}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-500">Max Children</label>
                    <input 
                      type="number"
                      min="0"
                      value={editingRoomData.max_children}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingRoomData({
                          ...editingRoomData, 
                          max_children: val,
                          max_occupancy: (editingRoomData.max_adults || 0) + (editingRoomData.max_teens || 0) + val + (editingRoomData.max_infants || 0)
                        });
                      }}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-purple-500">Max Infants</label>
                    <input 
                      type="number"
                      min="0"
                      value={editingRoomData.max_infants}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingRoomData({
                          ...editingRoomData, 
                          max_infants: val,
                          max_occupancy: (editingRoomData.max_adults || 0) + (editingRoomData.max_teens || 0) + (editingRoomData.max_children || 0) + val
                        });
                      }}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-brand-red"
                    />
                  </div>
                </div>
              </div>
            
            <div className="px-8 pb-8 flex gap-3">
              <button 
                onClick={() => {
                  setShowEditRoom(false);
                  setEditingRoomData(null);
                }}
                className="flex-1 px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateRoom()}
                disabled={savingRoomId === editingRoomData.id || !editingRoomData.name.trim()}
                className="flex-1 bg-brand-red text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {savingRoomId === editingRoomData.id ? 'Saving...' : (CONFIG_LABELS[serviceType] || CONFIG_LABELS.default).updateLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManager;
