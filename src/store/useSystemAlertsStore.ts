import { create } from 'zustand';
import { LucideIcon } from 'lucide-react';

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  icon?: LucideIcon;
  title: string;
  message: string;
  timestamp: string;
  source?: string;
}

interface SystemAlertsStore {
  alerts: SystemAlert[];
  addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useSystemAlertsStore = create<SystemAlertsStore>((set) => ({
  alerts: [],
  addAlert: (alert) => {
    const newAlert: SystemAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    set((state) => ({
      alerts: [newAlert, ...state.alerts].slice(0, 100), // Keep last 100 alerts
    }));
  },
  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
  },
  clearAlerts: () => {
    set({ alerts: [] });
  },
}));

// Global error handler functions
export const logErrorToSystem = (error: Error, source: string = 'Application') => {
  useSystemAlertsStore.getState().addAlert({
    type: 'error',
    title: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    source,
  });
};

export const logWarningToSystem = (title: string, message: string, source?: string) => {
  useSystemAlertsStore.getState().addAlert({
    type: 'warning',
    title,
    message,
    source,
  });
};

export const logInfoToSystem = (title: string, message: string, source?: string) => {
  useSystemAlertsStore.getState().addAlert({
    type: 'info',
    title,
    message,
    source,
  });
};

export const logSuccessToSystem = (title: string, message: string, source?: string) => {
  useSystemAlertsStore.getState().addAlert({
    type: 'success',
    title,
    message,
    source,
  });
};