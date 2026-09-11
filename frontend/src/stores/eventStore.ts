// BLACKFIN — Event Log Store (Zustand)

import { create } from 'zustand';
import { SystemEvent, EventCategory } from '../types';

interface EventStoreState {
  events: SystemEvent[];
  activeCategory: string;
  addEvent: (event: SystemEvent) => void;
  setEvents: (events: SystemEvent[]) => void;
  setActiveCategory: (cat: string) => void;
  clearEvents: () => void;
}

export const useEventStore = create<EventStoreState>((set) => ({
  events: [
    {
      timestamp: Date.now() / 1000 - 10,
      category: 'system' as EventCategory,
      message: 'BLACKFIN mission control engine initialized in SIMULATION mode',
    },
    {
      timestamp: Date.now() / 1000 - 8,
      category: 'sonar' as EventCategory,
      message: 'Acoustic transducer transmitter active — 100 kHz LFM chirp',
    },
    {
      timestamp: Date.now() / 1000 - 5,
      category: 'adaptation' as EventCategory,
      message: 'Adaptive loop engaged: Nominal shallow clear water rule match',
    },
  ],
  activeCategory: 'all',

  addEvent: (event) =>
    set((state) => {
      const events = [event, ...state.events];
      if (events.length > 500) events.pop();
      return { events };
    }),

  setEvents: (events) => set({ events }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  clearEvents: () => set({ events: [] }),
}));
