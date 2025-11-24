import React, { useState } from 'react';
import { RunLog, LogSegment } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from './Icons';

interface HistoryProps {
  logs: RunLog[];
}

const History: React.FC<HistoryProps> = ({ logs }) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  const chartData = logs
    .sort((a, b) => a.date - b.date)
    .slice(-7)
    .map(log => ({
      date: format(new Date(log.date), 'MM/dd'),
      distance: log.distanceKm
    }));

  const totalDistance = logs.reduce((acc, log) => acc + log.distanceKm, 0);
  const totalTime = logs.reduce((acc, log) => acc + log.durationSec, 0);

  const toggleExpand = (id: string) => {
      setExpandedLogId(expandedLogId === id ? null : id);
  }

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(expandedGroupIds);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      setExpandedGroupIds(newSet);
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const groupSegments = (segments: LogSegment[]) => {
      const groups: { groupId: string | null, items: LogSegment[] }[] = [];
      let currentGroupId: string | null = null;
      let currentGroup: LogSegment[] = [];

      segments.forEach((seg) => {
          if (seg.groupId && seg.groupId === currentGroupId) {
              currentGroup.push(seg);
          } else {
              if (currentGroup.length > 0) {
                  groups.push({ groupId: currentGroupId, items: currentGroup });
              }
              currentGroupId = seg.groupId || null;
              currentGroup = [seg];
          }
      });
      if (currentGroup.length > 0) {
            groups.push({ groupId: currentGroupId, items: currentGroup });
      }
      return groups;
  };

  return (
    <div className="pb-24 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">历史记录</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs mb-1">总里程</div>
            <div className="text-2xl font-bold text-gray-900">{totalDistance.toFixed(1)} <span className="text-sm font-normal text-gray-400">km</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs mb-1">总时长</div>
            <div className="text-2xl font-bold text-gray-900">{(totalTime / 3600).toFixed(1)} <span className="text-sm font-normal text-gray-400">小时</span></div>
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 h-64">
             <h3 className="font-bold text-gray-800 mb-4">近期趋势</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                    <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#f97316' : '#e5e7eb'} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 text-center text-gray-400">
            暂无图表数据
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">所有活动</h3>
        {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
                还没有跑步记录，快去跑一次吧！
            </div>
        ) : (
            [...logs].sort((a, b) => b.date - a.date).map(log => (
                <div key={log.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <div onClick={() => toggleExpand(log.id)} className="p-4 flex items-center justify-between cursor-pointer bg-white active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-xl">
                                {{'great': '🤩', 'good': '🙂', 'tired': '😫', 'bad': '😖'}[log.feeling]}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{log.distanceKm} km</div>
                                <div className="text-xs text-gray-400">{format(new Date(log.date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-sm text-gray-600">
                                {Math.floor(log.durationSec / 60)}:{String(log.durationSec % 60).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-400">{log.pace} /km</div>
                        </div>
                    </div>

                    {expandedLogId === log.id && log.structuredData && (
                        <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2">
                             {log.notes && (
                                 <div className="text-sm text-gray-600 mb-4 bg-white p-3 rounded-lg border border-gray-100 italic">
                                     "{log.notes}"
                                 </div>
                             )}
                             
                             <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                 <div className="grid grid-cols-4 bg-gray-100 p-2 text-xs font-bold text-gray-500 text-center">
                                     <div className="text-left pl-2">段落</div>
                                     <div>距离 (km)</div>
                                     <div>用时</div>
                                     <div>配速</div>
                                 </div>
                                 <div className="divide-y divide-gray-100">
                                     {groupSegments(log.structuredData.segments).map((group, gIdx) => {
                                         const isGrouped = group.groupId !== null && group.items.length > 1;
                                         
                                         if (isGrouped) {
                                             // Calculate averages based on NON-REST steps only (if possible)
                                             const runItems = group.items.filter(i => i.stepType !== 'recover');
                                             const calcItems = runItems.length > 0 ? runItems : group.items;

                                             const avgDist = calcItems.reduce((a,b) => a + b.actualDistance, 0) / calcItems.length;
                                             const avgTime = calcItems.reduce((a,b) => a + b.actualDuration, 0) / calcItems.length;
                                             
                                             const isExpanded = expandedGroupIds.has(group.groupId! + log.id);
                                             
                                             let avgPace = "-";
                                             if (avgDist > 0 && avgTime > 0) {
                                                  const ps = avgTime / avgDist;
                                                  const m = Math.floor(ps / 60);
                                                  const s = Math.round(ps % 60);
                                                  avgPace = `${m}:${s.toString().padStart(2, '0')}`;
                                             }

                                             const setLabel = runItems.length > 0 ? (runItems[0].stepType === 'interval' ? '间歇' : '跑') : '组';

                                             return (
                                                 <React.Fragment key={gIdx}>
                                                     <div 
                                                        onClick={(e) => toggleGroup(group.groupId! + log.id, e)}
                                                        className="grid grid-cols-4 p-3 text-xs text-center items-center cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors border-l-2 border-orange-300 my-0.5"
                                                     >
                                                          <div className="text-left pl-2 font-bold flex items-center gap-1 text-orange-800">
                                                              {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                                              <span>{setLabel} × {calcItems.length}</span>
                                                          </div>
                                                          <div className="font-medium text-gray-700 flex flex-col items-center">
                                                              {avgDist.toFixed(2)}
                                                              <span className="text-[9px] text-gray-400 font-normal scale-90">平均</span>
                                                          </div>
                                                          <div className="font-medium text-gray-700 flex flex-col items-center">
                                                              {formatSeconds(avgTime)}
                                                              <span className="text-[9px] text-gray-400 font-normal scale-90">平均</span>
                                                          </div>
                                                          <div className="font-medium text-gray-700 font-mono flex flex-col items-center">
                                                              {avgPace}
                                                              <span className="text-[9px] text-gray-400 font-sans font-normal scale-90">平均</span>
                                                          </div>
                                                     </div>
                                                     {isExpanded && group.items.map((seg, i) => (
                                                          <div key={i} className="grid grid-cols-4 p-2 text-xs text-center items-center bg-gray-50 text-gray-600 border-b border-gray-100 last:border-0 pl-6">
                                                              <div className="text-left flex items-center gap-1">
                                                                  <span className={`px-1 py-0.5 rounded text-[10px] ${seg.stepType === 'recover' ? 'bg-gray-200 text-gray-500' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                                                    {seg.stepType === 'recover' ? '休' : '跑'}
                                                                  </span>
                                                              </div>
                                                              <div>{seg.stepType === 'recover' ? '-' : seg.actualDistance.toFixed(2)}</div>
                                                              <div>{formatSeconds(seg.actualDuration)}</div>
                                                              <div className="font-mono text-gray-500">{seg.actualPace}</div>
                                                          </div>
                                                     ))}
                                                 </React.Fragment>
                                             )
                                         } else {
                                             const seg = group.items[0];
                                             return (
                                                <div key={gIdx} className={`grid grid-cols-4 p-3 text-xs text-center items-center font-mono ${seg.stepType === 'recover' ? 'text-gray-400 bg-gray-50' : 'text-gray-800'}`}>
                                                    <div className="text-left pl-2 font-sans font-bold flex flex-col">
                                                        <span>{seg.stepType === 'warmup' ? '热身' : seg.stepType === 'cooldown' ? '冷身' : seg.stepType === 'recover' ? '休息' : '跑步'}</span>
                                                    </div>
                                                    <div>{seg.stepType === 'recover' ? '-' : seg.actualDistance.toFixed(2)}</div>
                                                    <div>{formatSeconds(seg.actualDuration)}</div>
                                                    <div>{seg.actualPace}</div>
                                                </div>
                                             );
                                         }
                                     })}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default History;