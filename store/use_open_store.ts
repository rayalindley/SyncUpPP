import { create } from "zustand";

type OpenState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
};

// Creating the store
export const useOpenStore = create<OpenState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggleOpen: () => set((state) => ({ open: !state.open })),
}));
