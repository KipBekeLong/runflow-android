import React, { useState } from 'react';
import { ChevronLeft, Zap, Target, Calendar, Activity, Edit2, Layers } from './Icons';
import { generateRunningPlan } from '../services/geminiService';
import { RunningPlan, WeekPlan, Workout, RunType } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Simple UUID generator fallback if package fails in environment
const generateId = () => Math.random().toString(36).substr(2, 9);

interface PlanCreatorProps {
  onBack: () => void;
  onPlanCreated: (plan: RunningPlan) => void;
}

const PlanCreator: React.FC<PlanCreatorProps> = ({ onBack, onPlanCreated }) => {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI Form Data
  const [goal, setGoal] = useState('5公里');
  const [level, setLevel] = useState('初学者');
  const [weeks, setWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);

  // Manual Form Data
  const [manualName, setManualName] = useState('我的自制计划');
  const [manualWeeks, setManualWeeks] = useState(4);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const plan = await generateRunningPlan(goal, level, weeks, daysPerWeek);
      onPlanCreated(plan);
    } catch (err: any) {
      console.error(err);
      setError('生成计划失败，请检查网络或重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCreate = () => {
    // Create an empty skeleton plan
    const newPlan: RunningPlan = {
      id: generateId(),
      name: manualName,
      goal: '自定义',
      level: '自定义',
      totalWeeks: manualWeeks,
      weeks: Array.from({ length: manualWeeks }, (_, i) => ({
        weekNumber: i + 1,
        workouts: []
      })),
      createdAt: Date.now()
    };
    onPlanCreated(newPlan);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-pulse">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <Zap className="text-orange-500 animate-spin" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">正在设计您的专属计划...</h2>
        <p className="text-gray-500 text-sm">Gemini 正在分析您的目标并安排训练课程。</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 px-4 py-4 flex items-center border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center pr-8">创建新计划</h1>
      </div>

      {/* Mode Switcher */}
      <div className="px-6 mt-6 mb-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
          >
            <Zap size={16} /> 智能生成
          </button>
          <button 
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <Edit2 size={16} /> 手动制定
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {mode === 'ai' ? (
          <>
            {/* AI Flow */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">当前水平</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['初学者', '进阶者', '专业跑者'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      level === l 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-orange-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">跑步目标</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['5公里', '10公里', '半程马拉松', '全程马拉松', '减肥健身', '提升速度'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                      goal === g 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-orange-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">计划时长 & 频率</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">持续周数</span>
                    <span className="text-sm font-bold text-orange-600">{weeks} 周</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="16" 
                    value={weeks} 
                    onChange={(e) => setWeeks(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">每周天数</span>
                    <span className="text-sm font-bold text-orange-600">{daysPerWeek} 天</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {[1,2,3,4,5,6,7].map(d => (
                       <button
                        key={d}
                        onClick={() => setDaysPerWeek(d)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          daysPerWeek === d 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <Zap size={20} className="text-yellow-400 fill-current" />
              生成智能计划
            </button>
          </>
        ) : (
          <>
            {/* Manual Flow */}
            <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">计划名称</label>
                  <input 
                    type="text" 
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
                    placeholder="例如：秋季马拉松备赛"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">计划时长</span>
                    <span className="text-sm font-bold text-gray-900">{manualWeeks} 周</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="24" 
                    value={manualWeeks} 
                    onChange={(e) => setManualWeeks(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-2">创建后，您可以自由添加每周的训练内容。</p>
                </div>

                <button
                  onClick={handleManualCreate}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-8"
                >
                  <Edit2 size={20} />
                  创建空白计划
                </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default PlanCreator;