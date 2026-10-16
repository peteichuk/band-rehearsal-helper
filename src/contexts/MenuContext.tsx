import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

// Split into two contexts so a component that only needs to *close* the
// menu (e.g. `setTableId` in App.tsx) doesn't re-render — along with
// everything under it, the whole routed page — on every open/close toggle.
// `setMenuOpen` (React's dispatch from `useState`) has a stable identity
// across renders, so subscribing to it alone never triggers a re-render;
// only `Header`, which actually needs the current `menuOpen` value, reads
// the other context.
const MenuOpenContext = createContext<boolean | null>(null);
const SetMenuOpenContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <SetMenuOpenContext.Provider value={setMenuOpen}>
      <MenuOpenContext.Provider value={menuOpen}>{children}</MenuOpenContext.Provider>
    </SetMenuOpenContext.Provider>
  );
}

/** The header's side-menu open state. Re-renders on every toggle — only `Header` should use this. */
export function useMenuOpen() {
  const ctx = useContext(MenuOpenContext);
  if (ctx === null) throw new Error('useMenuOpen must be used within a MenuProvider');
  return ctx;
}

/** A stable setter for the menu's open state. Never causes a re-render by itself. */
export function useSetMenuOpen() {
  const ctx = useContext(SetMenuOpenContext);
  if (!ctx) throw new Error('useSetMenuOpen must be used within a MenuProvider');
  return ctx;
}
