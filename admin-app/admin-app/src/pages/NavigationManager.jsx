import React, { useState, useEffect } from 'react';
import {
  GripVertical, Plus, Trash2, Save, RefreshCw, 
  ExternalLink, Eye, EyeOff, LayoutTemplate
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert, showConfirm } from '../utils/swal';

// ─── Sortable Item Component ────────────────────────────────────────────────
const SortableNavItem = ({ item, level = 0, onEdit, onDelete, onToggle, onAddSub }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${level * 2}rem`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white border ${isDragging ? 'border-brand-red shadow-2xl' : 'border-slate-300'} rounded-2xl mb-3 overflow-hidden transition-all duration-300 hover:border-slate-300`}
    >
      <div className="flex items-center p-4 gap-4">
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-black text-gray-900 truncate ${level > 0 ? 'text-gray-600' : ''}`}>{item.label}</h3>
            {!item.is_active && (
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-gray-100 text-gray-400 border border-slate-300">Hidden</span>
            )}
            {level > 0 && (
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-red-50 text-red-400 border border-red-100">Submenu</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
            <span className="flex items-center gap-1"><ExternalLink size={10} /> {item.link}</span>
            {item.icon && <span className="flex items-center gap-1 font-mono uppercase bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">[{item.icon}]</span>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddSub(item.id)}
            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
            title="Add Submenu Item"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => onToggle(item)}
            className={`p-2 rounded-xl transition-all ${item.is_active ? 'text-gray-400 hover:text-brand-red hover:bg-red-50' : 'text-brand-red bg-red-50'}`}
            title={item.is_active ? "Hide from Navigation" : "Show in Navigation"}
          >
            {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
            title="Edit Item"
          >
            <LayoutTemplate size={18} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
            title="Remove Item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const NavigationManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ label: '', link: '', icon: '', is_active: true, parent_id: null });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchNavigations();
  }, []);

  const fetchNavigations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('navigations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        if (error.message.includes('relation "public.navigations" does not exist')) {
            showAlert('Wait!', 'The "navigations" table does not exist in your database yet. Please run the SQL migration provided.', 'warning');
            setItems([]);
        } else throw error;
      } else {
        setItems(data || []);
      }
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to load navigation items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flatItems) => {
    const tree = [];
    const map = {};
    
    flatItems.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });
    
    flatItems.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    // Helper to flatten nested tree back for dnd-kit (since dnd-kit works better with flat lists)
    // but with nesting indicators.
    const flattened = [];
    const flatten = (nodes, level = 0) => {
      nodes.forEach(node => {
        flattened.push({ ...node, level });
        if (node.children && node.children.length > 0) {
          flatten(node.children, level + 1);
        }
      });
    };
    flatten(tree);
    return flattened;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        
        // Update display_order based on new array indices
        return newOrder.map((item, index) => ({ ...item, display_order: index + 1 }));
      });
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      // Upsert the entire list with new display_order
      const { error } = await supabase.from('navigations').upsert(
        items.map((item, index) => {
          // Explicitly extract only valid database columns to avoid 
          // sending UI-only fields like 'level' or 'children'
          const { children, level, ...dbItem } = item;
          return {
            ...dbItem,
            display_order: index + 1,
            updated_at: new Date().toISOString()
          };
        }),
        { onConflict: 'id' }
      );
      if (error) throw error;
      showAlert('Success', 'Navigation order saved');
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to save order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const updatePayload = { ...formData, updated_at: new Date().toISOString() };
        const { error } = await supabase
          .from('navigations')
          .update(updatePayload)
          .eq('id', isEditing.id);
        
        if (error) throw error;
        
        setItems(prev => prev.map(i => i.id === isEditing.id ? { ...i, ...formData } : i));
        showAlert('Success', 'Item updated successfully');
      } else {
        const insertPayload = { ...formData, display_order: items.length + 1 };
        const { data, error } = await supabase
          .from('navigations')
          .insert([insertPayload])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setItems(prev => [...prev, data[0]]);
          showAlert('Success', 'Item added to navigation');
        } else {
          // Fallback if select() returns nothing due to RLS
          fetchNavigations();
          showAlert('Success', 'Item added (Refreshing list...)');
        }
      }
      resetForm();
    } catch (e) {
      console.error('Navigation Error:', e);
      const errorMsg = e.message || 'Check database schema for missing columns like "icon" or "updated_at".';
      showAlert('Error', `Operation failed: ${errorMsg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ label: '', link: '', icon: '', is_active: true, parent_id: null });
  };

  const startEdit = (item) => {
    setIsEditing(item);
    setFormData({ label: item.label, link: item.link, icon: item.icon || '', is_active: item.is_active, parent_id: item.parent_id });
  };

  const startAddSub = (parentId) => {
    setFormData({ label: '', link: '', icon: '', is_active: true, parent_id: parentId });
    // Focus the first input
    const input = document.querySelector('input[placeholder*="Travel Insurance"]');
    if (input) input.focus();
  };

  const deleteItem = async (id) => {
    const result = await showConfirm('Remove Menu Item?', 'This will permanently remove this item and all its submenus from the navigation.');
    if (!result.isConfirmed) return;
    try {
      const { error } = await supabase.from('navigations').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id && i.parent_id !== id));
      showAlert('Removed', 'Menu item removed');
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to remove item', 'error');
    }
  };

  const toggleStatus = async (item) => {
    try {
        const newStatus = !item.is_active;
        const { error } = await supabase
          .from('navigations')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw error;
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i));
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Failed to toggle status', 'error');
    }
  };

  // Transform items into hierarchical structure for rendering
  const displayItems = buildTree(items);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Navigation Manager</h1>
          <p className="text-gray-400 text-sm font-medium">Control the website&apos;s main menu structure via drag &amp; drop</p>
        </div>
        <div className="flex items-center gap-2">
{/* 
          <Button onClick={fetchNavigations} variant="outline" className="text-gray-500 border-slate-300 flex items-center gap-2">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Sync
          </Button>
          */}
          <Button onClick={saveOrder} disabled={saving || loading} className="bg-gray-900 hover:bg-black text-white flex items-center gap-2 shadow-lg shadow-gray-200">
            <Save size={16} /> Save Hierarchy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* — List Section — */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b border-gray-50 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Menu Structure</h2>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{items.length} Items Loaded</span>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="py-20 flex flex-col items-center">
                  <RefreshCw className="animate-spin text-brand-red mb-4" size={32} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Navigation Map...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 rounded-3xl">
                  <LayoutTemplate size={48} className="opacity-20" />
                  No menu items identified. Start building below.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {displayItems.map((item) => (
                      <SortableNavItem 
                        key={item.id} 
                        item={item} 
                        level={item.level}
                        onEdit={startEdit} 
                        onDelete={deleteItem}
                        onToggle={toggleStatus}
                        onAddSub={startAddSub}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* — Form Section — */}
        <div className="space-y-6">
          <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white sticky top-6">
            <CardHeader className="border-b border-gray-50 p-8 bg-gray-50/50">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {isEditing ? 'Edit Menu Item' : 'Add Strategic Link'}
              </h2>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Menu Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Travel Insurance"
                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /insurance or https://..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Icon Name (Lucide)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shield, Coffee, Map"
                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parent Item (Optional)</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-red transition-all appearance-none bg-white"
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  >
                    <option value="">Main Navigation (Top Level)</option>
                    {displayItems
                      .filter(i => i.id !== (isEditing?.id))
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {'\u00A0'.repeat(item.level * 4)}{item.level > 0 ? '↳ ' : ''}{item.label}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.is_active ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    <Eye size={14} /> Visible
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.is_active ? 'bg-white text-gray-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    <EyeOff size={14} /> Hidden
                  </button>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Button type="submit" disabled={saving} className="w-full bg-brand-red hover:opacity-90 text-white flex items-center justify-center gap-2 py-6 shadow-lg shadow-red-100">
                    <Plus size={18} /> {isEditing ? 'Confirm Transformation' : 'Append to Navigation'}
                  </Button>
                  {isEditing && (
                    <Button type="button" onClick={resetForm} variant="outline" className="w-full border-slate-300 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50">
                      Abort Editing
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-brand-red/5 border border-brand-red/10 rounded-3xl p-6">
            <div className="flex gap-3">
              <div className="p-2 bg-brand-red/10 rounded-xl text-brand-red h-fit">
                <LayoutTemplate size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-1">D&D Control</h4>
                <p className="text-slate-500">Drag and drop items to reorder them. Click &apos;Add Submenu&apos; to create nested navigation.</p>
                <p className="text-xs text-red-900/60 font-medium leading-relaxed">
                  The order you define here instantly optimizes the visual priority of navigation links in the client web-app.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NavigationManager;
