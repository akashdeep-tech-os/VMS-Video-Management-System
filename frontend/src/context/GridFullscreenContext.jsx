import { createContext, useContext, useState, useCallback } from "react";

const GridFullscreenContext = createContext();

export function GridFullscreenProvider({ children }) {
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);

  const toggleGridFullscreen = useCallback(() => {
    setIsGridFullscreen((prev) => !prev);
  }, []);

  const exitGridFullscreen = useCallback(() => {
    setIsGridFullscreen(false);
  }, []);

  return (
    <GridFullscreenContext.Provider
      value={{ isGridFullscreen, toggleGridFullscreen, exitGridFullscreen }}
    >
      {children}
    </GridFullscreenContext.Provider>
  );
}

export function useGridFullscreen() {
  const context = useContext(GridFullscreenContext);
  if (!context) {
    throw new Error("useGridFullscreen must be used within a GridFullscreenProvider");
  }
  return context;
}
