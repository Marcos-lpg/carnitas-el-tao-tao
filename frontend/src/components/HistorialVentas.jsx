import { useEffect, useState } from 'react';
import { getVentas, getInsumos, registrarInsumo } from '../services/api';
import axios from 'axios';

export function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [fondoInicialInput, setFondoInicialInput] = useState(500);

  const [formInsumos, setFormInsumos] = useState({
    carne: '',
    tortillas: '',
    gas: '',
    verduras: '',
    sueldos: '',
    plasticos: ''
  });

  useEffect(() => {
    verificarEstadoCaja();
  }, []);

  useEffect(() => {
    if (estadoCaja?.abierta === true) {
      cargarDatos();
    } else {
      setVentas([]);
      setInsumos([]);
    }
  }, [estadoCaja]);

  const cargarDatos = async () => {
    try {
      const dataVentas = await getVentas();
      const dataInsumos = await getInsumos();
      setVentas(dataVentas || []);
      setInsumos(dataInsumos || []);
    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
      setMensaje('Error al conectar con la API para cargar el corte.');
    }
  };

  const verificarEstadoCaja = async () => {
    try {
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
      
      setVentas([]);
      setInsumos([]);

      await verificarEstadoCaja();
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

    const idCajaACerrar = estadoCaja.caja.id;

    try {
      await axios.post(`http://localhost:5242/api/Caja/cerrar/${idCajaACerrar}`);
      
      let csvContent = "data:text/csv;charset=utf-8,ID Venta,Cliente,Descripcion,Total,Fecha\n";
      ventas.forEach(v => {
        let row = `${v.id},"${v.nombreCliente || 'Mostrador'}","${v.descripcionPedido || 'Venta'}",${v.total},"${new Date(v.fecha).toLocaleString()}"`;
        csvContent += row + "\r\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Corte_Caja_Turno_${idCajaACerrar}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setVentas([]);
      setInsumos([]);
      setMensaje('¡Turno cerrado con éxito, reporte descargado y listas limpias!');
      
      await verificarEstadoCaja();

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error al cerrar caja:', error);
      setMensaje('Error al cerrar la caja o generar el reporte.');
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

  // Cálculos financieros
  const fondoInicialActual = estadoCaja?.caja?.fondoInicial ?? estadoCaja?.fondoInicial ?? 0;
  const totalIngresos = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalGastos = insumos.reduce((acc, i) => acc + (i.monto || i.Monto || 0), 0);
  const gananciaNeta = totalIngresos - totalGastos;
  
  // Efectivo físico esperado en la caja (Fondo Inicial + Ventas - Gastos pagados en efectivo)
  const efectivoEnCaja = fondoInicialActual + totalIngresos - totalGastos;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🐷</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Carnitas El Tao Tao</span>
          </div>
          <h2 style={{ margin: '6px 0 0 0', fontSize: '30px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>Historial y Corte de Caja</h2>
        </div>
        {mensaje && (
          <div style={{ padding: '10px 18px', backgroundColor: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '12px', color: '#c7d2fe', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <span>⚡</span> {mensaje}
          </div>
        )}
      </div>

      {/* Panel de Control de Caja */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155', borderRadius: '16px', padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '52px', height: '52px', backgroundColor: '#0f172a', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '1px solid #334155', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)' }}>
            🔒
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado del Turno</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: estadoCaja?.abierta ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: estadoCaja?.abierta ? '0 0 12px #10b981' : '0 0 12px #ef4444' }}></span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: estadoCaja?.abierta ? '#34d399' : '#f87171', letterSpacing: '0.02em' }}>
                {estadoCaja?.abierta ? 'CAJA ABIERTA Y OPERANDO' : 'CAJA CERRADA'}
              </span>
            </div>
          </div>
        </div>

        {!estadoCaja?.abierta ? (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="number" 
              value={fondoInicialInput} 
              onChange={(e) => setFondoInicialInput(e.target.value)} 
              placeholder="Fondo inicial ($)" 
              style={{ padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '10px', color: '#fff', fontSize: '14px', width: '150px', outline: 'none', fontWeight: '600' }}
            />
            <button onClick={abrirCaja} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
              Abrir Caja
            </button>
          </div>
        ) : (
          <button onClick={cerrarCaja} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
            🔒 Cerrar Caja (Hacer Corte)
          </button>
        )}
      </div>

      {/* Tarjetas Financieras (Incluyendo Fondo Inicial y Efectivo Total en Caja) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: '#f59e0b' }}></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fondo Inicial (Cambio)</span>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#fbbf24', marginTop: '10px', letterSpacing: '-0.02em' }}>${fondoInicialActual.toFixed(2)}</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: '#3b82f6' }}></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ingresos Totales</span>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#60a5fa', marginTop: '10px', letterSpacing: '-0.02em' }}>${totalIngresos.toFixed(2)}</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: '#f43f5e' }}></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Insumos (Gastos)</span>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#fb7185', marginTop: '10px', letterSpacing: '-0.02em' }}>${totalGastos.toFixed(2)}</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: '#10b981' }}></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Efectivo Físico en Caja</span>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#34d399', marginTop: '10px', letterSpacing: '-0.02em' }}>${efectivoEnCaja.toFixed(2)}</div>
        </div>

      </div>

      {/* Formulario de Insumos */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>Capturar Insumos del Día</h3>
        </div>

        <form onSubmit={handleRegistrarInsumosFijos} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inversión en Carne de Cerdo ($):</label>
              <input type="number" step="0.01" value={formInsumos.carne} onChange={(e) => setFormInsumos({ ...formInsumos, carne: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasto en Tortillas ($):</label>
              <input type="number" step="0.01" value={formInsumos.tortillas} onChange={(e) => setFormInsumos({ ...formInsumos, tortillas: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasolina / Gas ($):</label>
              <input type="number" step="0.01" value={formInsumos.gas} onChange={(e) => setFormInsumos({ ...formInsumos, gas: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasto en Verduras ($):</label>
              <input type="number" step="0.01" value={formInsumos.verduras} onChange={(e) => setFormInsumos({ ...formInsumos, verduras: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sueldos de Empleados ($):</label>
              <input type="number" step="0.01" value={formInsumos.sueldos} onChange={(e) => setFormInsumos({ ...formInsumos, sueldos: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plásticos / Platos / Desechables ($):</label>
              <input type="number" step="0.01" value={formInsumos.plasticos} onChange={(e) => setFormInsumos({ ...formInsumos, plasticos: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
            </div>
          </div>

          <button type="submit" style={{ padding: '14px', background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', marginTop: '10px', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)' }}>
            💾 Guardar Registro de Insumos
          </button>
        </form>
      </div>

      {/* Tabla de Historial de Ventas */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>Historial de Ventas</h3>
        {ventas.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '25px 0', margin: 0 }}>No hay ventas registradas aún (Caja Cerrada).</p>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px' }}>ID</th>
                  <th style={{ padding: '16px' }}>Descripción / Cliente</th>
                  <th style={{ padding: '16px' }}>Fecha / Hora</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#fbbf24' }}>#{venta.id}</td>
                    <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: '500' }}>
                      {venta.descripcionPedido || 'Venta general'} {venta.nombreCliente ? `(${venta.nombreCliente})` : ''}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>{new Date(venta.fecha).toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: '#34d399', fontSize: '15px' }}>${venta.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla de Historial de Insumos */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>Historial de Insumos / Gastos</h3>
        {insumos.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '25px 0', margin: 0 }}>No hay insumos registrados aún (Caja Cerrada).</p>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px' }}>ID</th>
                  <th style={{ padding: '16px' }}>Descripción</th>
                  <th style={{ padding: '16px' }}>Fecha</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((insumo) => (
                  <tr key={insumo.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#94a3b8' }}>#{insumo.id}</td>
                    <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: '500' }}>{insumo.tipoInsumo || insumo.TipoInsumo}</td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>{new Date(insumo.fecha || insumo.Fecha).toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: '#fb7185', fontSize: '15px' }}>-${insumo.monto || insumo.Monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}