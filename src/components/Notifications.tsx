import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  user_id: string;
  type: 'appointment_reminder' | 'health_alert' | 'system';
  content: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'read';
  created_at: string;
}

export const NotificationBadge = () => {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent');

      setCount(count || 0);
    };

    loadUnreadCount();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return count > 0 ? (
    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500/90 hover:bg-red-500">
      {count}
    </Badge>
  ) : null;
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id)
        .eq('user_id', user.id);

      // Update local state
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, status: 'read' } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to realtime notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Optimistically update the UI
          switch (payload.eventType) {
            case 'INSERT':
              setNotifications(prev => [payload.new as Notification, ...prev]);
              break;
            case 'UPDATE':
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
              );
              break;
            case 'DELETE':
              setNotifications(prev =>
                prev.filter(n => n.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <Card className="min-w-[350px] bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-[350px] bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </div>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="bg-secondary/50">
                {notifications.length}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg transition-colors",
                  "bg-muted/30 hover:bg-muted/50 backdrop-blur",
                  notification.status === 'read' ? 'opacity-75' : ''
                )}
              >
                <div className="flex-shrink-0">
                  {notification.type === 'appointment_reminder' && (
                    <Calendar className="h-5 w-5 text-blue-500" />
                  )}
                  {notification.type === 'health_alert' && (
                    <Bell className="h-5 w-5 text-red-500" />
                  )}
                  {notification.type === 'system' && (
                    <Bell className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{notification.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), 'PPp')}
                  </p>
                </div>
                {notification.status !== 'read' && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="flex-shrink-0 rounded-full p-1 hover:bg-muted"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};