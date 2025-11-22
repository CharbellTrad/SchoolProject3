import { useCallback, useState } from 'react';

export type TabType = 'general' | 'sizes' | 'birth' | 'parents' | 'documents';

export interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

export const useTabs = (initialTab: TabType = 'general') => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const changeTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    changeTab,
  };
};
