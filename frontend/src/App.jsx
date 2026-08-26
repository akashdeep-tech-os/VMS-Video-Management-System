import { GlassThemeProvider } from "./theme/glass/GlassThemeProvider";
import AppRoutes from "./router/AppRoutes";

function App() {
  return (
    <GlassThemeProvider>
      <AppRoutes />
    </GlassThemeProvider>
  );
}

export default App;
