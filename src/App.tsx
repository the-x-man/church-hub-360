import { ThemeProvider } from 'next-themes';
import { AppRouter } from './router/AppRouter';
import { Toaster } from './components/ui/sonner';
import { ConnectionStatus } from './modules/connection-status-detector/ConnectionStatus';

function App() {
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
