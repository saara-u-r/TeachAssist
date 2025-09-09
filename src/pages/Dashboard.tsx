import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, BookOpen, Brain, Clock, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface UserProfile {
  full_name: string;
  school_name: string;
  subjects_taught: string[];
  grade_levels: string[];
  years_of_experience: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: string;
  completed: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('full_name, school_name, subjects_taught, grade_levels, years_of_experience')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: upcomingEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      if (!user?.id) return [];

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const quickStats = [
    { icon: CalendarIcon, label: 'Upcoming Events', value: upcomingEvents?.length || '0' },
    { icon: BookOpen, label: 'Subjects', value: profile?.subjects_taught?.length || '0' },
    { icon: Brain, label: 'Grade Levels', value: profile?.grade_levels?.length || '0' },
    { icon: Clock, label: 'Years Experience', value: profile?.years_of_experience || '0' }
  ];

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="space-y-6">
      {profile && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome, {profile.full_name || 'Teacher'}!
          </h2>
          <p className="text-gray-600 mt-1">{profile.school_name}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.subjects_taught?.map((subject) => (
              <span key={subject} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Schedule */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Schedule</h2>
            <Button onClick={() => navigate('/calendar')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingEvents?.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-gray-900 font-medium">{event.title}</span>
                    {event.description && (
                      <p className="text-sm text-gray-500">{event.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {formatEventDate(event.start_time)}
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    event.type === 'class' ? 'bg-blue-100 text-blue-800' :
                    event.type === 'lab' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
            {(!upcomingEvents || upcomingEvents.length === 0) && (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}