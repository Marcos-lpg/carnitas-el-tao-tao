import { useState, useEffect } from 'react';
import { registrarVenta } from '../services/api';
import api from '../services/api';

export function PuntoDeVenta({ onVentaRegistrada }) {
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [tipoTaco, setTipoTaco] = useState('normal'); 
  const [editandoIndex, setEditandoIndex] = useState(null); 
  const [mensaje, setMensaje] = useState('');
  const [cajaTurnoId, setCajaTurnoId] = useState('1');

  // Intentamos obtener el ID real de la caja abierta de forma transparente en segundo plano
  useEffect(() => {
    const verificarTurno = async () => {
      try {
        const response = await api.get('/Caja/estado-actual');
        if (response && response.data) {
          const idAbierto = response.data.id || response.data.Id || response.data.cajaTurnoId;
          if (idAbierto) {
            setCajaTurnoId(idAbierto.toString());
          }
        }
      } catch (e) {
        // Silencioso por defecto
      }
    };
    verificarTurno();
  }, []);

  const productosRapidos = [
    { nombre: tipoTaco === 'normal' ? '🌮 Taco de Carnitas (Normal)' : '🔥 Taco en Promo', precioBase: tipoTaco === 'normal' ? 19 : 15 },
    { nombre: '🌯 Torta / Tranca de Carnitas', precioBase: 50 },
    { nombre: '🍖 Barra Completa', precioBase: 95 },
    { nombre: '🥤 Agua Fresca', precioBase: 25 },
    { nombre: '🌶️ Salsa Extra', precioBase: 10 }
  ];

  const agregarAlCarrito = (prod) => {
    setCarrito([...carrito, { descripcion: prod.nombre, precio: prod.precioBase }]);
  };

  const guardarPersonalizado = (e) => {
    e.preventDefault();
    const montoNum = parseFloat(precio);
    if (!descripcion || isNaN(montoNum) || montoNum <= 0) return;

    if (editandoIndex !== null) {
      const nuevoCarrito = [...carrito];
      nuevoCarrito[editandoIndex] = { descripcion, precio: montoNum };
      setCarrito(nuevoCarrito);
      setEditandoIndex(null);
    } else {
      setCarrito([...carrito, { descripcion, precio: montoNum }]);
    }

    setDescripcion('');
    setPrecio('');
  };

  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
    if (editandoIndex === index) {
      setEditandoIndex(null);
      setDescripcion('');
      setPrecio('');
    }
  };

  const iniciarEdicion = (index) => {
    setDescripcion(carrito[index].descripcion);
    setPrecio(carrito[index].precio);
    setEditandoIndex(index);
  };

  const totalVenta = carrito.reduce((acc, item) => acc + item.precio, 0);

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;

    // Aseguramos un ID válido por defecto (1 o el último detectado) para que el backend procese sin estorbar en pantalla
    const idActual = parseInt(cajaTurnoId) || 1;

    const descripcionCompleta = carrito.map(i => `${i.descripcion} ($${i.precio})`).join(' + ');
    
    const nuevaVenta = {
      CajaTurnoId: idActual,
      cajaTurnoId: idActual,
      DescripcionPedido: descripcionCompleta,
      descripcionPedido: descripcionCompleta,
      Total: totalVenta,
      total: totalVenta,
      NombreCliente: cliente || 'Mostrador',
      nombreCliente: cliente || 'Mostrador',
      DireccionEnvio: direccion || 'Local',
      direccionEnvio: direccion || 'Local',
      EstadoPago: 'Pagado',
      estadoPago: 'Pagado',
      EstadoPedido: 'Entregado',
      estadoPedido: 'Entregado',
      MetodoPago: 'Efectivo',
      metodoPago: 'Efectivo',
      Fecha: new Date().toISOString(),
      fecha: new Date().toISOString()
    };

    try {
      await registrarVenta(nuevaVenta);

      setMensaje('¡Venta registrada con éxito!');
      setCarrito([]);
      setCliente('');
      setDireccion('');
      setEditandoIndex(null);

      if (onVentaRegistrada) {
        onVentaRegistrada();
      }
    } catch (error) {
      console.error('Error detallado al registrar la venta:', error.response?.data || error);
      setMensaje('❌ Error al registrar la venta. Verifica que la caja esté abierta en Historial/Corte.');
    }
  };

  return (
    <div style={{ padding: '20px', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Punto de Venta - Carnitas El Tao Tao</h2>
      
      {mensaje && <p style={{ textAlign: 'center', fontWeight: 'bold', color: mensaje.includes('éxito') ? '#68d391' : '#ff6b6b', marginBottom: '15px' }}>{mensaje}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: '#2d3748', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #dd6b20', paddingBottom: '8px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#f7fafc', fontSize: '16px' }}>⚡ Accesos Rápidos</h3>
              <button 
                onClick={() => setTipoTaco(tipoTaco === 'normal' ? 'promo' : 'normal')}
                style={{ backgroundColor: tipoTaco === 'promo' ? '#38a169' : '#4a5568', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                {tipoTaco === 'normal' ? '🌟 Activar Promo Tacos ($15)' : '✅ Tacos Normales ($19)'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {productosRapidos.map((p, idx) => (
                <button key={idx} onClick={() => agregarAlCarrito(p)} style={{ padding: '10px', backgroundColor: '#4a5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
                  {p.nombre} <br/><span style={{ color: '#63b3ed', fontSize: '12px' }}>${p.precioBase}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#2d3748', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: '#f7fafc', fontSize: '16px', borderBottom: '2px solid #dd6b20', paddingBottom: '8px' }}>
              {editandoIndex !== null ? '✏️ Editando Concepto del Carrito' : '✍️ Pedido Personalizado (Tortillas, Kilos, etc.)'}
            </h3>
            <form onSubmit={guardarPersonalizado} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Concepto:</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué pide el cliente?" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Monto a cobrar ($):</label>
                <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 20, 50, 100..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <button type="submit" style={{ padding: '10px', backgroundColor: editandoIndex !== null ? '#d69e2e' : '#3182ce', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                {editandoIndex !== null ? '💾 Guardar Cambios del Ítem' : '+ Agregar al Carrito'}
              </button>
              {editandoIndex !== null && (
                <button type="button" onClick={() => { setEditandoIndex(null); setDescripcion(''); setPrecio(''); }} style={{ padding: '6px', backgroundColor: '#718096', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  Cancelar Edición
                </button>
              )}
            </form>
          </div>

        </div>

        <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginTop: 0, color: '#f7fafc', borderBottom: '2px solid #dd6b20', paddingBottom: '8px' }}>🛒 Orden Actual</h3>
            {carrito.length === 0 ? (
              <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '40px' }}>El carrito está vacío</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {carrito.map((item, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a202c', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ overflow: 'hidden', marginRight: '10px' }}>
                      <span style={{ display: 'block', fontSize: '14px' }}>{item.descripcion}</span>
                      <span style={{ color: '#68d391', fontWeight: 'bold', fontSize: '13px' }}>${item.precio.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                      <button onClick={() => iniciarEdicion(index)} title="Editar" style={{ backgroundColor: '#d69e2e', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        ✏️
                      </button>
                      <button onClick={() => eliminarDelCarrito(index)} title="Eliminar" style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del Cliente (Opcional)" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white', boxSizing: 'border-box' }} />
              <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección / Entrega (Local o Envio)" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: 'white', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderTop: '1px solid #4a5568', paddingTop: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total a Pagar:</span>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#68d391' }}>${totalVenta.toFixed(2)}</span>
            </div>

            <button onClick={finalizarVenta} disabled={carrito.length === 0} style={{ width: '100%', padding: '12px', backgroundColor: carrito.length === 0 ? '#718096' : '#38a169', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: carrito.length === 0 ? 'not-allowed' : 'pointer' }}>
              ✅ Cobrar y Registrar Venta
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}