import { useEffect, useState } from 'react';
import { getVentas, getInsumos, registrarInsumo } from '../services/api';
import axios from 'axios';

export function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  
  // Estado para la gestión de Caja / Turnos
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [fondoInicialInput, setFondoInicialInput] = useState(500);

  // Estado para los insumos fijos por categoría
  const [formInsumos, setFormInsumos] = useState({
    carne: '',
    tortillas: '',
    gas: '',
    verduras: '',
    sueldos: '',
    plasticos: ''
  });

  useEffect(() => {
    cargarDatos();
    verificarEstadoCaja();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataVentas = await getVentas();
      const dataInsumos = await getInsumos();
      setVentas(dataVentas);
      setInsumos(dataInsumos);
    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
      setMensaje('Error al conectar con la API para cargar el corte.');
    }
  };

  const verificarEstadoCaja = async () => {
    try {
      // Ruta corregida a 'estado-actual' para coincidir con el backend
      const response = await axios.get('http://localhost:5242/api/Caja/estado-actual');
      setEstadoCaja(response.data);
    } catch (error) {
      console.error('Error al obtener el estado de la caja', error);
    }
  };

  const abrirCaja = async () => {
    try {
      await axios.post('http://localhost:5242/api/Caja/abrir', {
        fondoInicial: parseFloat(fondoInicialInput)
      });
      setMensaje('¡Turno de caja abierto con éxito!');
      verificarEstadoCaja();
    } catch (error) {
      console.error('Error al abrir caja:', error);
      setMensaje('Error al abrir la caja. Es posible que ya haya una abierta.');
    }
  };

  const cerrarCaja = async () => {
    if (!estadoCaja?.caja?.id) {
      setMensaje('No se encontró el ID de la caja activa para cerrar.');
      return;
    }

    try {
      // Ruta corregida incluyendo el ID dinámico requerido por C# (/cerrar/{id})
      await axios.post(`http://localhost:5242/api/Caja/cerrar/${estadoCaja.caja.id}`);
      setMensaje('¡Turno de caja cerrado y corte realizado con éxito!');
      verificarEstadoCaja();
      cargarDatos();
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      setMensaje('Error al cerrar la caja.');
    }
  };

  const handleRegistrarInsumosFijos = async (e) => {
    e.preventDefault();
    
    const categorias = [
      { tipoInsumo: 'Carne de Cerdo', monto: parseFloat(formInsumos.carne) },
      { tipoInsumo: 'Tortillas', monto: parseFloat(formInsumos.tortillas) },
      { tipoInsumo: 'Gas / Gasolina', monto: parseFloat(formInsumos.gas) },
      { tipoInsumo: 'Verduras', monto: parseFloat(formInsumos.verduras) },
      { tipoInsumo: 'Sueldos de Empleados', monto: parseFloat(formInsumos.sueldos) },
      { tipoInsumo: 'Plásticos / Platos / Desechables', monto: parseFloat(formInsumos.plasticos) }
    ].filter(item => !isNaN(item.monto) && item.monto > 0);

    if (categorias.length === 0) {
      setMensaje('Por favor ingresa al menos un monto en alguna categoría.');
      return;
    }

    try {
      for (const cat of categorias) {
        await registrarInsumo({
          TipoInsumo: cat.tipoInsumo,
          Monto: cat.monto,
          Fecha: new Date().toISOString()
        });
      }

      setFormInsumos({ carne: '', tortillas: '', gas: '', verduras: '', sueldos: '', plasticos: '' });
      setMensaje('¡Insumos registrados con éxito!');
      cargarDatos();
    } catch (error) {
      console.error('Error al registrar insumos:', error);
      setMensaje('Error al registrar los insumos.');
    }
  };

  const totalIngresos = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalGastos = insumos.reduce((acc, i) => acc + (i.monto || i.Monto || 0), 0);
  const gananciaNeta = totalIngresos - totalGastos;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'white', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Historial y Corte de Caja</h2>
      
      {mensaje && <p style={{ fontWeight: 'bold', color: '#ff6b6b' }}>{mensaje}</p>}

      {/* Panel de Control de Turno de Caja */}
      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4a5568', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0', color: '#a0aec0' }}>Control de Turno</h4>
          <p style={{ margin: 0, fontSize: '16px' }}>
            Estado: <span style={{ fontWeight: 'bold', color: estadoCaja?.abierta ? '#68d391' : '#fc8181' }}>
              {estadoCaja?.abierta ? '🟢 CAJA ABIERTA' : '🔴 CAJA CERRADA'}
            </span>
          </p>
        </div>

        {!estadoCaja?.abierta ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="number" 
              value={fondoInicialInput} 
              onChange={(e) => setFondoInicialInput(e.target.value)} 
              placeholder="Fondo inicial ($)" 
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#2d3748', color: 'white', width: '130px' }}
            />
            <button onClick={abrirCaja} style={{ padding: '9px 15px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Abrir Caja
            </button>
          </div>
        ) : (
          <button onClick={cerrarCaja} style={{ padding: '9px 15px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Cerrar Caja (Hacer Corte)
          </button>
        )}
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', margin: '20px 0' }}>
        <div style={{ padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px', borderLeft: '5px solid #3182ce' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#a0aec0' }}>Ingresos Totales</h4>
          <h2 style={{ margin: 0, color: '#63b3ed' }}>${totalIngresos.toFixed(2)}</h2>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px', borderLeft: '5px solid #e53e3e' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#a0aec0' }}>Total Insumos (Gastos)</h4>
          <h2 style={{ margin: 0, color: '#fc8181' }}>${totalGastos.toFixed(2)}</h2>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px', borderLeft: '5px solid #38a169' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#a0aec0' }}>Ganancia Neta</h4>
          <h2 style={{ margin: 0, color: '#68d391' }}>${gananciaNeta.toFixed(2)}</h2>
        </div>
      </div>

      {/* Formulario de Insumos por Categoría */}
      <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>📊 Capturar Insumos del Día</h3>
        <form onSubmit={handleRegistrarInsumosFijos} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e0' }}>Inversión en Carne de Cerdo ($):</label>
              <input type="number" step="0.01" value={formInsumos.carne} onChange={(e) => setFormInsumos({ ...formInsumos, carne: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e0' }}>Gasto en Tortillas ($):</label>
              <input type="number" step="0.01" value={formInsumos.tortillas} onChange={(e) => setFormInsumos({ ...formInsumos, tortillas: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e0' }}>Gasolina / Gas ($):</label>
              <input type="number" step="0.01" value={formInsumos.gas} onChange={(e) => setFormInsumos({ ...formInsumos, gas: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e0' }}>Gasto en Verduras ($):</label>
              <input type="number" step="0.01" value={formInsumos.verduras} onChange={(e) => setFormInsumos({ ...formInsumos, verduras: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e0' }}>Sueldos de Empleados ($):</label>
              <input type="number" step="0.01" value={formInsumos.sueldos} onChange={(e) => setFormInsumos({ ...formInsumos, sueldos: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e0' }}>Plásticos / Platos / Desechables ($):</label>
              <input type="number" step="0.01" value={formInsumos.plasticos} onChange={(e) => setFormInsumos({ ...formInsumos, plasticos: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white' }} />
            </div>
          </div>

          <button type="submit" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#dd6b20', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            💾 Guardar Registro de Insumos
          </button>
        </form>
      </div>

      {/* Tabla de Ventas */}
      <h3>Historial de Ventas</h3>
      {ventas.length === 0 ? (
        <p>No hay ventas registradas aún.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#4a5568', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>Descripción / Cliente</th>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>Fecha / Hora</th>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id} style={{ borderBottom: '1px solid #718096' }}>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>#{venta.id}</td>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>
                  {venta.descripcionPedido || 'Venta general'} {venta.nombreCliente ? `(${venta.nombreCliente})` : ''}
                </td>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>{new Date(venta.fecha).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>${venta.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Tabla de Insumos Registrados */}
      <h3>Historial de Insumos / Gastos</h3>
      {insumos.length === 0 ? (
        <p>No hay insumos registrados aún.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#4a5568', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>Descripción</th>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>Fecha</th>
              <th style={{ padding: '10px', border: '1px solid #718096' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => (
              <tr key={insumo.id} style={{ borderBottom: '1px solid #718096' }}>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>#{insumo.id}</td>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>{insumo.tipoInsumo || insumo.TipoInsumo}</td>
                <td style={{ padding: '10px', border: '1px solid #718096' }}>{new Date(insumo.fecha || insumo.Fecha).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #718096', color: '#fc8181' }}>-${insumo.monto || insumo.Monto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}