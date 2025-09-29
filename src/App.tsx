import { ThemeProvider } from 'next-themes';
import { AppRouter } from './router/AppRouter';
import { Toaster } from './components/ui/sonner';
import { ConnectionStatus } from './modules/connection-status-detector/ConnectionStatus';
import { useAutoUpdateCheck } from './modules/auto-update/hooks/useAutoUpdateCheck';

function App() {
  // Initialize auto-update checking
  useAutoUpdateCheck();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppRouter />
      <ConnectionStatus />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
