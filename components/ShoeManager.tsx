import React, { useState, useRef } from 'react';
import { Shoe } from '../types';
import { ChevronLeft, Plus, Edit2, Trash2, Camera, Image, CheckCircle, Footprints } from './Icons';
import { v4 as uuidv4 } from 'uuid';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

interface ShoeManagerProps {
  shoes: Shoe[];
  onSaveShoe: (shoe: Shoe) => void;
  onDeleteShoe: (id: string) => void;
  onClose: () => void;
}

const ShoeManager: React.FC<ShoeManagerProps> = ({ shoes, onSaveShoe, onDeleteShoe, onClose }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null);

  const handleAddNew = () => {
    setEditingShoe({
      id: generateId(),
      brand: '',
      model: '',
      distance: 0,
      maxDistance: 800,
      isActive: true,
      purchaseDate: Date.now()
    });
    setView('edit');
  };

  const handleEdit = (shoe: Shoe) => {
    setEditingShoe({ ...shoe });
    setView('edit');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这双跑鞋吗？')) {
      onDeleteShoe(id);
    }
  };

  const handleSave = () => {
    if (editingShoe && editingShoe.brand && editingShoe.model) {
      onSaveShoe(editingShoe);
      setView('list');
      setEditingShoe(null);
    } else {
      alert('请填写品牌和型号');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <button onClick={view === 'edit' ? () => setView('list') : onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-lg">{view === 'edit' ? (editingShoe?.id ? '编辑跑鞋' : '添加跑鞋') : '我的跑鞋'}</h2>
        {view === 'list' && (
           <button onClick={handleAddNew} className="text-orange-600 font-bold text-sm flex items-center gap-1">
             <Plus size={18} /> 添加
           </button>
        )}
        {view === 'edit' && (
           <button onClick={handleSave} className="text-orange-600 font-bold text-sm">
             保存
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {view === 'list' ? (
          <div className="space-y-4">
            {shoes.length === 0 ? (
              <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                <Footprints size={48} className="mb-4 opacity-30"/>
                <p>还没有添加跑鞋</p>
                <button onClick={handleAddNew} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm shadow-md">
                  添加第一双
                </button>
              </div>
            ) : (
              shoes.map(shoe => (
                <div key={shoe.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex">
                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0 relative">
                        {shoe.image ? (
                            <img src={shoe.image} alt={shoe.model} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Footprints size={32} />
                            </div>
                        )}
                        {!shoe.isActive && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                已退役
                            </div>
                        )}
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase">{shoe.brand}</div>
                                <div className="font-bold text-gray-900">{shoe.model}</div>
                            </div>
                            <button onClick={() => handleEdit(shoe)} className="text-gray-400 hover:text-orange-500 p-1">
                                <Edit2 size={16} />
                            </button>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-xs mb-1 text-gray-500">
                                <span>{shoe.distance.toFixed(1)} km</span>
                                <span>{shoe.maxDistance} km</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${shoe.distance > shoe.maxDistance ? 'bg-red-500' : 'bg-orange-500'}`}
                                    style={{ width: `${Math.min((shoe.distance / shoe.maxDistance) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <ShoeForm shoe={editingShoe!} onChange={setEditingShoe} onDelete={() => handleDelete(editingShoe!.id)} />
        )}
      </div>
    </div>
  );
};

const ShoeForm = ({ shoe, onChange, onDelete }: { shoe: Shoe, onChange: (s: Shoe) => void, onDelete: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_SIZE = 400; // Resize to save storage
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                onChange({ ...shoe, image: dataUrl });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            <div 
                className="w-full h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors overflow-hidden relative group"
                onClick={() => fileInputRef.current?.click()}
            >
                {shoe.image ? (
                    <>
                        <img src={shoe.image} alt="Shoe" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={32} />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <Camera size={32} className="mb-2" />
                        <span className="text-xs font-bold">点击上传照片</span>
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">品牌</label>
                    <input 
                        type="text" 
                        value={shoe.brand} 
                        onChange={e => onChange({...shoe, brand: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="Nike, Adidas, Hoka..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">型号</label>
                    <input 
                        type="text" 
                        value={shoe.model} 
                        onChange={e => onChange({...shoe, model: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="Pegasus 40, Clifton 9..."
                    />
                </div>
                <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">预计寿命 (km)</label>
                        <input 
                            type="number" 
                            value={shoe.maxDistance} 
                            onChange={e => onChange({...shoe, maxDistance: parseFloat(e.target.value)})}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                        />
                    </div>
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">当前里程 (km)</label>
                        <input 
                            type="number" 
                            value={shoe.distance} 
                            onChange={e => onChange({...shoe, distance: parseFloat(e.target.value)})}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button 
                        onClick={() => onChange({...shoe, isActive: !shoe.isActive})}
                        className={`flex-1 py-3 rounded-lg border font-bold text-sm transition-colors ${shoe.isActive ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 text-white border-transparent'}`}
                    >
                        {shoe.isActive ? '设为退役' : '设为现役'}
                    </button>
                    {shoe.distance === 0 && (
                        <button 
                            onClick={onDelete}
                            className="px-4 py-3 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ShoeManager;