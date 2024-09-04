import { create } from "zustand";

type SidebarState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set(() => ({ sidebarOpen: open })),
}));

export default useSidebarStore;
