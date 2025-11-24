import React from 'react';
import { Activity, Calendar, Play, BarChart2 } from './Icons';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'dashboard', label: '首页', icon: Activity },
    { id: 'plan', label: '计划', icon: Calendar },
    { id: 'record', label: '开跑', icon: Play }, // Special middle button styling could be applied
    { id: 'history', label: '记录', icon: BarChart2 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = currentView === item.id || (currentView === 'create-plan' && item.id === 'plan');
        const Icon = item.icon;
        
        if (item.id === 'record') {
           return (
             <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center -mt-8`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'}`}>
                <Icon size={28} fill="currentColor" />
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
           )
        }

        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as ViewState)}
            className="flex flex-col items-center justify-center w-12"
          >
            <Icon 
              size={24} 
              className={`transition-colors ${isActive ? 'text-orange-600' : 'text-gray-400'}`} 
            />
            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NavBar;