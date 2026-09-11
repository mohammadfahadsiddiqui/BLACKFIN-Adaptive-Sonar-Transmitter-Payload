// BLACKFIN — Real-time Mission Event & Telemetry Log

import React from 'react';
import { useEventStore } from '../../stores/eventStore';
import { FileText, BrainCircuit, Waves, Compass, ShieldAlert, Cpu, Trash2 } from 'lucide-react';

export const EventLog: React.FC<{ maxItems?: number }> = ({ maxItems = 100 }) => {
  const events = useEventStore((state) => state.events);
  const activeCategory = useEventStore((state) => state.activeCategory);
  const setActiveCategory = useEventStore((state) => state.setActiveCategory);
  const clearEvents = useEventStore((state) => state.clearEvents);

  const categories = [
    { id: 'all', label: 'ALL EVENTS' },
    { id: 'adaptation', label: 'ADAPTATION' },
    { id: 'sonar', label: 'SONAR' },
    { id: 'environment', label: 'ENVIRONMENT' },
    { id: 'target', label: 'TARGET' },
    { id: 'system', label: 'SYSTEM' },
  ];

  const filteredEvents = activeCategory === 'all'
    ? events
    : events.filter((e) => e.category === activeCategory);

  const displayedEvents = filteredEvents.slice(0, maxItems);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'adaptation':
        return {
          icon: BrainCircuit,
          class: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
        };
      case 'sonar':
        return {
          icon: Waves,
          class: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
        };
      case 'environment':
        return {
          icon: Compass,
          class: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
        };
      case 'target':
        return {
          icon: ShieldAlert,
          class: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
        };
      default:
        return {
          icon: Cpu,
          class: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${Math.floor(d.getMilliseconds() / 100)}`;
  };

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Mission Event & Adaptation Telemetry Audit Log
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            {filteredEvents.length} RECORDS
          </span>
          <button
            onClick={clearEvents}
            title="Clear Event Log"
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 mb-2.5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all ${
              activeCategory === c.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/70 font-bold'
                : 'bg-[#080d17] text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {displayedEvents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-mono text-xs">
            No events recorded in this category.
          </div>
        ) : (
          displayedEvents.map((evt, idx) => {
            const badge = getCategoryBadge(evt.category);
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="bg-[#080d17]/80 border border-slate-800/80 rounded p-2 flex items-start gap-2.5 hover:border-slate-700 transition-all text-xs"
              >
                <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">
                  {formatTime(evt.timestamp)}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border shrink-0 inline-flex items-center gap-1 ${badge.class}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {evt.category}
                </span>
                <span className="text-slate-200 font-medium leading-tight">
                  {evt.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
