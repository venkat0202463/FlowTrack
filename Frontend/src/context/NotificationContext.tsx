import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string; // Serialized date
  read: boolean;
  iconId: 'zap' | 'check' | 'shield' | 'clock';
  color: string;
  textColor: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: Notification['type'], iconId?: Notification['iconId']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('flowtrack_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse notifications", e);
    }
    
    // Initial Tactical Alerts if none saved
    return [
      { id: '1', title: 'Sprint Cycle Launched', message: 'All nodes synced to production', type: 'info', timestamp: new Date().toISOString(), read: false, iconId: 'zap', color: '#DEEBFF', textColor: '#0052CC' },
      { id: '2', title: 'Validation Approved', message: 'Node FT-4 architecture verified', type: 'success', timestamp: new Date().toISOString(), read: false, iconId: 'check', color: '#E3FCEF', textColor: '#36B37E' },
      { id: '3', title: 'System Heartbeat', message: 'Regional sectors standing by', type: 'warning', timestamp: new Date().toISOString(), read: false, iconId: 'shield', color: '#F4F5F7', textColor: '#42526E' }
    ];
  });

  // Persist to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('flowtrack_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((
    title: string, 
    message: string, 
    type: Notification['type'] = 'info',
    iconId: Notification['iconId'] = 'clock'
  ) => {
    const styles = {
      success: { color: '#E3FCEF', textColor: '#36B37E', defIcon: 'check' },
      error: { color: '#FFEBE6', textColor: '#BF2600', defIcon: 'shield' },
      warning: { color: '#FFF0B3', textColor: '#FF8B00', defIcon: 'zap' },
      info: { color: '#DEEBFF', textColor: '#0052CC', defIcon: 'clock' }
    };

    const style = styles[type] || styles.info;
    const finalIconId = iconId === 'clock' && type === 'success' ? 'check' : iconId;

    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      iconId: finalIconId as any,
      color: style.color,
      textColor: style.textColor
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
