// Toast: lightweight global toast via a Zustand store + host component.
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { create } from 'zustand';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  tone: ToastTone;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

// Call useToast.getState().show(...) from anywhere to surface feedback.
export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  show: (message, tone = 'info') => set({ message, tone }),
  hide: () => set({ message: null }),
}));

const tones: Record<ToastTone, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-foreground',
};

export function ToastHost() {
  const { message, tone, hide } = useToast();
  // Auto-dismiss after a short delay whenever a message appears.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2500);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) return null;
  return (
    <View className="absolute inset-x-4 bottom-10 items-center">
      <View className={`rounded-full px-4 py-2 ${tones[tone]}`}>
        <Text className="text-sm font-medium text-white">{message}</Text>
      </View>
    </View>
  );
}
