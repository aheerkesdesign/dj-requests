import { useEffect, useMemo, useState } from 'react';

export type DjViewMode = 'start' | 'library';
export type DjActiveTab = 'tracks' | 'requests' | 'dj';

function readInitialState(ownerMode: boolean): { view: DjViewMode; tab: DjActiveTab } {
  if (typeof window === 'undefined') {
    return { view: ownerMode ? 'library' : 'start', tab: 'tracks' };
  }

  if (ownerMode) {
    const ownerTab = sessionStorage.getItem('owner_active_tab') as DjActiveTab | null;
    const tab: DjActiveTab =
      ownerTab === 'tracks' || ownerTab === 'requests' || ownerTab === 'dj' ? ownerTab : 'tracks';
    return { view: 'library', tab };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paramView = urlParams.get('view') as DjViewMode | null;
  const paramTab = urlParams.get('tab') as DjActiveTab | null;
  const sessionView = sessionStorage.getItem('app_view_mode') as DjViewMode | null;
  const sessionTab = sessionStorage.getItem('app_active_tab') as DjActiveTab | null;

  const view: DjViewMode =
    paramView === 'start' || paramView === 'library'
      ? paramView
      : sessionView === 'start' || sessionView === 'library'
        ? sessionView
        : 'start';

  let tab: DjActiveTab =
    paramTab === 'tracks' || paramTab === 'requests' || paramTab === 'dj'
      ? paramTab
      : sessionTab === 'tracks' || sessionTab === 'requests' || sessionTab === 'dj'
        ? sessionTab
        : 'tracks';

  if (tab === 'dj') tab = 'tracks';

  return { view, tab };
}

export function useDjPageNavigation(ownerMode: boolean) {
  const initialState = useMemo(() => readInitialState(ownerMode), [ownerMode]);
  const [viewMode, setViewMode] = useState<DjViewMode>(initialState.view);
  const [activeTab, setActiveTab] = useState<DjActiveTab>(initialState.tab);

  useEffect(() => {
    if (ownerMode) {
      sessionStorage.setItem('owner_active_tab', activeTab);
      return;
    }

    sessionStorage.setItem('app_view_mode', viewMode);
    sessionStorage.setItem('app_active_tab', activeTab);

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('view', viewMode);
    urlParams.set('tab', activeTab === 'dj' ? 'tracks' : activeTab);
    urlParams.delete('dj');
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }, [viewMode, activeTab, ownerMode]);

  return { viewMode, setViewMode, activeTab, setActiveTab };
}
