import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  StravaActivity, StoryConfig, TemplateId, FontFamily, FontWeight,
  StatAlignment, RoutePosition, OverlayType, StatPosition, UnitSystem,
} from '@/types';
import { DEFAULT_CONFIG } from '@/lib/storyTemplates';

interface StoryState {
  // Auth
  accessToken: string | null;
  athlete: { id: number; firstname: string; lastname: string; profile: string } | null;

  // Activities
  activities: StravaActivity[];
  activitiesLoading: boolean;
  activitiesError: string | null;

  // Selected
  selectedActivity: StravaActivity | null;

  // Config
  config: StoryConfig;

  // Export
  isExporting: boolean;
  exportError: string | null;
  exportedImageUrl: string | null;

  // Auth actions
  setAccessToken: (token: string) => void;
  setAthlete: (athlete: StoryState['athlete']) => void;

  // Activity actions
  setActivities: (activities: StravaActivity[]) => void;
  setActivitiesLoading: (loading: boolean) => void;
  setActivitiesError: (error: string | null) => void;
  selectActivity: (activity: StravaActivity) => void;

  // Config — background
  setBackgroundImage: (image: string | null) => void;

  // Config — template
  setTemplate: (templateId: TemplateId) => void;
  applyTemplateDefaults: (templateId: TemplateId) => void;

  // Config — typography
  setFontFamily: (family: FontFamily) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: FontWeight) => void;
  setLetterSpacing: (spacing: number) => void;

  // Config — colors
  setStatColor: (color: string) => void;
  setLabelColor: (color: string) => void;
  setOverlayColor: (color: string) => void;
  setOverlayOpacity: (opacity: number) => void;
  setOverlayType: (type: OverlayType) => void;
  setAccentColor: (color: string) => void;
  setGradientStartColor: (color: string) => void;
  setGradientEndColor: (color: string) => void;

  // Config — stats
  toggleStat: (stat: keyof StoryConfig['visibleStats']) => void;
  setStatAlignment: (alignment: StatAlignment) => void;
  setStatVerticalOffset: (offset: number) => void;

  // Config — position (drag)
  setStatPosition: (pos: StatPosition) => void;
  setUseAbsolutePosition: (use: boolean) => void;

  // Config — route
  setShowRoute: (show: boolean) => void;
  setRouteColor: (color: string) => void;
  setRouteThickness: (thickness: number) => void;
  setRouteOpacity: (opacity: number) => void;
  setRoutePosition: (position: RoutePosition) => void;
  setRouteGlowIntensity: (intensity: number) => void;

  // Config — units
  setUnits: (units: UnitSystem) => void;

  resetConfig: () => void;

  // Export
  setIsExporting: (exporting: boolean) => void;
  setExportError: (error: string | null) => void;
  setExportedImageUrl: (url: string | null) => void;
  clearExport: () => void;
}

export const useStoryStore = create<StoryState>()(
  immer((set) => ({
    accessToken: null,
    athlete: null,
    activities: [],
    activitiesLoading: false,
    activitiesError: null,
    selectedActivity: null,
    config: { ...DEFAULT_CONFIG, activity: null },
    isExporting: false,
    exportError: null,
    exportedImageUrl: null,

    setAccessToken: (token) => set((s) => { s.accessToken = token; }),
    setAthlete: (athlete) => set((s) => { s.athlete = athlete; }),
    setActivities: (activities) => set((s) => { s.activities = activities; }),
    setActivitiesLoading: (loading) => set((s) => { s.activitiesLoading = loading; }),
    setActivitiesError: (error) => set((s) => { s.activitiesError = error; }),
    selectActivity: (activity) => set((s) => {
      s.selectedActivity = activity;
      s.config.activity = activity;
    }),

    setBackgroundImage: (image) => set((s) => { s.config.backgroundImage = image; }),

    setTemplate: (templateId) => set((s) => { s.config.templateId = templateId; }),
    applyTemplateDefaults: (templateId) => {
      const { STORY_TEMPLATES } = require('@/lib/storyTemplates');
      const template = STORY_TEMPLATES.find((t: { id: string }) => t.id === templateId);
      if (!template) return;
      set((s) => { Object.assign(s.config, template.defaults); });
    },

    setFontFamily: (family) => set((s) => { s.config.fontFamily = family; }),
    setFontSize: (size) => set((s) => { s.config.fontSize = size; }),
    setFontWeight: (weight) => set((s) => { s.config.fontWeight = weight; }),
    setLetterSpacing: (spacing) => set((s) => { s.config.letterSpacing = spacing; }),

    setStatColor: (color) => set((s) => { s.config.statColor = color; }),
    setLabelColor: (color) => set((s) => { s.config.labelColor = color; }),
    setOverlayColor: (color) => set((s) => { s.config.overlayColor = color; }),
    setOverlayOpacity: (opacity) => set((s) => { s.config.overlayOpacity = opacity; }),
    setOverlayType: (type) => set((s) => { s.config.overlayType = type; }),
    setAccentColor: (color) => set((s) => { s.config.accentColor = color; }),
    setGradientStartColor: (color) => set((s) => { s.config.gradientStartColor = color; }),
    setGradientEndColor: (color) => set((s) => { s.config.gradientEndColor = color; }),

    toggleStat: (stat) => set((s) => { s.config.visibleStats[stat] = !s.config.visibleStats[stat]; }),
    setStatAlignment: (alignment) => set((s) => { s.config.statAlignment = alignment; }),
    setStatVerticalOffset: (offset) => set((s) => { s.config.statVerticalOffset = offset; }),

    setStatPosition: (pos) => set((s) => { s.config.statPosition = pos; }),
    setUseAbsolutePosition: (use) => set((s) => { s.config.useAbsolutePosition = use; }),

    setShowRoute: (show) => set((s) => { s.config.showRoute = show; }),
    setRouteColor: (color) => set((s) => { s.config.routeColor = color; }),
    setRouteThickness: (thickness) => set((s) => { s.config.routeThickness = thickness; }),
    setRouteOpacity: (opacity) => set((s) => { s.config.routeOpacity = opacity; }),
    setRoutePosition: (position) => set((s) => { s.config.routePosition = position; }),
    setRouteGlowIntensity: (intensity) => set((s) => { s.config.routeGlowIntensity = intensity; }),

    setUnits: (units) => set((s) => { s.config.units = units; }),

    resetConfig: () => set((s) => {
      const activity = s.config.activity;
      s.config = { ...DEFAULT_CONFIG, activity };
    }),

    setIsExporting: (exporting) => set((s) => { s.isExporting = exporting; }),
    setExportError: (error) => set((s) => { s.exportError = error; }),
    setExportedImageUrl: (url) => set((s) => { s.exportedImageUrl = url; }),
    clearExport: () => set((s) => {
      s.exportError = null;
      s.exportedImageUrl = null;
      s.isExporting = false;
    }),
  }))
);
