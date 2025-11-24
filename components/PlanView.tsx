
import React, { useState, useMemo } from 'react';
import { RunningPlan, WeekPlan, Workout, RunType, WorkoutBlock, WorkoutStep, StepType, ReferenceRace, RestType, DisplayUnit } from '../types';
import { ChevronRight, ChevronLeft, Calendar, Clock, MapPin, Zap, Coffee, Edit2, Trash2, X, Plus, CheckCircle, Circle, PieChart, Layers, Target, Repeat, ArrowUp, ArrowDown, ChevronDown, ChevronUp, GripVertical, Trophy, TrendingUp, Activity } from './Icons';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { addDays, format, addWeeks, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Polyfill for startOfWeek since it's reported missing in the environment's date-fns
const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const result = new Date(date);
  const day = result.getDay();
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Fallback UUID
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Helpers moved to module scope for reuse ---

const formatPace = (pace: string) => {
    if (!pace) return '';
    const parts = pace.split(':');
    if (parts.length === 2) {
      return `${parseInt(parts[0])}'${parts[1]}''`;
    }
    return pace;
};

const formatValue = (val: number, type: 'distance' | 'time', unit?: DisplayUnit) => {
    if (type === 'distance') {
       if (unit === 'm') return `${Math.round(val * 1000)}m`;
       return `${val}km`;
    } else {
       if (unit === 'sec') return `${Math.round(val * 60)}s`;
       return `${val}min`;
    }
};

const paceToSeconds = (paceStr: string) => {
    if (!paceStr) return 0;
    const parts = paceStr.split(':').map(Number);
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
};

const secondsToPace = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Block Renderer Component ---

const BlockRenderer = ({ block }: { block: WorkoutBlock }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (block.type === 'repeat') {
        const runStep = block.steps.find(s => ['run', 'tempo', 'interval'].includes(s.type)) || block.steps[0];
        const restStep = block.steps.find(s => s.type === 'recover' || s.type === 'rest');
        const runText = `${formatValue(runStep.targetValue, runStep.targetType, runStep.displayUnit)}${runStep.targetPace ? '@' + formatPace(runStep.targetPace) : ''}`;
        const restText = restStep ? `/${formatValue(restStep.targetValue, restStep.targetType, restStep.displayUnit)} ${restStep.type === 'recover' ? (restStep.restType === 'rest' ? 'rest' : 'jg') : 'rest'}` : '';
        
        return (
            <div className="rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-colors overflow-hidden">
                 <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left p-2 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="font-bold text-orange-600 bg-orange-100 px-1.5 rounded">{block.repeats}×</span>
                        <span className="text-gray-700 font-bold">{runText}{restText}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                </button>

                {isOpen && (
                    <div className="bg-white border-t border-gray-100 p-2 text-xs space-y-1">
                        {Array.from({length: block.repeats}).map((_, i) => (
                            <div key={i} className="flex gap-2 py-1 border-b border-gray-50 last:border-0 items-baseline">
                                <span className="text-orange-300 font-mono font-bold w-6 text-right">#{i+1}</span>
                                <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                                    {block.steps.map((step, sIdx) => {
                                         const val = formatValue(step.targetValue, step.targetType, step.displayUnit);
                                         const typeLabel = step.type === 'recover' ? (step.restType === 'rest' ? '休息' : '慢跑') : (step.type === 'run' ? '跑' : step.type === 'warmup' ? '热身' : step.type === 'cooldown' ? '冷身' : '跑');
                                         const pace = step.targetPace ? `@${formatPace(step.targetPace)}` : '';
                                         return (
                                             <span key={sIdx} className={`${step.type === 'recover' ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                                                 {typeLabel} {val}{pace}
                                             </span>
                                         )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    } else {
        const step = block.steps[0];
        const mainText = `${formatValue(step.targetValue, step.targetType, step.displayUnit)}${step.targetPace ? '@' + formatPace(step.targetPace) : ''}`;
        let label = step.type === 'warmup' ? '热身' : step.type === 'cooldown' ? '冷身' : step.type === 'recover' ? '休息' : '跑步';
        
        return (
            <div className="text-sm bg-gray-50 p-2 rounded-lg flex items-center gap-2">
                <span className={`text-[10px] px-1 rounded border border-gray-300 text-gray-500`}>{label}</span>
                <span className="text-gray-700 font-mono font-bold">{mainText} {step.type === 'recover' && (step.restType === 'rest' ? 'rest' : 'jg')}</span>
            </div>
        );
    }
};

interface PlanViewProps {
  plan: RunningPlan;
  onUpdatePlan: (updatedPlan: RunningPlan) => void;
  onDeletePlan: () => void;
}

const PlanView: React.FC<PlanViewProps> = ({ plan, onUpdatePlan, onDeletePlan }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'stats'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date()); // For calendar navigation
  const [selectedDayInfo, setSelectedDayInfo] = useState<{weekIndex: number, dayOffset: number, date: Date} | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // --- Stats State ---
  const [raceDist, setRaceDist] = useState(plan.referenceRace?.distance || 5);
  const [raceTimeStr, setRaceTimeStr] = useState(plan.referenceRace?.time || '25:00');

  // --- Calendar Logic ---
  const startDate = useMemo(() => new Date(plan.createdAt), [plan.createdAt]);
  
  // Calculate the currently visible month/weeks
  const calendarWeeks = useMemo(() => {
    const startOfCurrentView = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weeks = [];
    for(let i=0; i<5; i++) {
        weeks.push(addWeeks(startOfCurrentView, i));
    }
    return weeks;
  }, [currentDate]);

  const getWorkoutsForDate = (date: Date) => {
    const diffTime = Math.abs(date.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (date < startOfWeek(startDate, { weekStartsOn: 1 })) return { workouts: [], weekIndex: -1, dayOffset: -1 };

    const planStartMonday = startOfWeek(startDate, { weekStartsOn: 1 });
    const currentMonday = startOfWeek(date, { weekStartsOn: 1 });
    const weekDiff = Math.floor((currentMonday.getTime() - planStartMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));

    if (weekDiff < 0 || weekDiff >= plan.weeks.length) return { workouts: [], weekIndex: -1, dayOffset: -1 };

    const dayOffset = (getDay(date) + 6) % 7; 
    
    const week = plan.weeks[weekDiff];
    const workouts = week.workouts.filter(w => w.dayOffset === dayOffset);
    
    return { workouts, weekIndex: weekDiff, dayOffset };
  };

  const handleDayClick = (date: Date) => {
      const { weekIndex, dayOffset } = getWorkoutsForDate(date);
      if (weekIndex >= 0) {
          setSelectedDayInfo({ weekIndex, dayOffset, date });
      }
  };

  const handleAddWorkout = () => {
      if (!selectedDayInfo) return;
      
      const newWorkout: Workout = {
          id: generateId(),
          dayOffset: selectedDayInfo.dayOffset,
          type: RunType.EASY,
          title: "新训练",
          description: "保持轻松的节奏",
          distanceKm: 5,
          durationMin: 30,
          isCompleted: false,
          blocks: [
              {
                  id: generateId(),
                  type: 'single',
                  repeats: 1,
                  steps: [{
                      id: generateId(),
                      type: 'run',
                      targetType: 'distance',
                      targetValue: 5,
                      targetPace: '06:00'
                  }]
              }
          ]
      };

      // Do NOT add to plan yet. Set as editing to allow customization first.
      setEditingWorkout(newWorkout); 
  };

  const handleDeleteWorkout = (workoutId: string) => {
      if (!selectedDayInfo) return;
      const newPlan = { ...plan };
      newPlan.weeks[selectedDayInfo.weekIndex].workouts = newPlan.weeks[selectedDayInfo.weekIndex].workouts.filter(w => w.id !== workoutId);
      onUpdatePlan(newPlan);
  };

  const handleSaveEditor = (updatedWorkout: Workout) => {
      if (!selectedDayInfo) return;
      
      // Recalculate totals
      let totalDist = 0;
      let totalTime = 0;
      
      updatedWorkout.blocks.forEach(block => {
          const reps = block.type === 'repeat' ? block.repeats : 1;
          block.steps.forEach(step => {
             if (step.targetType === 'distance') {
                 totalDist += step.targetValue * reps;
                 const paceParts = (step.targetPace || "06:00").split(':').map(Number);
                 const paceMin = paceParts.length === 2 ? paceParts[0] + paceParts[1]/60 : 6;
                 totalTime += step.targetValue * reps * paceMin;
             } else {
                 totalTime += step.targetValue * reps;
                 totalDist += (step.targetValue * reps) / 6; // Rough estimate if only time is given
             }
          });
      });

      updatedWorkout.distanceKm = parseFloat(totalDist.toFixed(1));
      updatedWorkout.durationMin = Math.round(totalTime);

      const newPlan = { ...plan };
      const week = newPlan.weeks[selectedDayInfo.weekIndex];
      const existingIdx = week.workouts.findIndex(w => w.id === updatedWorkout.id);
      
      if (existingIdx >= 0) {
          week.workouts[existingIdx] = updatedWorkout;
      } else {
          week.workouts.push(updatedWorkout);
      }
      
      onUpdatePlan(newPlan);
      setEditingWorkout(null);
  };

  const toggleCompletion = (workout: Workout) => {
      if (!selectedDayInfo) return;
      const newPlan = { ...plan };
      const w = newPlan.weeks[selectedDayInfo.weekIndex].workouts.find(wk => wk.id === workout.id);
      if (w) w.isCompleted = !w.isCompleted;
      onUpdatePlan(newPlan);
  };

  const saveReferenceRace = () => {
     const newPlan = { ...plan, referenceRace: { distance: raceDist, time: raceTimeStr } };
     onUpdatePlan(newPlan);
     alert('配速区间已更新！');
  };

  // Helper to calculate Threshold Pace (sec/km) from race performance
  const calculateTPace = (dist: number, timeStr: string) => {
      const totalSeconds = paceToSeconds(timeStr);
      if(totalSeconds === 0) return 0;
      
      const inputPace = totalSeconds / dist;
      
      let tPace = inputPace;
      if (dist === 5) tPace = inputPace * 1.06;
      else if (dist === 10) tPace = inputPace * 1.02; 
      else if (Math.abs(dist - 21.0975) < 1) tPace = inputPace / 1.06;
      else if (Math.abs(dist - 42.195) < 1) {
          if (inputPace < 270) tPace = inputPace / 1.08;
          else tPace = inputPace / 1.15;
      }
      return tPace;
  };

  const renderStats = () => {
    const tPaceSec = calculateTPace(raceDist, raceTimeStr);
    const hasRaceData = tPaceSec > 0;
    
    // Define Zone Boundaries (Sec/km)
    const thresholdLimit = tPaceSec * 0.94; // Cutoff for Interval (Faster than 94% T-Pace)
    const tempoLimit = tPaceSec * 1.05; // Cutoff for Threshold (94% - 105% T-Pace)
    const easyLimit = tPaceSec * 1.20; // Cutoff for Tempo (105% - 120% T-Pace)

    const zones = {
        easy: 0,
        tempo: 0,
        threshold: 0,
        interval: 0
    };

    // Data for Weekly Stacked Bar Chart
    const weeklyData = plan.weeks.map(week => {
        let easyDist = 0;
        let qualityDist = 0; // Tempo, Threshold, Interval
        
        week.workouts.forEach(workout => {
            if (workout.blocks) {
                workout.blocks.forEach(block => {
                     const reps = block.type === 'repeat' ? block.repeats : 1;
                     block.steps.forEach(step => {
                        if (['run', 'tempo', 'interval', 'warmup', 'cooldown'].includes(step.type)) {
                            let dist = step.targetType === 'distance' ? step.targetValue : (step.targetValue * 60) / (step.targetPace ? paceToSeconds(step.targetPace) : 360); // fallback 6:00
                            dist *= reps;

                            // Calculate Zones for Pie Chart
                            if (step.type === 'warmup' || step.type === 'cooldown') {
                                zones.easy += dist;
                                easyDist += dist;
                            } else if (step.targetPace && hasRaceData) {
                                const p = paceToSeconds(step.targetPace);
                                if (p > easyLimit) { zones.easy += dist; easyDist += dist; }
                                else if (p > tempoLimit) { zones.tempo += dist; qualityDist += dist; }
                                else if (p > thresholdLimit) { zones.threshold += dist; qualityDist += dist; }
                                else { zones.interval += dist; qualityDist += dist; }
                            } else {
                                // Fallback based on type
                                if (step.type === 'interval' || step.type === 'tempo') {
                                    if(step.type === 'interval') zones.interval += dist;
                                    else zones.tempo += dist;
                                    qualityDist += dist;
                                } else {
                                    zones.easy += dist;
                                    easyDist += dist;
                                }
                            }
                        }
                     });
                });
            } else {
                 zones.easy += workout.distanceKm;
                 easyDist += workout.distanceKm;
            }
        });

        return {
            name: `W${week.weekNumber}`,
            easy: parseFloat(easyDist.toFixed(1)),
            quality: parseFloat(qualityDist.toFixed(1)),
            total: parseFloat((easyDist + qualityDist).toFixed(1))
        };
    });

    const pieData = [
        { name: '轻松跑', value: zones.easy, color: '#4ade80' },
        { name: '马拉松/节奏', value: zones.tempo, color: '#3b82f6' },
        { name: '乳酸阈值', value: zones.threshold, color: '#f97316' },
        { name: '无氧/间歇', value: zones.interval, color: '#ef4444' },
    ].filter(d => d.value > 0);
    
    const totalKm = Object.values(zones).reduce((a,b) => a+b, 0);
    const peakWeek = Math.max(...weeklyData.map(d => d.total));

    return (
        <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                 <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                     <div className="text-gray-400 text-xs font-bold uppercase mb-1">总跑量</div>
                     <div className="text-xl font-bold text-gray-900">{totalKm.toFixed(0)} <span className="text-xs font-normal text-gray-400">km</span></div>
                 </div>
                 <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                     <div className="text-gray-400 text-xs font-bold uppercase mb-1">平均周跑量</div>
                     <div className="text-xl font-bold text-gray-900">{(totalKm / plan.weeks.length).toFixed(0)} <span className="text-xs font-normal text-gray-400">km</span></div>
                 </div>
                 <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                     <div className="text-gray-400 text-xs font-bold uppercase mb-1">峰值周</div>
                     <div className="text-xl font-bold text-orange-600">{peakWeek.toFixed(0)} <span className="text-xs font-normal text-gray-400">km</span></div>
                 </div>
            </div>

            {/* Weekly Volume Trend */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <TrendingUp className="text-blue-500" size={20}/> 长期训练负荷
                </h3>
                <div className="h-48 w-full text-xs">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                cursor={{fill: '#f3f4f6'}}
                            />
                            <Legend iconType="circle" iconSize={8}/>
                            <Bar dataKey="easy" name="轻松跑" stackId="a" fill="#4ade80" radius={[0,0,0,0]} />
                            <Bar dataKey="quality" name="强度跑" stackId="a" fill="#f97316" radius={[4,4,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                </div>
            </div>

            {/* Intensity Distribution */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800"><PieChart size={20} className="text-purple-500"/> 总体强度分布</h3>
                <div className="h-56 w-full relative">
                    {totalKm > 0 ? (
                        <ResponsiveContainer>
                            <RePieChart>
                                <Pie 
                                    data={pieData} 
                                    innerRadius={50} 
                                    outerRadius={70} 
                                    paddingAngle={2} 
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value.toFixed(1)} km`} />
                            </RePieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {pieData.map(d => (
                            <div key={d.name} className="flex items-center gap-1 text-xs text-gray-600">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                                {d.name} ({((d.value/totalKm)*100).toFixed(0)}%)
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Race Input */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Trophy className="text-yellow-500" size={20}/> 
                    配速基准设置
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                    基于您的比赛成绩，我们将自动为您划分训练区间。
                </p>
                <div className="flex gap-3 mb-3">
                    <select 
                        value={raceDist} 
                        onChange={(e) => setRaceDist(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                    >
                        <option value={5}>5公里</option>
                        <option value={10}>10公里</option>
                        <option value={21.0975}>半程马拉松</option>
                        <option value={42.195}>全程马拉松</option>
                    </select>
                    <input 
                        type="text" 
                        value={raceTimeStr}
                        onChange={(e) => setRaceTimeStr(e.target.value)}
                        placeholder="MM:SS 或 HH:MM:SS"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none"
                    />
                </div>
                <button 
                    onClick={saveReferenceRace}
                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold mb-4"
                >
                    更新计算
                </button>

                {/* Zone Table */}
                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-green-50 p-2 rounded border border-green-100">
                         <div className="font-bold text-green-700">轻松跑 (E)</div>
                         <div className="text-green-600 font-mono">{`> ${secondsToPace(easyLimit)} /km`}</div>
                     </div>
                     <div className="bg-blue-50 p-2 rounded border border-blue-100">
                         <div className="font-bold text-blue-700">马拉松/节奏 (M/T)</div>
                         <div className="text-blue-600 font-mono">{`${secondsToPace(easyLimit)} - ${secondsToPace(tempoLimit)} /km`}</div>
                     </div>
                     <div className="bg-orange-50 p-2 rounded border border-orange-100">
                         <div className="font-bold text-orange-700">乳酸阈值 (I)</div>
                         <div className="text-orange-600 font-mono">{`${secondsToPace(tempoLimit)} - ${secondsToPace(thresholdLimit)} /km`}</div>
                     </div>
                     <div className="bg-red-50 p-2 rounded border border-red-100">
                         <div className="font-bold text-red-700">无氧/间歇 (R)</div>
                         <div className="text-red-600 font-mono">{`< ${secondsToPace(thresholdLimit)} /km`}</div>
                     </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100">
         <div className="flex items-center justify-between p-4">
             <div>
                <h1 className="text-xl font-bold">{plan.name}</h1>
                <div className="text-xs text-gray-500">{plan.weeks.length}周计划 • {plan.level}</div>
             </div>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-orange-600' : 'text-gray-400'}`}>
                     <Calendar size={18} />
                 </button>
                 <button onClick={() => setViewMode('stats')} className={`p-2 rounded-md transition-all ${viewMode === 'stats' ? 'bg-white shadow text-orange-600' : 'text-gray-400'}`}>
                     <Activity size={18} />
                 </button>
             </div>
         </div>
         
         {viewMode === 'calendar' && (
             <div className="flex items-center justify-between px-4 pb-2">
                 <button onClick={() => setCurrentDate(d => addWeeks(d, -4))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
                 <span className="font-bold text-sm text-gray-700">{format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy年 M月', {locale: zhCN})}</span>
                 <button onClick={() => setCurrentDate(d => addWeeks(d, 4))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
             </div>
         )}
      </div>

      {viewMode === 'stats' ? renderStats() : (
        <div className="p-2 space-y-2">
            <div className="bg-white rounded-2xl p-2 shadow-sm">
                <div className="grid grid-cols-7 mb-2 border-b border-gray-50 pb-2">
                    {['一','二','三','四','五','六','日'].map(d => (
                        <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                    ))}
                </div>
                
                {calendarWeeks.map((weekStart, wIdx) => {
                    const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
                    return (
                        <div key={wIdx} className="grid grid-cols-7 mb-1">
                            {days.map((day, dIdx) => {
                                const { workouts, weekIndex } = getWorkoutsForDate(day);
                                const isSelected = selectedDayInfo?.date.toDateString() === day.toDateString();
                                const isToday = new Date().toDateString() === day.toDateString();
                                const isValid = weekIndex >= 0;

                                return (
                                    <button 
                                        key={dIdx}
                                        disabled={!isValid}
                                        onClick={() => handleDayClick(day)}
                                        className={`
                                            relative h-14 rounded-xl flex flex-col items-center justify-start pt-1 transition-all
                                            ${!isValid ? 'opacity-30 cursor-default' : 'hover:bg-gray-50 active:scale-95'}
                                            ${isSelected ? 'bg-orange-50 ring-2 ring-orange-500 z-10' : ''}
                                        `}
                                    >
                                        <span className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-black text-white' : 'text-gray-700'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        <div className="flex gap-0.5 flex-wrap justify-center px-1">
                                            {workouts.map(w => {
                                                const color = w.isCompleted ? 'bg-green-500' : 
                                                            w.type === RunType.REST ? 'bg-gray-300' : 
                                                            w.type === RunType.INTERVAL ? 'bg-red-500' : 'bg-orange-400';
                                                return <div key={w.id} className={`w-1.5 h-1.5 rounded-full ${color}`} />;
                                            })}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {selectedDayInfo && viewMode === 'calendar' && (
          <div className="fixed inset-0 bg-black/50 z-30 flex justify-end">
             <div className="w-full max-w-md bg-white h-full animate-in slide-in-from-right duration-300 flex flex-col">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                     <div>
                         <h2 className="text-xl font-bold flex items-center gap-2">
                             {format(selectedDayInfo.date, 'M月d日 EEEE', {locale: zhCN})}
                         </h2>
                     </div>
                     <button onClick={() => setSelectedDayInfo(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                     {getWorkoutsForDate(selectedDayInfo.date).workouts.map((workout) => (
                        <div key={workout.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${workout.type === RunType.INTERVAL ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{workout.type}</span>
                                        <h3 className="font-bold text-gray-900">{workout.title}</h3>
                                    </div>
                                    <div className="text-xs text-gray-500 flex gap-3">
                                        <span>{workout.distanceKm}km</span>
                                        <span>{workout.durationMin}min</span>
                                    </div>
                                </div>
                                <button onClick={() => toggleCompletion(workout)} className={workout.isCompleted ? 'text-green-500' : 'text-gray-300'}>
                                    {workout.isCompleted ? <CheckCircle size={28} fill="currentColor" className="text-white"/> : <Circle size={28}/>}
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                {workout.blocks?.map((block) => (
                                    <BlockRenderer key={block.id} block={block} />
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setEditingWorkout(workout)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">编辑详情</button>
                                <button onClick={() => handleDeleteWorkout(workout.id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                     ))}
                     
                     <button onClick={handleAddWorkout} className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-bold hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                         <Plus size={20} /> 添加训练
                     </button>
                 </div>
             </div>
          </div>
      )}

      {editingWorkout && (
        <WorkoutEditor 
            workout={editingWorkout} 
            onSave={handleSaveEditor} 
            onCancel={() => setEditingWorkout(null)} 
        />
      )}
    </div>
  );
};

const WorkoutEditor = ({ workout, onSave, onCancel }: { workout: Workout, onSave: (w: Workout) => void, onCancel: () => void }) => {
    const [data, setData] = useState<Workout>(JSON.parse(JSON.stringify(workout)));
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Helpers to handle value conversion for UI vs Internal Storage
    // Internal: km for distance, min for time
    const getDisplayValue = (step: WorkoutStep) => {
        if (step.targetType === 'distance') {
            return step.displayUnit === 'm' ? Math.round(step.targetValue * 1000) : step.targetValue;
        } else {
            return step.displayUnit === 'sec' ? Math.round(step.targetValue * 60) : step.targetValue;
        }
    };

    const updateStepValueFromDisplay = (bIdx: number, sIdx: number, val: number, unit?: DisplayUnit) => {
        const newBlocks = [...(data.blocks || [])];
        const step = newBlocks[bIdx].steps[sIdx];
        const activeUnit = unit || step.displayUnit || (step.targetType === 'distance' ? 'km' : 'min');
        
        let storedVal = val;
        if (step.targetType === 'distance') {
             storedVal = activeUnit === 'm' ? val / 1000 : val;
        } else {
             storedVal = activeUnit === 'sec' ? val / 60 : val;
        }
        
        step.targetValue = storedVal;
        step.displayUnit = activeUnit;
        
        setData({ ...data, blocks: newBlocks });
    };
    
    // Toggle between distance and time, setting defaults
    const toggleTargetType = (bIdx: number, sIdx: number) => {
        const newBlocks = [...(data.blocks || [])];
        const step = newBlocks[bIdx].steps[sIdx];
        
        if (step.targetType === 'distance') {
            step.targetType = 'time';
            step.targetValue = 5; // default 5 mins
            step.displayUnit = 'min';
        } else {
            step.targetType = 'distance';
            step.targetValue = 1; // default 1 km
            step.displayUnit = 'km';
        }
        setData({ ...data, blocks: newBlocks });
    }

    const toggleUnit = (bIdx: number, sIdx: number) => {
        const newBlocks = [...(data.blocks || [])];
        const step = newBlocks[bIdx].steps[sIdx];
        
        if (step.targetType === 'distance') {
            step.displayUnit = step.displayUnit === 'm' ? 'km' : 'm';
        } else {
            step.displayUnit = step.displayUnit === 'sec' ? 'min' : 'sec';
        }
        setData({ ...data, blocks: newBlocks });
    };

    // Simplified Adders
    const addSimpleBlock = (type: StepType) => {
        const newBlock: WorkoutBlock = {
            id: generateId(), type: 'single', repeats: 1,
            steps: [{ 
                id: generateId(), 
                type, 
                targetType: type === 'recover' ? 'time' : 'distance', 
                targetValue: type === 'warmup' || type === 'cooldown' ? 1 : (type === 'recover' ? 2 : 5), 
                displayUnit: type === 'recover' ? 'min' : 'km',
                targetPace: type === 'run' ? '06:00' : undefined,
                restType: type === 'recover' ? 'jog' : undefined
            }]
        };
        setData({ ...data, blocks: [...(data.blocks || []), newBlock] });
    };

    const addIntervalBlock = () => {
         const newBlock: WorkoutBlock = {
            id: generateId(), type: 'repeat', repeats: 4,
            steps: [
                { id: generateId(), type: 'run', targetType: 'distance', targetValue: 0.4, displayUnit: 'm', targetPace: '04:30' },
                { id: generateId(), type: 'recover', targetType: 'time', targetValue: 1.5, displayUnit: 'sec', restType: 'jog' }
            ]
        };
        setData({ ...data, blocks: [...(data.blocks || []), newBlock] });
    };

    const addStepToBlock = (bIdx: number, type: StepType) => {
        const newBlocks = [...(data.blocks || [])];
        const newStep: WorkoutStep = {
             id: generateId(), 
             type, 
             targetType: type === 'recover' ? 'time' : 'distance', 
             targetValue: type === 'recover' ? 2 : 1, 
             displayUnit: type === 'recover' ? 'min' : 'km',
             targetPace: type === 'run' ? '05:00' : undefined,
             restType: type === 'recover' ? 'jog' : undefined
        };
        newBlocks[bIdx].steps.push(newStep);
        setData({ ...data, blocks: newBlocks });
    };

    const removeStepFromBlock = (bIdx: number, sIdx: number) => {
        const newBlocks = [...(data.blocks || [])];
        newBlocks[bIdx].steps.splice(sIdx, 1);
        setData({ ...data, blocks: newBlocks });
    };

    const removeBlock = (index: number) => {
        const newBlocks = [...(data.blocks || [])];
        newBlocks.splice(index, 1);
        setData({ ...data, blocks: newBlocks });
    };

    const updateBlockStepProp = (bIdx: number, sIdx: number, field: keyof WorkoutStep, value: any) => {
        const newBlocks = [...(data.blocks || [])];
        newBlocks[bIdx].steps[sIdx] = { ...newBlocks[bIdx].steps[sIdx], [field]: value };
        setData({ ...data, blocks: newBlocks });
    };

    const updateBlockRepeats = (bIdx: number, value: number) => {
        const newBlocks = [...(data.blocks || [])];
        newBlocks[bIdx].repeats = value;
        setData({ ...data, blocks: newBlocks });
    };

    // --- DnD Handlers ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Make the drag ghost transparent or custom if needed
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newBlocks = [...(data.blocks || [])];
        const movedBlock = newBlocks[draggedIndex];
        newBlocks.splice(draggedIndex, 1);
        newBlocks.splice(dropIndex, 0, movedBlock);
        
        setData({ ...data, blocks: newBlocks });
        setDraggedIndex(null);
    };

    return (
        <div className="fixed inset-0 bg-white z-40 flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                <button onClick={onCancel} className="text-gray-500 font-bold">取消</button>
                <h3 className="font-bold text-lg">编辑训练</h3>
                <button onClick={() => onSave(data)} className="text-orange-600 font-bold">保存</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-gray-50 pb-32">
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                    <input value={data.title} onChange={e => setData({...data, title: e.target.value})} className="w-full text-xl font-bold mb-4 outline-none placeholder-gray-300" placeholder="训练名称" />
                    <div className="flex gap-2">
                        {Object.values(RunType).map(t => (
                            <button key={t} onClick={() => setData({...data, type: t})} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${data.type === t ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {(data.blocks || []).map((block, bIdx) => (
                        <div 
                            key={block.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, bIdx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, bIdx)}
                            className={`relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all group ${draggedIndex === bIdx ? 'opacity-40 border-dashed border-orange-300' : ''}`}
                        >
                            {/* Drag Handle */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-move z-20 text-gray-300 hover:text-gray-600 bg-transparent hover:bg-gray-50 transition-colors">
                                <GripVertical size={16} />
                            </div>

                            <div className="pl-8">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => removeBlock(bIdx)} className="p-1 text-gray-300 hover:text-red-500"><X size={16}/></button>
                                </div>

                                {block.type === 'repeat' ? (
                                    // --- INTERVAL EDITOR UI ---
                                    <div className="p-4 bg-orange-50/30">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Repeat size={16} className="text-orange-500"/>
                                            <span className="font-bold text-orange-700 text-sm">间歇组</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-lg border border-orange-100">
                                            <span className="text-sm font-bold text-gray-600">重复</span>
                                            <input 
                                                type="number" 
                                                value={block.repeats} 
                                                onChange={(e) => updateBlockRepeats(bIdx, parseInt(e.target.value))}
                                                className="w-16 text-center text-lg font-bold bg-gray-100 rounded-md py-1 outline-none focus:ring-2 focus:ring-orange-500" 
                                            />
                                            <span className="text-sm font-bold text-gray-600">次</span>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {block.steps.map((step, sIdx) => (
                                                <div key={step.id} className="flex items-center gap-2 group/step">
                                                    <div className={`w-16 text-xs font-bold text-center py-1 rounded ${step.type === 'recover' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {step.type === 'recover' ? '休息' : '快跑'}
                                                    </div>
                                                    <div className="flex-1 flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input 
                                                                type="number" step="0.1"
                                                                value={getDisplayValue(step)}
                                                                onChange={e => updateStepValueFromDisplay(bIdx, sIdx, parseFloat(e.target.value))}
                                                                className="w-full bg-gray-100 rounded-md py-1 px-2 text-sm font-bold text-center outline-none"
                                                            />
                                                            <div className="absolute right-1 top-1.5 flex gap-1">
                                                                <button onClick={() => toggleUnit(bIdx, sIdx)} className="text-[10px] bg-white px-1 rounded border border-gray-200 font-bold uppercase text-gray-500">
                                                                    {step.displayUnit || (step.targetType === 'distance' ? 'km' : 'min')}
                                                                </button>
                                                                <button onClick={() => toggleTargetType(bIdx, sIdx)} className="text-[10px] text-gray-400 hover:text-orange-500">
                                                                    <Target size={12}/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {step.type !== 'recover' && (
                                                            <input 
                                                                type="text" 
                                                                value={step.targetPace || ''}
                                                                placeholder="配速"
                                                                onChange={e => updateBlockStepProp(bIdx, sIdx, 'targetPace', e.target.value)}
                                                                className="w-20 bg-gray-100 rounded-md py-1 px-2 text-sm text-center outline-none text-blue-600 font-medium placeholder-gray-400"
                                                            />
                                                        )}
                                                         {step.type === 'recover' && (
                                                            <button 
                                                                onClick={() => updateBlockStepProp(bIdx, sIdx, 'restType', step.restType === 'rest' ? 'jog' : 'rest')}
                                                                className={`px-3 py-1 rounded-md text-xs font-bold border transition-colors ${
                                                                    step.restType === 'rest' 
                                                                    ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                                                }`}
                                                            >
                                                                {step.restType === 'rest' ? '原地休息' : '慢跑 (Jog)'}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => removeStepFromBlock(bIdx, sIdx)}
                                                            className="px-2 text-gray-300 hover:text-red-500"
                                                        >
                                                            <X size={14}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button onClick={() => addStepToBlock(bIdx, 'run')} className="flex-1 py-2 rounded-lg border border-dashed border-orange-200 text-orange-600 text-xs font-bold hover:bg-orange-50">+ 跑步</button>
                                            <button onClick={() => addStepToBlock(bIdx, 'recover')} className="flex-1 py-2 rounded-lg border border-dashed border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50">+ 休息</button>
                                        </div>
                                    </div>
                                ) : (
                                    // --- SIMPLE BLOCK EDITOR UI ---
                                    <div className="p-4 flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                            block.steps[0].type === 'warmup' ? 'bg-yellow-100 text-yellow-700' : 
                                            block.steps[0].type === 'cooldown' ? 'bg-blue-100 text-blue-700' : 
                                            block.steps[0].type === 'recover' ? 'bg-gray-100 text-gray-700' : 
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {block.steps[0].type === 'warmup' ? '热身' : 
                                             block.steps[0].type === 'cooldown' ? '冷身' : 
                                             block.steps[0].type === 'recover' ? '休息' : '跑'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex gap-2 items-center">
                                                <div className="relative w-24">
                                                    <input 
                                                        type="number" step="0.1"
                                                        value={getDisplayValue(block.steps[0])}
                                                        onChange={e => updateStepValueFromDisplay(bIdx, 0, parseFloat(e.target.value))}
                                                        className="w-full text-xl font-bold border-b border-gray-200 outline-none pb-1"
                                                    />
                                                    <div className="absolute right-0 top-1 flex gap-1">
                                                         <button onClick={() => toggleUnit(bIdx, 0)} className="text-[10px] bg-white px-1 rounded border border-gray-200 font-bold uppercase text-gray-500">
                                                            {block.steps[0].displayUnit || (block.steps[0].targetType === 'distance' ? 'km' : 'min')}
                                                        </button>
                                                        <button onClick={() => toggleTargetType(bIdx, 0)} className="text-[10px] text-gray-400 hover:text-orange-500">
                                                            <Target size={12}/>
                                                        </button>
                                                    </div>
                                                </div>
                                                {block.steps[0].type === 'run' && (
                                                    <input 
                                                        type="text" 
                                                        placeholder="目标配速"
                                                        value={block.steps[0].targetPace || ''}
                                                        onChange={e => updateBlockStepProp(bIdx, 0, 'targetPace', e.target.value)}
                                                        className="flex-1 border-b border-gray-200 outline-none pb-1 text-sm text-gray-600"
                                                    />
                                                )}
                                                {block.steps[0].type === 'recover' && (
                                                     <button 
                                                        onClick={() => updateBlockStepProp(bIdx, 0, 'restType', block.steps[0].restType === 'rest' ? 'jog' : 'rest')}
                                                        className={`ml-2 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors whitespace-nowrap ${
                                                            block.steps[0].restType === 'rest' 
                                                            ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                                            : 'bg-blue-50 text-blue-600 border-blue-200'
                                                        }`}
                                                    >
                                                        {block.steps[0].restType === 'rest' ? '原地休息' : '慢跑 (Jog)'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="grid grid-cols-5 gap-2">
                    <button onClick={() => addSimpleBlock('warmup')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors">
                        <Coffee size={20}/> <span className="text-[10px] font-bold">热身</span>
                    </button>
                    <button onClick={() => addSimpleBlock('run')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
                        <Zap size={20}/> <span className="text-[10px] font-bold">慢跑</span>
                    </button>
                    <button onClick={addIntervalBlock} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors">
                        <Repeat size={20}/> <span className="text-[10px] font-bold">间歇</span>
                    </button>
                    <button onClick={() => addSimpleBlock('recover')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                        <Clock size={20}/> <span className="text-[10px] font-bold">休息</span>
                    </button>
                    <button onClick={() => addSimpleBlock('cooldown')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
                        <Layers size={20}/> <span className="text-[10px] font-bold">冷身</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanView;
