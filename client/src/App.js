import { useEffect, useState } from 'react';

export default function App() {
  const [msg, setMsg] = useState('Cargando…');
  const [time, setTime] = useState(null);
  const [error, setError] = useState(null);

  async function loadHello() {
    try {
      setError(null);
      const res = await fetch('/api/hello'); // CRA lo proxyea al 4000
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setMsg(data.message ?? 'Sin mensaje');
      setTime(data.timestamp ?? null);
    } catch (e) {
      setError(e.message || 'Error desconocido');
    }
  }

  useEffect(() => { loadHello(); }, []);

  return (
    <main style={{padding:24, fontFamily:'system-ui, sans-serif'}}>
      <h1>PoC React (JS) + Express</h1>
      <p>{error ? `Error: ${error}` : msg}</p>
      {time && <p><small>{new Date(time).toLocaleString()}</small></p>}
      <button onClick={loadHello}>Volver a llamar</button>
    </main>
  );
}
