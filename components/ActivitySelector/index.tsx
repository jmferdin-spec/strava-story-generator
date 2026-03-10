'use client';

import { useStoryStore } from '@/store/useStoryStore';
import {
  formatDistance,
  formatTime,
  formatPaceValue,
  formatElevation,
  formatDateShort,
} from '@/lib/strava';
import type { StravaActivity } from '@/types';

function ActivityCard({
  activity,
  isSelected,
  onSelect,
}: {
  activity: StravaActivity;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const distanceKm = (activity.distance / 1000).toFixed(2);
  const pace = formatPaceValue(activity.average_speed);
  const elevation = formatElevation(activity.total_elevation_gain);
  const date = formatDateShort(activity.start_date_local);
  const time = formatTime(activity.moving_time);

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-xl transition-all duration-150 group relative"
      style={{
        background: isSelected
          ? 'rgba(252, 76, 2, 0.08)'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      {isSelected && (
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ background: '#FC4C02' }}
        />
      )}

      {/* Activity name + date */}
      <div className="flex items-start justify-between gap-2 mb-2.5 pl-2">
        <p
          className="text-sm font-medium leading-tight line-clamp-1"
          style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}
        >
          {activity.name}
        </p>
        <span className="text-[10px] text-[#6B6B78] whitespace-nowrap flex-shrink-0 mt-0.5">
          {date}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 pl-2">
        {/* Distance - primary stat */}
        <div>
          <span
            className="text-lg font-bold leading-none"
            style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}
          >
            {distanceKm}
          </span>
          <span className="text-[10px] text-[#6B6B78] ml-1">km</span>
        </div>

        <div className="w-px h-6 bg-[rgba(255,255,255,0.06)]" />

        {/* Secondary stats */}
        <div className="flex gap-3 flex-1">
          <StatPill label="Time" value={time} />
          <StatPill label="Pace" value={`${pace}/km`} />
          <StatPill label="↑" value={elevation} />
        </div>
      </div>
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-[#3A3A44] uppercase tracking-wider">{label}</span>
      <span className="text-xs text-[#9B9BA8] font-medium">{value}</span>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="p-3 rounded-xl border border-[rgba(255,255,255,0.05)] space-y-2">
      <div className="flex justify-between">
        <div className="shimmer h-3 w-32 rounded" />
        <div className="shimmer h-3 w-20 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="shimmer h-5 w-16 rounded" />
        <div className="shimmer h-5 w-12 rounded" />
        <div className="shimmer h-5 w-12 rounded" />
      </div>
    </div>
  );
}

export default function ActivitySelector() {
  const {
    activities,
    activitiesLoading,
    activitiesError,
    selectedActivity,
    selectActivity,
  } = useStoryStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#6B6B78] uppercase tracking-wider">
            Recent Runs
          </h2>
          {!activitiesLoading && (
            <span className="text-[10px] text-[#3A3A44]">
              {activities.length} activities
            </span>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activitiesLoading &&
          Array.from({ length: 6 }).map((_, i) => <ActivitySkeleton key={i} />)}

        {activitiesError && (
          <div
            className="p-4 rounded-xl text-xs text-red-400 text-center"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            {activitiesError}
          </div>
        )}

        {!activitiesLoading && !activitiesError && activities.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">🏃</div>
            <p className="text-xs text-[#6B6B78]">No recent runs found</p>
          </div>
        )}

        {!activitiesLoading &&
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isSelected={selectedActivity?.id === activity.id}
              onSelect={() => selectActivity(activity)}
            />
          ))}
      </div>

      {/* Selected activity summary */}
      {selectedActivity && (
        <div
          className="flex-shrink-0 p-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FC4C02]" />
            <span className="text-[10px] font-medium text-[#FC4C02] uppercase tracking-wider">
              Selected
            </span>
          </div>
          <p className="text-xs text-[#E8E8EA] font-medium line-clamp-1">
            {selectedActivity.name}
          </p>
          <p className="text-[11px] text-[#6B6B78] mt-0.5">
            {formatDistance(selectedActivity.distance)} •{' '}
            {formatTime(selectedActivity.moving_time)}
          </p>
        </div>
      )}
    </div>
  );
}
