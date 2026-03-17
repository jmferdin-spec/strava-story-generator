'use client';

import { useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import {
  formatTime, formatPaceValue, formatDateShort,
} from '@/lib/strava';
import type { StravaActivity, UnitSystem } from '@/types';

function PickerCard({
  activity,
  isSelected,
  onSelect,
  units,
}: {
  activity: StravaActivity;
  isSelected: boolean;
  onSelect: () => void;
  units: UnitSystem;
}) {
  const distanceVal = units === 'imperial'
    ? (activity.distance / 1609.344).toFixed(2)
    : (activity.distance / 1000).toFixed(2);
  const distanceUnit = units === 'imperial' ? 'mi' : 'km';
  const pace = formatPaceValue(activity.average_speed, units);
  const date = formatDateShort(activity.start_date_local);
  const time = formatTime(activity.moving_time);

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3 transition-all"
      style={{
        background: isSelected ? 'rgba(252,76,2,0.08)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex-1 text-left">
        <p className="text-sm font-medium" style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}>
          {activity.name}
        </p>
        <p className="text-[11px] text-[#6B6B78] mt-0.5">
          {date}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}>
          {distanceVal} <span className="text-[10px] text-[#6B6B78] font-normal">{distanceUnit}</span>
        </p>
        <p className="text-[10px] text-[#6B6B78] mt-0.5">
          {time} • {pace}
        </p>
      </div>
      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-[#FC4C02] flex-shrink-0" />
      )}
    </button>
  );
}

export default function ActivityPickerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { activities, selectedActivity, selectActivity, config } = useStoryStore();
  const units = (config.units || 'imperial') as UnitSystem;

  const handleSelect = useCallback((activity: StravaActivity) => {
    selectActivity(activity);
    onClose();
  }, [selectActivity, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-h-[70vh] flex flex-col rounded-t-2xl overflow-hidden animate-slide-up"
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          maxWidth: 600,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-sm font-medium text-[#E8E8EA]">Select a Run</p>
            <p className="text-[11px] text-[#6B6B78]">{activities.length} activities</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B78] hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8"/>
            </svg>
          </button>
        </div>
        <div className="flex justify-center py-1">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.1)]" />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activities.map((activity) => (
            <PickerCard
              key={activity.id}
              activity={activity}
              isSelected={selectedActivity?.id === activity.id}
              onSelect={() => handleSelect(activity)}
              units={units}
            />
          ))}
          {activities.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-[#6B6B78]">No activities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SelectedRunBar({ onTap }: { onTap: () => void }) {
  const { selectedActivity, config } = useStoryStore();
  const units = (config.units || 'imperial') as UnitSystem;

  if (!selectedActivity) {
    return (
      <button
        onClick={onTap}
        className="w-full px-4 py-3 text-left transition-all"
        style={{
          background: '#111113',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-xs text-[#FC4C02] font-medium">Tap to select a run</p>
      </button>
    );
  }

  const distanceVal = units === 'imperial'
    ? (selectedActivity.distance / 1609.344).toFixed(2)
    : (selectedActivity.distance / 1000).toFixed(2);
  const distanceUnit = units === 'imperial' ? 'mi' : 'km';
  const time = formatTime(selectedActivity.moving_time);

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-2.5 transition-all"
      style={{
        background: '#111113',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] flex-shrink-0" />
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-medium text-[#E8E8EA] truncate">{selectedActivity.name}</p>
      </div>
      <p className="text-[11px] text-[#6B6B78] flex-shrink-0">
        {distanceVal} {distanceUnit} • {time}
      </p>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#6B6B78" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0">
        <path d="M3 5l3 3 3-3"/>
      </svg>
    </button>
  );
}
