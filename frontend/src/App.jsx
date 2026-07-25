import { useState } from 'react';
import { PuntoDeVenta } from './components/PuntoDeVenta';
import { HistorialVentas } from './components/HistorialVentas';

function App() {
  const [vistaActual, setVistaActual] = useState('pos');

  return (
    <main style={{ backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Barra de navegación superior para alternar vistas */}
      <nav style={{ padding: '15px 30px', backgroundColor: '#2d3748', display: 'flex', gap: '15px', borderBottom: '1px solid #4a5568' }}>
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
      </nav>

      {/* Renderizado condicional */}
      {vistaActual === 'pos' ? <PuntoDeVenta /> : <HistorialVentas />}
    </main>
  );
}

export default App;