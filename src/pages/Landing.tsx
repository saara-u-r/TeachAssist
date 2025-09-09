import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Brain, Calendar, BookOpen } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Tools',
      description: 'Generate quizzes, presentations, and revision materials with advanced AI technology.'
    },
    {
      icon: Calendar,
      title: 'Smart Calendar',
      description: 'Efficiently manage your schedule with automated planning and reminders.'
    },
    {
      icon: BookOpen,
      title: 'Resource Library',
      description: 'Access and organize teaching materials in one centralized location.'
    },
    {
      icon: GraduationCap,
      title: 'Professional Development',
      description: 'Enhance your teaching skills with personalized learning paths.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">TeachAssist</h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-indigo-600 hover:text-indigo-700"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Your AI-Powered Teaching Assistant
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your teaching workflow with AI-powered tools, smart scheduling, and resource management.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <feature.icon className="h-8 w-8 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}