import React, { useState, useEffect } from 'react';
import { ViewState, RunningPlan, RunLog, BackupData, Shoe } from './types';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import PlanCreator from './components/PlanCreator';
import PlanView from './components/PlanView';
import RunTracker from './components/RunTracker';
import History from './components/History';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // Data State (Persisted)
  const [currentPlan, setCurrentPlan] = useState<RunningPlan | null>(null);
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('runflow_plan');
    const savedLogs = localStorage.getItem('runflow_logs');
    const savedShoes = localStorage.getItem('runflow_shoes');
    
    if (savedPlan) setCurrentPlan(JSON.parse(savedPlan));
    if (savedLogs) setRunLogs(JSON.parse(savedLogs));
    if (savedShoes) setShoes(JSON.parse(savedShoes));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (currentPlan) localStorage.setItem('runflow_plan', JSON.stringify(currentPlan));
    else localStorage.removeItem('runflow_plan');
  }, [currentPlan]);

  useEffect(() => {
    localStorage.setItem('runflow_logs', JSON.stringify(runLogs));
  }, [runLogs]);

  useEffect(() => {
    localStorage.setItem('runflow_shoes', JSON.stringify(shoes));
  }, [shoes]);

  // Handlers
  const handlePlanCreated = (plan: RunningPlan) => {
    setCurrentPlan(plan);
    setCurrentView('plan');
  };

  const handleUpdatePlan = (updatedPlan: RunningPlan) => {
    setCurrentPlan(updatedPlan);
  };

  const handleDeletePlan = () => {
    if (confirm('确定要删除当前计划吗？')) {
        setCurrentPlan(null);
        setCurrentView('dashboard');
    }
  };

  const handleSaveRun = (log: RunLog) => {
    setRunLogs(prev => [log, ...prev]);

    // Update Shoe Mileage
    if (log.shoeId) {
        setShoes(prev => prev.map(s => 
            s.id === log.shoeId 
            ? { ...s, distance: s.distance + log.distanceKm } 
            : s
        ));
    }

    // Automatically mark the plan workout as completed if linked
    if (log.structuredData?.linkedWorkoutId && currentPlan) {
        const newPlan = { ...currentPlan };
        let updated = false;
        
        // Deep search to find and update the workout
        newPlan.weeks = newPlan.weeks.map(week => ({
            ...week,
            workouts: week.workouts.map(workout => {
                if (workout.id === log.structuredData?.linkedWorkoutId) {
                    updated = true;
                    return { ...workout, isCompleted: true };
                }
                return workout;
            })
        }));

        if (updated) {
            setCurrentPlan(newPlan);
        }
    }

    setCurrentView('history');
  };

  const handleSaveShoe = (shoe: Shoe) => {
    setShoes(prev => {
        const index = prev.findIndex(s => s.id === shoe.id);
        if (index >= 0) {
            const newShoes = [...prev];
            newShoes[index] = shoe;
            return newShoes;
        }
        return [...prev, shoe];
    });
  };

  const handleDeleteShoe = (id: string) => {
      setShoes(prev => prev.filter(s => s.id !== id));
  };

  const handleImportData = (data: BackupData) => {
      if (data.plan) setCurrentPlan(data.plan);
      if (data.logs) setRunLogs(data.logs);
      if (data.shoes) setShoes(data.shoes);
  };

  const handleResetData = () => {
      setCurrentPlan(null);
      setRunLogs([]);
      setShoes([]);
      localStorage.removeItem('runflow_plan');
      localStorage.removeItem('runflow_logs');
      localStorage.removeItem('runflow_shoes');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
            <Dashboard 
                plan={currentPlan} 
                logs={runLogs} 
                shoes={shoes}
                onChangeView={setCurrentView} 
                onSaveRun={handleSaveRun} 
                onImportData={handleImportData}
                onResetData={handleResetData}
                onSaveShoe={handleSaveShoe}
                onDeleteShoe={handleDeleteShoe}
            />
        );
      case 'create-plan':
        return <PlanCreator onBack={() => setCurrentView('dashboard')} onPlanCreated={handlePlanCreated} />;
      case 'plan':
        return currentPlan ? (
          <PlanView 
            plan={currentPlan} 
            onUpdatePlan={handleUpdatePlan} 
            onDeletePlan={handleDeletePlan} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">暂无计划</h2>
            <p className="text-gray-500 mb-6">创建一个计划来开始你的旅程。</p>
            <button 
                onClick={() => setCurrentView('create-plan')}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
            >
                创建计划
            </button>
          </div>
        );
      case 'record':
        return <RunTracker shoes={shoes} onSaveRun={handleSaveRun} onCancel={() => setCurrentView('dashboard')} />;
      case 'history':
        return <History logs={runLogs} />;
      default:
        return (
            <Dashboard 
                plan={currentPlan} 
                logs={runLogs} 
                shoes={shoes}
                onChangeView={setCurrentView} 
                onSaveRun={handleSaveRun} 
                onImportData={handleImportData}
                onResetData={handleResetData}
                onSaveShoe={handleSaveShoe}
                onDeleteShoe={handleDeleteShoe}
            />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 shadow-2xl relative overflow-hidden flex flex-col">
       {/* Main Content Area */}
       <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {renderContent()}
       </main>

       {/* Navigation (Hide on specific full screen views like record) */}
       {currentView !== 'record' && currentView !== 'create-plan' && (
         <NavBar currentView={currentView} onChangeView={setCurrentView} />
       )}
    </div>
  );
};

export default App;