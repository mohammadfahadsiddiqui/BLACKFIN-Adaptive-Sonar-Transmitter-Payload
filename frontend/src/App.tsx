// BLACKFIN — Main Application Shell & Route Orchestrator

import React, { useEffect } from 'react';
import { useSystemStore } from './stores/systemStore';
import { wsManager } from './services/websocketClient';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';

import { MissionDashboard } from './pages/MissionDashboard';
import { SonarAnalysis } from './pages/SonarAnalysis';
import { Environment } from './pages/Environment';
import { AdaptiveControl } from './pages/AdaptiveControl';
import { TargetAnalysis } from './pages/TargetAnalysis';
import { Energy } from './pages/Energy';
import { SystemHealth } from './pages/SystemHealth';

import { BootLoadingScreen } from './components/common/BootLoadingScreen';

export function App() {
  const activeTab = useSystemStore((state) => state.activeTab);
  const isBooting = useSystemStore((state) => state.isBooting);

  useEffect(() => {
    // Connect to WebSocket streams
    wsManager.connect();
    return () => {
      wsManager.disconnect();
    };
  }, []);


  const renderActivePage = () => {
    switch (activeTab) {
      case 'mission':
        return <MissionDashboard />;
      case 'sonar':
        return <SonarAnalysis />;
      case 'environment':
        return <Environment />;
      case 'adaptive':
        return <AdaptiveControl />;
      case 'target':
        return <TargetAnalysis />;
      case 'energy':
        return <Energy />;
      case 'health':
        return <SystemHealth />;
      default:
        return <MissionDashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b12] text-slate-100 font-sans select-none bg-sonar-grid relative">
      {/* Cinematic Sonar Boot & Initialization Screen */}
      {isBooting && <BootLoadingScreen />}

      {/* Top Header */}
      <Header />


      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#070b12]/90 relative">
          {renderActivePage()}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;
