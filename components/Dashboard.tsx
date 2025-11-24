import React, { useState, useMemo, useRef } from 'react';
import { RunningPlan, RunLog, RunType, Workout, WorkoutBlock, LogSegment, DisplayUnit, BackupData, Shoe } from '../types';
import { Play, MapPin, Clock, Zap, Coffee, CheckCircle, ArrowDown, Clipboard, ChevronDown, ChevronUp, Settings, Download, Upload, FileJson, RotateCcw, X, Footprints } from './Icons';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ShoeManager from './ShoeManager';

interface DashboardProps {
  plan: RunningPlan | null;
  logs: RunLog[];
  shoes: Shoe[];
  onChangeView: (view: any) => void;
  onSaveRun?: (log: RunLog) => void;
  onImportData?: (data: BackupData) => void;
  onResetData?: () => void;
  onSaveShoe: (shoe: Shoe) => void;
  onDeleteShoe: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    plan, 
    logs, 
    shoes,
    onChangeView, 
    onSaveRun, 
    onImportData, 
    onResetData,
    onSaveShoe,
    onDeleteShoe
}) => {
  const [loggingWorkout, setLoggingWorkout] = useState<Workout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const today = new Date();
  let todaysWorkouts: Workout[] = [];
  let nextWorkout: Workout | null = null;
  let nextWorkoutDate: Date | null = null;

  if (plan) {
    const startDate = new Date(plan.createdAt);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekIdx = Math.floor(diffDays / 7);
    
    if (currentWeekIdx >= 0 && currentWeekIdx < plan.weeks.length) {
      let dayOffset = today.getDay() - 1;
      if (dayOffset === -1) dayOffset = 6;
      todaysWorkouts = plan.weeks[currentWeekIdx].workouts.filter(w => w.dayOffset === dayOffset);
    }

    const allTodayCompleted = todaysWorkouts.length > 0 && todaysWorkouts.every(w => w.isCompleted);
    
    if (todaysWorkouts.length === 0 || allTodayCompleted) {
        let found = false;
        for(let w=currentWeekIdx; w<plan.weeks.length; w++) {
            if (found) break;
            const week = plan.weeks[w];
            for (const workout of week.workouts) {
                const wDate = new Date(startDate);
                wDate.setDate(startDate.getDate() + (w * 7) + workout.dayOffset);
                if (wDate > today && wDate.toDateString() !== today.toDateString()) {
                    nextWorkout = workout;
                    nextWorkoutDate = wDate;
                    found = true;
                    break;
                }
            }
        }
    }
  }

  // ... helpers ...
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
    }
    if (unit === 'sec') return `${Math.round(val * 60)}s`;
    return `${val}min`;
  };

  const renderBlockPreview = (block: WorkoutBlock) => {
    if (block.type === 'repeat') {
      const runStep = block.steps.find(s => ['run', 'tempo', 'interval'].includes(s.type)) || block.steps[0];
      const restStep = block.steps.find(s => s.type === 'recover' || s.type === 'rest');
      
      const runText = `${formatValue(runStep.targetValue, runStep.targetType, runStep.displayUnit)}${runStep.targetPace ? '@' + formatPace(runStep.targetPace) : ''}`;
      const restText = restStep ? `/${formatValue(restStep.targetValue, restStep.targetType, restStep.displayUnit)} ${restStep.type === 'recover' ? (restStep.restType === 'rest' ? 'rest' : 'jg') : 'rest'}` : '';

      return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 border-dashed">
           <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-xs whitespace-nowrap">
                 {block.repeats}×
              </div>
              <div className="font-bold text-gray-800 text-sm font-mono tracking-tight">
                 {runText}{restText}
              </div>
           </div>
           <div className="text-xs text-gray-400 whitespace-nowrap">间歇组</div>
        </div>
      );
    } else {
        const step = block.steps[0];
        let colorClass = "bg-gray-100 text-gray-600";
        let label = "跑步";
        
        if (step.type === 'warmup') { colorClass = "bg-yellow-100 text-yellow-700"; label = "热身"; }
        else if (step.type === 'cooldown') { colorClass = "bg-blue-100 text-blue-700"; label = "冷身"; }
        else if (step.type === 'run') { colorClass = "bg-green-100 text-green-700"; label = "慢跑"; }
        else if (step.type === 'recover') { colorClass = "bg-gray-200 text-gray-600"; label = "休息"; }
        
        const mainText = `${formatValue(step.targetValue, step.targetType, step.displayUnit)}${step.targetPace ? '@' + formatPace(step.targetPace) : ''}`;
        
        return (
            <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 border-dashed">
                <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${colorClass} whitespace-nowrap`}>
                        {label}
                    </div>
                    <span className="font-bold text-gray-800 text-sm font-mono tracking-tight">
                        {mainText} {step.type === 'recover' && (step.restType === 'rest' ? 'rest' : 'jg')}
                    </span>
                </div>
            </div>
        );
    }
  };

  const renderWorkoutCard = (workout: Workout, index: number) => {
    return (
        <div key={workout.id} className="bg-white rounded-3xl shadow-xl shadow-gray-100 overflow-hidden border border-gray-100 mb-6">
            <div className="bg-gray-900 text-white p-6 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 rounded bg-white/20 text-xs font-bold backdrop-blur-sm">
                            {workout.type}
                        </span>
                        {workout.isCompleted && <CheckCircle className="text-green-400" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{workout.title || workout.type}</h2>
                    <div className="flex gap-4 mt-4 text-sm font-medium opacity-90">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {workout.distanceKm} km</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {workout.durationMin} min</span>
                    </div>
                </div>
                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="p-6 bg-white">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">训练结构 {todaysWorkouts.length > 1 && `(${index + 1}/${todaysWorkouts.length})`}</div>
                </div>
                
                <div className="space-y-1 mb-4">
                    {workout.blocks && workout.blocks.length > 0 ? (
                            workout.blocks.map((block) => (
                            <div key={block.id}>
                                {renderBlockPreview(block)}
                            </div>
                            ))
                    ) : (
                        <div className="py-4 text-center text-gray-500 text-sm">
                            自由跑 {workout.distanceKm} 公里
                        </div>
                    )}
                </div>
                
                {!workout.isCompleted && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setLoggingWorkout(workout)}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Clipboard size={18}/> 记录执行
                        </button>
                        <button 
                            onClick={() => onChangeView('record')}
                            className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Play fill="white" size={18}/> 开始训练
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="pb-24 px-5 pt-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
            <div className="text-gray-500 text-sm font-medium mb-1">{format(today, 'MM月dd日 EEEE', { locale: zhCN })}</div>
            <h1 className="text-2xl font-bold text-gray-900">
                {todaysWorkouts.length > 0 ? '今日任务' : '今日休息'}
            </h1>
        </div>
        <div className="flex gap-2 items-center">
            {!plan && (
                <button onClick={() => onChangeView('create-plan')} className="text-orange-600 text-sm font-bold mr-2">
                    + 创建计划
                </button>
            )}
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-600 hover:text-orange-600 transition-colors"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {plan ? (
        todaysWorkouts.length > 0 ? (
            <div className="space-y-6">
                {todaysWorkouts.map((workout, index) => renderWorkoutCard(workout, index))}
            </div>
        ) : (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">享受休息日</h2>
                <p className="text-gray-500 text-sm mb-6">恢复也是训练的一部分。</p>
                {nextWorkout && (
                    <div className="bg-gray-50 rounded-xl p-4 text-left">
                        <div className="text-xs text-gray-400 uppercase mb-2">下一次训练</div>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-gray-900">{nextWorkout.title || nextWorkout.type}</div>
                                <div className="text-xs text-gray-500">
                                    {nextWorkoutDate ? format(nextWorkoutDate, 'MM月dd日', {locale: zhCN}) : 'Coming Soon'}
                                </div>
                            </div>
                            <ArrowDown className="text-gray-300 -rotate-90" />
                        </div>
                    </div>
                )}
                 <button 
                    onClick={() => onChangeView('record')}
                    className="w-full mt-6 bg-white border border-gray-200 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                    我想自由跑
                </button>
            </div>
        )
      ) : (
        <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-4">开启跑步之旅</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">没有计划？让 AI 为你量身定制一个科学的训练计划，包含间歇跑、节奏跑与恢复跑。</p>
                <button 
                    onClick={() => onChangeView('create-plan')}
                    className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                    <Zap size={18} className="text-yellow-500 fill-current"/> 创建智能计划
                </button>
            </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-24">
               <div className="text-gray-400 text-xs font-bold uppercase">本周跑量</div>
               <div className="text-2xl font-bold text-gray-900">
                   {logs.filter(l => Date.now() - l.date < 7 * 24 * 60 * 60 * 1000).reduce((acc, c) => acc + c.distanceKm, 0).toFixed(1)} 
                   <span className="text-sm font-normal text-gray-400 ml-1">km</span>
               </div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-24">
               <div className="text-gray-400 text-xs font-bold uppercase">完成训练</div>
               <div className="text-2xl font-bold text-gray-900">
                   {logs.length} <span className="text-sm font-normal text-gray-400 ml-1">次</span>
               </div>
           </div>
      </div>

      {loggingWorkout && onSaveRun && (
          <WorkoutLogger 
             workout={loggingWorkout} 
             shoes={shoes}
             onClose={() => setLoggingWorkout(null)}
             onSave={(log) => {
                 onSaveRun(log);
                 setLoggingWorkout(null);
             }}
          />
      )}

      {showSettings && (
          <DataManagementModal 
            plan={plan}
            logs={logs}
            shoes={shoes}
            onClose={() => setShowSettings(false)}
            onImportData={onImportData}
            onResetData={onResetData}
            onSaveShoe={onSaveShoe}
            onDeleteShoe={onDeleteShoe}
          />
      )}
    </div>
  );
};

const DataManagementModal = ({ 
    plan, 
    logs, 
    shoes,
    onClose, 
    onImportData, 
    onResetData,
    onSaveShoe,
    onDeleteShoe
}: { 
    plan: RunningPlan | null, 
    logs: RunLog[], 
    shoes: Shoe[],
    onClose: () => void, 
    onImportData?: (data: BackupData) => void,
    onResetData?: () => void,
    onSaveShoe: (shoe: Shoe) => void,
    onDeleteShoe: (id: string) => void
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<'menu' | 'shoes'>('menu');

    const handleExport = () => {
        const backupData: BackupData = {
            version: 1,
            timestamp: Date.now(),
            plan: plan,
            logs: logs,
            shoes: shoes
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `runflow_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json && typeof json === 'object') {
                    onImportData?.(json as BackupData);
                    alert("数据导入成功！");
                    onClose();
                } else {
                    alert("无效的备份文件格式。");
                }
            } catch (err) {
                console.error(err);
                alert("解析文件失败，请确保是有效的 JSON 文件。");
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm("警告：这将永久删除所有计划、记录和跑鞋信息！确定要重置吗？")) {
            onResetData?.();
            onClose();
        }
    };

    if (view === 'shoes') {
        return (
            <div className="fixed inset-0 bg-white z-50 animate-in slide-in-from-right duration-300">
                <ShoeManager 
                    shoes={shoes} 
                    onSaveShoe={onSaveShoe} 
                    onDeleteShoe={onDeleteShoe} 
                    onClose={() => setView('menu')} 
                />
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Settings size={20} className="text-gray-600"/> 系统设置
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={20} className="text-gray-500"/>
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                         <button 
                            onClick={() => setView('shoes')}
                            className="w-full py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between px-4 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                                    <Footprints size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800">跑鞋管理</div>
                                    <div className="text-xs text-gray-400">添加与管理您的装备</div>
                                </div>
                            </div>
                            <ChevronDown size={18} className="text-gray-300 -rotate-90"/>
                        </button>

                        <div className="border-t border-gray-100 my-2"></div>

                        <button 
                            onClick={handleExport}
                            className="w-full py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between px-4 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-200 transition-colors">
                                    <Download size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800">导出备份</div>
                                    <div className="text-xs text-gray-400">保存计划与记录到文件</div>
                                </div>
                            </div>
                            <FileJson size={18} className="text-gray-300"/>
                        </button>

                        <button 
                            onClick={handleImportClick}
                            className="w-full py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between px-4 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                                    <Upload size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800">导入数据</div>
                                    <div className="text-xs text-gray-400">从备份文件恢复数据</div>
                                </div>
                            </div>
                            <FileJson size={18} className="text-gray-300"/>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json" 
                            onChange={handleFileChange}
                        />

                        <div className="border-t border-gray-100 my-2"></div>

                        <button 
                            onClick={handleReset}
                            className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl flex items-center justify-between px-4 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-200 p-2 rounded-lg text-red-600 group-hover:bg-red-300 transition-colors">
                                    <RotateCcw size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-red-700">重置所有数据</div>
                                    <div className="text-xs text-red-400">清空计划与记录</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

type TimeUnit = 'm:s' | 's' | 'min';

const WorkoutLogger = ({ 
    workout, 
    shoes,
    onClose, 
    onSave 
}: { 
    workout: Workout, 
    shoes: Shoe[],
    onClose: () => void, 
    onSave: (log: RunLog) => void 
}) => {
    // ... segments initialization state ...
    const [segments, setSegments] = useState<LogSegment[]>(() => {
        const flat: LogSegment[] = [];
        workout.blocks.forEach((block) => {
             const reps = block.type === 'repeat' ? block.repeats : 1;
             for (let i = 0; i < reps; i++) {
                 block.steps.forEach((step) => {
                     let defaultDist = 0;
                     let defaultDur = 0;

                     if (step.targetType === 'distance') {
                         defaultDist = step.targetValue; 
                         const paceParts = (step.targetPace || "06:00").split(':').map(Number);
                         const paceSec = paceParts[0] * 60 + (paceParts[1] || 0);
                         defaultDur = defaultDist * paceSec;
                     } else {
                         defaultDur = step.targetValue * 60;
                         const paceParts = (step.targetPace || "06:00").split(':').map(Number);
                         const paceSec = paceParts[0] * 60 + (paceParts[1] || 0);
                         defaultDist = paceSec > 0 ? defaultDur / paceSec : 0;
                     }

                     flat.push({
                         stepType: step.type,
                         actualDistance: parseFloat(defaultDist.toFixed(3)),
                         actualDuration: Math.round(defaultDur),
                         actualPace: step.targetPace || "00:00",
                         restType: step.restType,
                         label: block.type === 'repeat' && ['run','interval','tempo'].includes(step.type) ? `第 ${i+1}/${reps} 组` : undefined,
                         groupId: block.type === 'repeat' ? block.id : undefined
                     });
                 });
             }
        });
        return flat;
    });

    const [feeling, setFeeling] = useState<'great'|'good'|'tired'|'bad'>('good');
    const [notes, setNotes] = useState('');
    const [durationUnit, setDurationUnit] = useState<TimeUnit>('m:s');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    
    // New Shoe State
    const activeShoes = shoes.filter(s => s.isActive);
    const [selectedShoeId, setSelectedShoeId] = useState<string>(activeShoes.length > 0 ? activeShoes[0].id : '');

    // ... existing helpers: toggleGroup, updateSegment, updateGroupValue, TimeInput ...
    const toggleGroup = (groupId: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(groupId)) newSet.delete(groupId);
        else newSet.add(groupId);
        setExpandedGroups(newSet);
    };

    const updateSegment = (index: number, field: keyof LogSegment, value: any) => {
        const newSegs = [...segments];
        newSegs[index] = { ...newSegs[index], [field]: value };
        if (field === 'actualDistance' || field === 'actualDuration') {
            const d = field === 'actualDistance' ? value : newSegs[index].actualDistance;
            const t = field === 'actualDuration' ? value : newSegs[index].actualDuration;
            if (d > 0 && t > 0) {
                const paceSec = t / d;
                const m = Math.floor(paceSec / 60);
                const s = Math.round(paceSec % 60);
                newSegs[index].actualPace = `${m}:${s.toString().padStart(2, '0')}`;
            }
        }
        setSegments(newSegs);
    };

    const updateGroupValue = (groupId: string, field: keyof LogSegment, value: any) => {
        const groupSegs = segments.filter(s => s.groupId === groupId);
        const hasRunSteps = groupSegs.some(s => s.stepType !== 'recover');
        const newSegs = segments.map(seg => {
            if (seg.groupId === groupId) {
                const shouldUpdate = hasRunSteps ? seg.stepType !== 'recover' : true;
                if (shouldUpdate) {
                    const newSeg = { ...seg, [field]: value };
                     if (field === 'actualDistance' || field === 'actualDuration') {
                        const d = field === 'actualDistance' ? value : newSeg.actualDistance;
                        const t = field === 'actualDuration' ? value : newSeg.actualDuration;
                        if (d > 0 && t > 0) {
                            const paceSec = t / d;
                            const m = Math.floor(paceSec / 60);
                            const s = Math.round(paceSec % 60);
                            newSeg.actualPace = `${m}:${s.toString().padStart(2, '0')}`;
                        }
                    }
                    return newSeg;
                }
            }
            return seg;
        });
        setSegments(newSegs);
    };

     const TimeInput = ({ seconds, onChange }: { seconds: number, onChange: (val: number) => void }) => {
        const [textVal, setTextVal] = useState('');
        React.useEffect(() => {
             if (durationUnit === 'm:s') {
                 const m = Math.floor(seconds / 60);
                 const s = Math.round(seconds % 60);
                 setTextVal(`${m}:${s.toString().padStart(2, '0')}`);
             } else if (durationUnit === 'min') {
                 setTextVal((seconds / 60).toFixed(2));
             } else {
                 setTextVal(Math.round(seconds).toString());
             }
        }, [seconds, durationUnit]);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setTextVal(val);
            if (durationUnit === 'm:s') {
                const parts = val.split(':');
                if (parts.length === 2) {
                    const m = parseInt(parts[0]) || 0;
                    const s = parseInt(parts[1]) || 0;
                    onChange(m * 60 + s);
                } else if (!val.includes(':') && val.length > 0) {
                     onChange(parseInt(val) || 0);
                }
            } else if (durationUnit === 'min') {
                onChange((parseFloat(val) || 0) * 60);
            } else {
                onChange(parseFloat(val) || 0);
            }
        };
        return (
             <input type={durationUnit === 'm:s' ? 'text' : 'number'} className="w-full bg-gray-100 rounded p-1 text-center font-bold outline-none focus:ring-1 focus:ring-orange-200" value={textVal} onChange={handleChange} placeholder={durationUnit === 'm:s' ? '0:00' : '0'} />
        );
    }
    // ...

    const groupedSegments = useMemo(() => {
        const groups: { groupId: string | null, items: { seg: LogSegment, index: number }[] }[] = [];
        let currentGroupId: string | null = null;
        let currentGroup: { seg: LogSegment, index: number }[] = [];
        segments.forEach((seg, index) => {
            if (seg.groupId && seg.groupId === currentGroupId) {
                currentGroup.push({ seg, index });
            } else {
                if (currentGroup.length > 0) {
                    groups.push({ groupId: currentGroupId, items: currentGroup });
                }
                currentGroupId = seg.groupId || null;
                currentGroup = [{ seg, index }];
            }
        });
        if (currentGroup.length > 0) {
             groups.push({ groupId: currentGroupId, items: currentGroup });
        }
        return groups;
    }, [segments]);

    const handleComplete = () => {
        const totalDist = segments.reduce((a, b) => a + b.actualDistance, 0);
        const totalTime = segments.reduce((a, b) => a + b.actualDuration, 0);
        const runSegs = segments.filter(s => ['run','interval','tempo','warmup','cooldown'].includes(s.stepType));
        const runDist = runSegs.reduce((a,b) => a + b.actualDistance, 0);
        const runTime = runSegs.reduce((a,b) => a + b.actualDuration, 0);
        let avgPace = "00:00";
        if (runDist > 0) {
             const ps = runTime / runDist;
             const m = Math.floor(ps / 60);
             const s = Math.round(ps % 60);
             avgPace = `${m}:${s.toString().padStart(2, '0')}`;
        }
        const log: RunLog = {
            id: Date.now().toString(),
            date: Date.now(),
            distanceKm: parseFloat(totalDist.toFixed(2)),
            durationSec: totalTime,
            pace: avgPace,
            feeling,
            notes,
            shoeId: selectedShoeId, // Save selected shoe
            structuredData: {
                linkedWorkoutId: workout.id,
                segments,
                avgPace
            }
        };
        onSave(log);
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
             {/* Header */}
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                <button onClick={onClose} className="text-gray-500 font-bold">取消</button>
                <h3 className="font-bold text-lg">记录执行情况</h3>
                <button onClick={handleComplete} className="text-orange-600 font-bold">保存记录</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-32">
                 {/* Table */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                     <div className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200">
                         <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">详细数据</div>
                         <div className="flex bg-white rounded-md border border-gray-200 p-0.5">
                             {(['m:s', 's', 'min'] as TimeUnit[]).map(u => (
                                 <button key={u} onClick={() => setDurationUnit(u)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${durationUnit === u ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>
                                     {u === 'm:s' ? '分:秒' : u === 's' ? '秒' : '分'}
                                 </button>
                             ))}
                         </div>
                     </div>
                     <div className="bg-gray-100 p-2 text-xs font-bold text-gray-500 uppercase tracking-wider grid grid-cols-10 gap-2 text-center">
                         <div className="col-span-3 text-left pl-2">段落</div>
                         <div className="col-span-2">距离</div>
                         <div className="col-span-2">用时</div>
                         <div className="col-span-3">配速</div>
                     </div>
                     <div className="divide-y divide-gray-100">
                         {groupedSegments.map((group, gIdx) => {
                             const isGrouped = group.groupId !== null && group.items.length > 1;
                             if (isGrouped) {
                                 const runItems = group.items.filter(i => i.seg.stepType !== 'recover');
                                 const calcItems = runItems.length > 0 ? runItems : group.items;
                                 const avgDist = calcItems.reduce((a,b) => a + b.seg.actualDistance, 0) / calcItems.length;
                                 const avgTime = calcItems.reduce((a,b) => a + b.seg.actualDuration, 0) / calcItems.length;
                                 const isExpanded = expandedGroups.has(group.groupId!);
                                 let avgPaceStr = "-";
                                 if (avgDist > 0 && avgTime > 0) {
                                     const ps = avgTime / avgDist;
                                     const m = Math.floor(ps / 60);
                                     const s = Math.round(ps % 60);
                                     avgPaceStr = `${m}:${s.toString().padStart(2, '0')}`;
                                 }
                                 const setItem = group.items.find(i => ['interval', 'run', 'tempo'].includes(i.seg.stepType));
                                 const setType = setItem ? setItem.seg.stepType : group.items[0].seg.stepType;
                                 const setLabel = setType === 'interval' ? '间歇' : setType === 'tempo' ? '节奏' : '跑';

                                 return (
                                     <React.Fragment key={gIdx}>
                                         <div className={`grid grid-cols-10 gap-2 p-3 items-center text-sm bg-orange-50/50 border-l-4 border-orange-200`}>
                                             <div className="col-span-3 flex flex-col cursor-pointer" onClick={() => toggleGroup(group.groupId!)}>
                                                 <div className="flex items-center gap-1 font-bold text-gray-800">
                                                     {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                                     <span>{setLabel} + 休</span>
                                                 </div>
                                                 <span className="text-[9px] text-gray-400 pl-4">平均值 ({calcItems.length}组)</span>
                                             </div>
                                             <div className="col-span-2 relative">
                                                 <input type="number" className="w-full bg-white border border-orange-100 rounded p-1 text-center font-bold outline-none focus:ring-1 focus:ring-orange-300" value={parseFloat(avgDist.toFixed(2))} placeholder="-" step="0.01" onChange={(e) => updateGroupValue(group.groupId!, 'actualDistance', parseFloat(e.target.value))} />
                                             </div>
                                             <div className="col-span-2 relative">
                                                  <TimeInput seconds={avgTime} onChange={(val) => updateGroupValue(group.groupId!, 'actualDuration', val)} />
                                             </div>
                                             <div className="col-span-3 text-center font-mono text-gray-600 text-xs">{avgPaceStr}</div>
                                         </div>
                                         {isExpanded && group.items.map(({ seg, index }) => (
                                              <div key={index} className={`grid grid-cols-10 gap-2 p-2 items-center text-sm bg-gray-50 pl-6 border-l-4 border-gray-100`}>
                                                 <div className="col-span-3 flex flex-col">
                                                     <span className={`text-xs ${seg.stepType === 'recover' ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>{seg.stepType === 'recover' ? '休息' : '跑'}</span>
                                                 </div>
                                                 <div className="col-span-2 relative">
                                                     <input type="number" className="w-full bg-white rounded p-1 text-center text-xs outline-none" value={seg.stepType === 'recover' ? '' : seg.actualDistance} onChange={(e) => updateSegment(index, 'actualDistance', parseFloat(e.target.value))} />
                                                 </div>
                                                 <div className="col-span-2 relative">
                                                      <TimeInput seconds={seg.actualDuration} onChange={(val) => updateSegment(index, 'actualDuration', val)} />
                                                 </div>
                                                 <div className="col-span-3 text-center font-mono text-gray-400 text-xs">{seg.actualPace}</div>
                                             </div>
                                         ))}
                                     </React.Fragment>
                                 );
                             } else {
                                 const { seg, index } = group.items[0];
                                 return (
                                     <div key={gIdx} className={`grid grid-cols-10 gap-2 p-3 items-center text-sm ${seg.stepType === 'recover' ? 'bg-gray-50/50' : 'bg-white'}`}>
                                         <div className="col-span-3 flex flex-col">
                                             <span className={`font-bold text-xs ${seg.stepType === 'recover' ? 'text-gray-400' : 'text-gray-800'}`}>{seg.stepType === 'warmup' ? '热身' : seg.stepType === 'cooldown' ? '冷身' : seg.stepType === 'recover' ? '休息' : '跑步'}</span>
                                         </div>
                                         <div className="col-span-2 relative">
                                             <input type="number" className="w-full bg-gray-100 rounded p-1 text-center font-bold outline-none focus:ring-1 focus:ring-orange-200" value={seg.stepType === 'recover' ? '' : seg.actualDistance} placeholder="-" step="0.01" onChange={(e) => updateSegment(index, 'actualDistance', parseFloat(e.target.value))} />
                                         </div>
                                         <div className="col-span-2 relative">
                                              <TimeInput seconds={seg.actualDuration} onChange={(val) => updateSegment(index, 'actualDuration', val)} />
                                         </div>
                                         <div className="col-span-3 text-center font-mono text-gray-600">{seg.actualPace}</div>
                                     </div>
                                 );
                             }
                         })}
                     </div>
                 </div>

                 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">使用跑鞋</label>
                    <div className="relative mb-4">
                        <select 
                            value={selectedShoeId}
                            onChange={(e) => setSelectedShoeId(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none font-medium"
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

                    <label className="block text-sm font-bold text-gray-700 mb-3">整体感受</label>
                    <div className="flex justify-between gap-2 mb-4">
                        {[{ id: 'great', icon: '🤩' }, { id: 'good', icon: '🙂' }, { id: 'tired', icon: '😫' }, { id: 'bad', icon: '😖' }].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFeeling(f.id as any)}
                                className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                                    feeling === f.id ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent'
                                }`}
                            >
                                <span className="text-xl">{f.icon}</span>
                            </button>
                        ))}
                    </div>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="备注：今天天气、心率..."
                        className="w-full bg-gray-50 rounded-lg p-3 outline-none text-sm h-20 resize-none"
                    />
                 </div>
            </div>
        </div>
    );
}

export default Dashboard;