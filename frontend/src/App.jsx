import { useState } from 'react';
import { PuntoDeVenta } from './components/PuntoDeVenta';
import { HistorialVentas } from './components/HistorialVentas';
import Login from './components/Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [vistaActual, setVistaActual] = useState('pos');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
  };

  // Si no hay token activo, mostramos exclusivamente la pantalla de login
  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} />;
  }

  return (
    <main style={{ backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Barra de navegación superior con pestañas y control de sesión */}
      <nav style={{ padding: '15px 30px', backgroundColor: '#2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #4a5568' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => setVistaActual('pos')}
            style={{
              padding: '8px 16px',
              backgroundColor: vistaActual === 'pos' ? '#3182ce' : '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Punto de Venta
          </button>
          <button 
            onClick={() => setVistaActual('historial')}
            style={{
              padding: '8px 16px',
              backgroundColor: vistaActual === 'historial' ? '#3182ce' : '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Historial / Corte
          </button>
        </div>

        {/* Información de usuario y botón de salida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: '#cbd5e0' }}>
            Usuario: <strong style={{ color: 'white' }}>{localStorage.getItem('usuario')}</strong>
          </span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 12px',
              backgroundColor: '#9b2c2c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Renderizado condicional de tus vistas existentes */}
      {vistaActual === 'pos' ? <PuntoDeVenta /> : <HistorialVentas />}
    </main>
  );
}

export default App;