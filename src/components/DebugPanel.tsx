import { useEffect, useState } from 'react';

interface DebugInfo {
  tauriAvailable: boolean;
  platform: string;
  assetUrl: string;
  errors: string[];
  events: string[];
}

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    tauriAvailable: false,
    platform: '',
    assetUrl: '',
    errors: [],
    events: []
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se Tauri está disponível
    const tauriAvailable = !!(window as any).__TAURI_INTERNALS__;
    const platform = tauriAvailable ? 'tauri' : 'web';
    
    // Verificar URL dos assets
    const assetUrl = new URL('../assets/logo.png', import.meta.url).href;
    
    setDebugInfo(prev => ({
      ...prev,
      tauriAvailable,
      platform,
      assetUrl
    }));

    // Monitorar erros globais
    const handleError = (event: ErrorEvent) => {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, `${event.error?.message || event.message} at ${event.filename}:${event.lineno}`]
      }));
    };

    // Monitorar cliques
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        setDebugInfo(prev => ({
          ...prev,
          events: [...prev.events, `Button clicked: ${target.textContent || target.className} at ${new Date().toISOString()}`]
        }));
      }
    };

    window.addEventListener('error', handleError);
    document.addEventListener('click', handleClick);

    // Verificar carregamento de imagens
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.complete) {
        img.addEventListener('load', () => {
          setDebugInfo(prev => ({
            ...prev,
            events: [...prev.events, `Image ${index} loaded: ${img.src}`]
          }));
        });
        img.addEventListener('error', () => {
          setDebugInfo(prev => ({
            ...prev,
            errors: [...prev.errors, `Image ${index} failed to load: ${img.src}`]
          }));
        });
      }
    });

    return () => {
      window.removeEventListener('error', handleError);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 9999,
          background: '#ff0000',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        DEBUG
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        width: '400px',
        maxHeight: '80vh',
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: '5px',
        padding: '10px',
        zIndex: 9999,
        fontSize: '11px',
        fontFamily: 'monospace',
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: '#ff0000',
            color: 'white',
            border: 'none',
            padding: '2px 8px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          X
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Environment:</strong>
        <div>Tauri: {debugInfo.tauriAvailable ? 'YES' : 'NO'}</div>
        <div>Platform: {debugInfo.platform}</div>
        <div>Asset URL: {debugInfo.assetUrl}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Recent Events (last 10):</strong>
        {Array.isArray(debugInfo.events) ? debugInfo.events.slice(-10).map((event, index) => (
          <div key={index} style={{ fontSize: '10px', color: '#0f0' }}>
            {event}
          </div>
        )) : null}
      </div>

      <div>
        <strong>Errors (last 10):</strong>
        {Array.isArray(debugInfo.errors) ? debugInfo.errors.slice(-10).map((error, index) => (
          <div key={index} style={{ fontSize: '10px', color: '#f00' }}>
            {error}
          </div>
        )) : null}
      </div>
    </div>
  );
};

export default DebugPanel;
