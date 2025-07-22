'use client';

import React, { useState } from 'react';
import { ChatbotSimulation } from './ChatbotSimulation';
import { EcommercePlayground } from './EcommercePlayground';
import { ScenarioLibrary } from './ScenarioLibrary';
import { PerformanceMetrics } from './PerformanceMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type DemoTab = 'chatbot' | 'ecommerce' | 'scenarios' | 'metrics';

export interface DemoEnvironmentProps {
  className?: string;
}

export const DemoEnvironment: React.FC<DemoEnvironmentProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<DemoTab>('chatbot');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  // Handle scenario selection
  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setActiveTab('chatbot'); // Switch to chatbot tab when scenario is selected
  };

  // Handle performance data update
  const handlePerformanceUpdate = (data: any) => {
    setPerformanceData(data);
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 py-8 bg-white rounded-xl shadow-lg ${className}`}>
      <h2 className="text-3xl font-bold text-center mb-8">Interactive Demo Environment</h2>
      
      <Tabs defaultValue="chatbot" value={activeTab} onValueChange={(value) => setActiveTab(value as DemoTab)}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="chatbot">Chatbot Simulation</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce Store</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Library</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chatbot" className="mt-4">
          <ChatbotSimulation 
            scenarioId={selectedScenario} 
            onPerformanceUpdate={handlePerformanceUpdate} 
          />
        </TabsContent>
        
        <TabsContent value="ecommerce" className="mt-4">
          <EcommercePlayground />
        </TabsContent>
        
        <TabsContent value="scenarios" className="mt-4">
          <ScenarioLibrary onScenarioSelect={handleScenarioSelect} />
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-4">
          <PerformanceMetrics data={performanceData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemoEnvironment;
