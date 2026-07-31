import { useState, useEffect } from 'react';
import { registrarVenta } from '../services/api';
import api from '../services/api';

export function PuntoDeVenta({ onVentaRegistrada }) {
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [pagaCon, setPagaCon] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [tipoTaco, setTipoTaco] = useState('normal'); 
  const [editandoIndex, setEditandoIndex] = useState(null); 
  const [mensaje, setMensaje] = useState('');
  const [cajaTurnoId, setCajaTurnoId] = useState('1');

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
    const indexExistente = carrito.findIndex(item => item.descripcion === prod.nombre);
    
    if (indexExistente !== -1) {
      const nuevoCarrito = [...carrito];
      const itemActual = nuevoCarrito[indexExistente];
      const nuevaCantidad = itemActual.cantidad + 1;
      const precioUnitario = itemActual.precioUnitario || (itemActual.precio / itemActual.cantidad);
      
      nuevoCarrito[indexExistente] = {
        ...itemActual,
        cantidad: nuevaCantidad,
        precioUnitario: precioUnitario,
        precio: precioUnitario * nuevaCantidad
      };
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { 
        descripcion: prod.nombre, 
        precioUnitario: prod.precioBase, 
        precio: prod.precioBase, 
        cantidad: 1 
      }]);
    }
  };

  const cambiarCantidad = (index, delta) => {
    const nuevoCarrito = [...carrito];
    const item = nuevoCarrito[index];
    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(index);
    } else {
      const unitario = item.precioUnitario || (item.precio / item.cantidad);
      nuevoCarrito[index] = {
        ...item,
        cantidad: nuevaCantidad,
        precioUnitario: unitario,
        precio: unitario * nuevaCantidad
      };
      setCarrito(nuevoCarrito);
    }
  };

  const guardarPersonalizado = (e) => {
    e.preventDefault();
    const montoNum = parseFloat(precio);
    if (!descripcion || isNaN(montoNum) || montoNum <= 0) return;

    if (editandoIndex !== null) {
      const nuevoCarrito = [...carrito];
      const itemActual = nuevoCarrito[editandoIndex];
      const cant = itemActual.cantidad || 1;
      nuevoCarrito[editandoIndex] = { 
        descripcion, 
        precioUnitario: montoNum, 
        precio: montoNum * cant, 
        cantidad: cant 
      };
      setCarrito(nuevoCarrito);
      setEditandoIndex(null);
    } else {
      setCarrito([...carrito, { descripcion, precioUnitario: montoNum, precio: montoNum, cantidad: 1 }]);
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
    setPrecio(carrito[index].precioUnitario || (carrito[index].precio / carrito[index].cantidad));
    setEditandoIndex(index);
  };

  const totalVenta = carrito.reduce((acc, item) => acc + item.precio, 0);
  
  // Cálculo dinámico del cambio
  const montoPagado = parseFloat(pagaCon) || 0;
  const cambio = montoPagado >= totalVenta ? montoPagado - totalVenta : 0;

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;
    if (montoPagado < totalVenta) {
      setMensaje('❌ El monto con el que paga el cliente es menor al total.');
      return;
    }

    const idActual = parseInt(cajaTurnoId) || 1;
    
    // Limpiamos los emojis del texto que se va a guardar en la BD y exportar a Excel
    const descripcionCompleta = carrito
      .map(i => {
        const nombreLimpio = i.descripcion.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        return `${i.cantidad}x ${nombreLimpio} ($${i.precio})`;
      })
      .join(' + ');
    
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
      setPagaCon('');
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
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Encabezado Épico */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🌮</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Carnitas El Tao Tao</span>
          </div>
          <h2 style={{ margin: '6px 0 0 0', fontSize: '30px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>¡Bienvenido!</h2>
        </div>
        {mensaje && (
          <div style={{ padding: '10px 18px', backgroundColor: mensaje.includes('éxito') ? '#064e3b' : '#450a0a', border: `1px solid ${mensaje.includes('éxito') ? '#059669' : '#dc2626'}`, borderRadius: '12px', color: mensaje.includes('éxito') ? '#a7f3d0' : '#fecaca', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <span>⚡</span> {mensaje}
          </div>
        )}
      </div>

      {/* Layout Principal: Menú Izquierda / Carrito Derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '25px', alignItems: 'start' }}>
        
        {/* Columna de Accesos Rápidos y Formularios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Accesos Rápidos */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>Accesos Rápidos</h3>
              </div>
              <button 
                onClick={() => setTipoTaco(tipoTaco === 'normal' ? 'promo' : 'normal')}
                style={{ backgroundColor: tipoTaco === 'promo' ? '#059669' : '#334155', color: 'white', border: '1px solid #475569', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {tipoTaco === 'normal' ? '🌟 Activar Promo Tacos ($15)' : '✅ Tacos Normales ($19)'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
              {productosRapidos.map((p, idx) => (
                <div 
                  key={idx} 
                  onClick={() => agregarAlCarrito(p)}
                  style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{p.nombre}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#34d399' }}>${p.precioBase}</span>
                    <span style={{ backgroundColor: '#1e293b', border: '1px solid #475569', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>+</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pedido Personalizado */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
              <span style={{ fontSize: '18px' }}>{editandoIndex !== null ? '✏️' : '✍️'}</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>
                {editandoIndex !== null ? 'Editando Concepto del Carrito' : 'Pedido Personalizado (Kilos, Tortillas, etc.)'}
              </h3>
            </div>

            <form onSubmit={guardarPersonalizado} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepto:</label>
                <input 
                  type="text" 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                  placeholder="¿Qué pide el cliente?" 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '13px', fontWeight: '600' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto a cobrar ($):</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={precio} 
                  onChange={(e) => setPrecio(e.target.value)} 
                  placeholder="Ej: 20, 50, 100..." 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '13px', fontWeight: '600' }} 
                />
              </div>
              <button 
                type="submit" 
                style={{ padding: '14px', background: editandoIndex !== null ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: editandoIndex !== null ? '0 4px 15px rgba(217, 119, 6, 0.4)' : '0 4px 15px rgba(59, 130, 246, 0.4)', letterSpacing: '0.02em' }}
              >
                {editandoIndex !== null ? '💾 Guardar Cambios del Ítem' : '+ Agregar al Carrito'}
              </button>
              {editandoIndex !== null && (
                <button 
                  type="button" 
                  onClick={() => { setEditandoIndex(null); setDescripcion(''); setPrecio(''); }} 
                  style={{ padding: '10px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                >
                  Cancelar Edición
                </button>
              )}
            </form>
          </div>

        </div>

        {/* Columna del Carrito y Cobro */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', position: 'sticky', top: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛒</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>Orden Actual</h3>
            </div>
            <span style={{ backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#fbbf24', border: '1px solid #475569' }}>
              {carrito.length} Conceptos
            </span>
          </div>

          {/* Lista de Carrito */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
            {carrito.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '25px 0', margin: 0 }}>El carrito está vacío</p>
            ) : (
              carrito.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.descripcion}</span>
                    <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '800' }}>${item.precio.toFixed(2)}</span>
                  </div>
                  
                  {/* Controles de cantidad (- y +) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '2px 6px' }}>
                      <button onClick={() => cambiarCantidad(index, -1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0 4px' }}>-</button>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', padding: '0 6px' }}>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(index, 1)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0 4px' }}>+</button>
                    </div>

                    <button onClick={() => iniciarEdicion(index)} title="Editar" style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✏️
                    </button>
                    <button onClick={() => eliminarDelCarrito(index)} title="Eliminar" style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Datos del Cliente y Envío */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Cliente:</label>
              <input 
                type="text" 
                value={cliente} 
                onChange={(e) => setCliente(e.target.value)} 
                placeholder="Nombre del Cliente (Opcional)" 
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '13px', fontWeight: '600' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección / Entrega:</label>
              <input 
                type="text" 
                value={direccion} 
                onChange={(e) => setDireccion(e.target.value)} 
                placeholder="Dirección / Entrega (Local o Envío)" 
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '13px', fontWeight: '600' }}
              />
            </div>

            {/* Total */}
            <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Total a Pagar:</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#34d399' }}>${totalVenta.toFixed(2)}</span>
            </div>

            {/* Paga Con y Cambio (Nuevo) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paga con ($):</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={pagaCon} 
                  onChange={(e) => setPagaCon(e.target.value)} 
                  placeholder="Ej. 100, 500..." 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Su Cambio:</label>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #f59e0b/40', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', height: '39px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#fbbf24' }}>
                    ${cambio.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Cobro Final */}
            <button 
              onClick={finalizarVenta} 
              disabled={carrito.length === 0} 
              style={{ width: '100%', padding: '14px', background: carrito.length === 0 ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: carrito.length === 0 ? 'not-allowed' : 'pointer', fontSize: '15px', boxShadow: carrito.length === 0 ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.4)', letterSpacing: '0.02em', marginTop: '5px' }}
            >
              ✅ Cobrar y Registrar Venta
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}