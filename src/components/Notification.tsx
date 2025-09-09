import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { addMinutes, isBefore, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  start_time: string;
}

interface NotificationPreferences {
  event_reminder: number;
  notification_style: 'popup' | 'glow' | 'standard';
}

export default function NotificationSystem() {
  const { user } = useAuth();

  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      if (!user?.id) return { event_reminder: 30, notification_style: 'popup' };

      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return { event_reminder: 30, notification_style: 'popup' };
      }

      return data?.notification_preferences || { event_reminder: 30, notification_style: 'popup' };
    },
    enabled: !!user?.id
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      if (!user?.id) return [];

      const now = new Date();
      const reminderMinutes = preferences?.event_reminder || 30;
      const reminderTime = addMinutes(now, reminderMinutes);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_time')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('start_time', now.toISOString())
        .lte('start_time', reminderTime.toISOString());

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 60000 // Refetch every minute
  });

  useEffect(() => {
    if (!events || !preferences || !user?.id) return;

    events.forEach(event => {
      const eventTime = parseISO(event.start_time);
      const now = new Date();
      const minutesUntilEvent = Math.floor((eventTime.getTime() - now.getTime()) / 60000);

      // Only show notification if the event is in the future and within the reminder window
      if (isBefore(now, eventTime) && minutesUntilEvent <= preferences.event_reminder) {
        const message = `Upcoming event: ${event.title} in ${minutesUntilEvent} minutes`;

        switch (preferences.notification_style) {
          case 'popup':
            toast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Event Reminder
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), {
              duration: 5000,
            });
            break;

          case 'glow':
            document.body.classList.add('notification-glow');
            setTimeout(() => {
              document.body.classList.remove('notification-glow');
            }, 2000);
            toast(message);
            break;

          default:
            toast(message);
        }
      }
    });
  }, [events, preferences, user?.id]);

  return null;
}