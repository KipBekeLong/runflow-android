import React, { useState, useEffect, useRef } from 'react';
import { Play, Coffee, MapPin, Clock, Save, X, ChevronDown, Footprints } from './Icons';
import { RunLog, Shoe } from '../types';

interface RunTrackerProps {
  shoes: Shoe[];
  onSaveRun: (log: RunLog) => void;
  onCancel: () => void;
}

const RunTracker: React.FC<RunTrackerProps> = ({ shoes, onSaveRun, onCancel }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0); // seconds
  const timerRef = useRef<number | null>(null);
  
  // Manual Entry Data
  const [distance, setDistance] = useState<string>('');
  const [feeling, setFeeling] = useState<RunLog['feeling']>('good');
  const [notes, setNotes] = useState('');
  
  const activeShoes = shoes.filter(s => s.isActive);
  const [selectedShoeId, setSelectedShoeId] = useState<string>(activeShoes.length > 0 ? activeShoes[0].id : '');

  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const h = Math.floor(m / 60);
    const displayM = m % 60;
    return `${h > 0 ? h + ':' : ''}${displayM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsRunning(false);
    setShowManualForm(true);
  };

  const handleSave = () => {
    const distNum = parseFloat(distance);
    if (!distNum || distNum <= 0) {
        alert("请输入有效的距离");
        return;
    }

    const log: RunLog = {
        id: Date.now().toString(),
        date: Date.now(),
        distanceKm: distNum,
        durationSec: duration,
        pace: duration > 0 ? (duration / 60 / distNum).toFixed(2) : '0:00',
        feeling,
        notes,
        shoeId: selectedShoeId
    };
    onSaveRun(log);
  };

  if (showManualForm) {
      return (
          <div className="flex flex-col h-full bg-white p-6 pb-24 animate-in fade-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">保存记录</h2>
                  <button onClick={onCancel}><X className="text-gray-400"/></button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex items-center justify-around text-center">
                  <div>
                      <div className="text-3xl font-bold text-gray-900 font-mono">{formatTime(duration)}</div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">时长</div>
                  </div>
              </div>

              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">距离 (km)</label>
                    <input 
                        type="number"
                        inputMode="decimal" 
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-4xl font-bold text-orange-600 bg-transparent border-b-2 border-gray-200 focus:border-orange-500 outline-none pb-2 placeholder-gray-300"
                        autoFocus
                    />
                </div>
                
                {/* Shoe Selector */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">使用跑鞋</label>
                    <div className="relative">
                        <select 
                            value={selectedShoeId}
                            onChange={(e) => setSelectedShoeId(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none outline-none font-medium text-gray-800"
                        >
                            <option value="">未选择跑鞋</option>
                            {activeShoes.map(s => (
                                <option key={s.id} value={s.id}>{s.brand} {s.model}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">感觉如何?</label>
                    <div className="flex justify-between gap-2">
                        {[
                            { id: 'great', label: '超棒', icon: '🤩' },
                            { id: 'good', label: '不错', icon: '🙂' },
                            { id: 'tired', label: '累了', icon: '😫' },
                            { id: 'bad', label: '糟糕', icon: '😖' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFeeling(f.id as any)}
                                className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                                    feeling === f.id ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent'
                                }`}
                            >
                                <span className="text-2xl">{f.icon}</span>
                                <span className={`text-xs font-medium ${feeling === f.id ? 'text-orange-700' : 'text-gray-500'}`}>{f.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">备注</label>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="今天跑得怎么样？"
                        className="w-full bg-gray-50 rounded-xl p-4 outline-none text-gray-700 h-24 resize-none"
                    />
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    保存跑步
                </button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>

        <div className="flex-1 flex flex-col items-center justify-center z-10">
            <div className="text-gray-400 font-medium mb-4 tracking-widest uppercase text-sm">Timer</div>
            <div className="font-mono text-7xl font-bold tracking-tighter mb-8 tabular-nums">
                {formatTime(duration)}
            </div>

            <div className="flex gap-6 items-center">
                {!isRunning && duration === 0 ? (
                    <button 
                        onClick={() => setIsRunning(true)}
                        className="w-24 h-24 rounded-full bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Play fill="white" size={36} className="ml-1" />
                    </button>
                ) : (
                    <>
                        {isRunning ? (
                             <button 
                                onClick={() => setIsRunning(false)}
                                className="w-20 h-20 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg flex items-center justify-center transition-all"
                            >
                                <Coffee size={32} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsRunning(true)}
                                className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center transition-all"
                            >
                                <Play fill="white" size={32} className="ml-1" />
                            </button>
                        )}

                        <button 
                            onClick={handleFinish}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all"
                        >
                            <div className="w-6 h-6 bg-white rounded-sm"></div>
                        </button>
                    </>
                )}
            </div>
            
            <p className="mt-8 text-gray-400 text-sm">
                {isRunning ? "正在记录..." : (duration > 0 ? "已暂停" : "准备好开始了吗？")}
            </p>
        </div>
        
        {/* Simple "Enter manually" link if they forgot to start timer */}
        {!isRunning && duration === 0 && (
             <button onClick={() => setShowManualForm(true)} className="absolute bottom-24 w-full text-center text-gray-500 text-sm underline pb-4 z-20">
                忘记计时？手动输入
            </button>
        )}
    </div>
  );
};

export default RunTracker;