import { useState, useEffect } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToasterProvider } from '@/components/ui/Toaster';
import LoadingScreen from '@/components/common/LoadingScreen';
import Router from '@/routes';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:10',message:'App component rendered',data:{isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:14',message:'useEffect started',data:{readyState:document.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Simulate initial app loading
    const timer = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:18',message:'Timer callback - setting isLoading to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setIsLoading(false);
    }, 1000); // Show loading screen for at least 1 second for smooth UX

    // Also hide when DOM is ready
    if (document.readyState === 'complete') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:24',message:'Document already complete - setting isLoading to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setTimeout(() => setIsLoading(false), 500);
    } else {
      window.addEventListener('load', () => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:29',message:'Window load event - setting isLoading to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setTimeout(() => setIsLoading(false), 500);
      });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', () => {});
    };
  }, []);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:38',message:'Before render - ChakraProvider will always be rendered',data:{isLoading,willRenderLoadingScreen:isLoading,willRenderChakraProvider:true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Always render ChakraProvider, conditionally render content inside
  // #region agent log
  if (isLoading) {
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:43',message:'Will render LoadingScreen WITHIN ChakraProvider',data:{isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  } else {
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:46',message:'Will render app content WITHIN ChakraProvider',data:{isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  return (
    <ChakraProvider value={defaultSystem}>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <ToasterProvider>
          <ErrorBoundary>
            <AuthProvider>
              <SearchProvider>
                <Router />
              </SearchProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ToasterProvider>
      )}
    </ChakraProvider>
  );
}

export default App;


