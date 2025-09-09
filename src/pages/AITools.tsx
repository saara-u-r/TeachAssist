import React, { useState } from 'react';
import { Wand2, FileSpreadsheet, PresentationIcon, Brain } from 'lucide-react';
import QuizGenerator from '../components/quiz/QuizGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AITools() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const tools = [
    {
      icon: FileSpreadsheet,
      title: 'Quiz Generator',
      description: 'Create customized quizzes for any subject with AI-powered question generation.',
      action: 'Create Quiz',
      id: 'quiz'
    },
    {
      icon: PresentationIcon,
      title: 'Presentation Generator',
      description: 'Generate professional presentation slides with key points and visuals.',
      action: 'Create Presentation',
      id: 'presentation'
    },
    {
      icon: Brain,
      title: 'Revision Material Generator',
      description: 'Create concise study guides and revision materials for your students.',
      action: 'Create Materials',
      id: 'revision'
    },
    {
      icon: Wand2,
      title: 'Stress Management Analyzer',
      description: 'Get personalized recommendations for managing work-related stress.',
      action: 'Analyze Stress',
      id: 'stress'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {tools.map((tool) => (
          <div key={tool.title} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <tool.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{tool.title}</h3>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-500">{tool.description}</p>
              </div>
              <div className="mt-6">
                <button 
                  onClick={() => setActiveDialog(tool.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {tool.action}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={activeDialog === 'quiz'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Quiz Generator</DialogTitle>
          </DialogHeader>
          <QuizGenerator />
        </DialogContent>
      </Dialog>
    </div>
  );
}