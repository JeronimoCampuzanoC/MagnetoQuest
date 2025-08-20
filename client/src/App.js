import { useEffect, useState } from 'react';

export default function App() {
  const [msg, setMsg] = useState('Cargando…');
  const [time, setTime] = useState(null);
  const [error, setError] = useState(null);

  // --- Estado para la DB ---
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

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

  // --- Botón/función para cargar usuarios de la DB ---
  async function loadUsers() {
    try {
      setUsersError(null);
      setUsersLoading(true);
      const res = await fetch('/api/users'); // ← tu endpoint del back
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();        // [{ id, name }, ...]
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setUsersError(e.message || 'Error desconocido');
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => { loadHello(); }, []);

  return (
    <main style={{padding:24, fontFamily:'system-ui, sans-serif'}}>
      <h1>PoC React (JS) + Express</h1>

      {/* Sección /api/hello */}
      <section style={{marginBottom:24}}>
        <h2>Saludo del backend</h2>
        <p>{error ? `Error: ${error}` : msg}</p>
        {time && <p><small>{new Date(time).toLocaleString()}</small></p>}
        <button onClick={loadHello}>Volver a llamar</button>
      </section>

      {/* Sección DB: /api/users */}
      <section style={{paddingTop:16, borderTop:'1px solid #ddd'}}>
        <h2>Usuarios (desde la base de datos)</h2>
        <button onClick={loadUsers} disabled={usersLoading}>
          {usersLoading ? 'Cargando…' : 'Cargar usuarios'}
        </button>

        {usersError && (
          <p style={{color:'crimson', marginTop:8}}>Error: {usersError}</p>
        )}

        {!usersLoading && users.length === 0 && !usersError && (
          <p style={{marginTop:8}}>Sin usuarios aún.</p>
        )}

        {users.length > 0 && (
          <ul style={{marginTop:12}}>
            {users.map(u => (
              <li key={u.id}>{u.id} — {u.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
