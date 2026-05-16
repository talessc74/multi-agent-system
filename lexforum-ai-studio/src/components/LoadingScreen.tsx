import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  sessionId: string;
  onDone: () => void;
}

export function LoadingScreen({ sessionId, onDone }: LoadingScreenProps) {
  const [message, setMessage] = useState('Lendo sua causa...');
  const [dots, setDots] = useState('');

  // Animação de pontinhos — evita tela estática
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Consumir SSE
  useEffect(() => {
    const eventSource = new EventSource(
      `/simulation/status/${sessionId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessage(data.message);

      if (data.message === 'Pronto.') {
        eventSource.close();
        onDone();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [sessionId, onDone]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0f1e',
      color: '#00BFBF',
      fontFamily: 'Inter, sans-serif',
      gap: '2rem',
    }}>
      {/* Ícone animado */}
      <div style={{
        fontSize: '3rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        ⚖️
      </div>

      {/* Mensagem de progresso */}
      <p style={{
        fontSize: '1.1rem',
        letterSpacing: '0.02em',
        color: '#00BFBF',
        minHeight: '1.5rem',
        textAlign: 'center',
        maxWidth: '320px',
      }}>
        {message}{dots}
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
