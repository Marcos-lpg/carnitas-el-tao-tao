import React, { useState, useEffect } from 'react';
import './App.css';

const Gastos = () => {
    const [totales, setTotales] = useState({ ingresos: 0, insumos: 0, ganancia: 0 });
    const [listaInsumos, setListaInsumos] = useState([]);
    
    const [formData, setFormData] = useState({
        carneCerdo: '',
        tortillas: '',
        gasolinaGas: '',
        verduras: '',
        sueldos: '',
        plasticos: ''
    });

    const API_URL = 'http://localhost:5242/api/insumos';

    useEffect(() => {
        obtenerDatos();
    }, []);

    const obtenerDatos = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                setListaInsumos(data);
                const totalInsumos = data.reduce((acc, item) => acc + (item.monto || item.Monto || 0), 0);
                setTotales(prev => ({ ...prev, insumos: totalInsumos, ganancia: prev.ingresos - totalInsumos }));
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const itemsACrear = [
                { tipoInsumo: 'Carne de Cerdo', monto: formData.carneCerdo },
                { tipoInsumo: 'Tortillas', monto: formData.tortillas },
                { tipoInsumo: 'Gasolina / Gas', monto: formData.gasolinaGas },
                { tipoInsumo: 'Verduras', monto: formData.verduras },
                { tipoInsumo: 'Sueldos de Empleados', monto: formData.sueldos },
                { tipoInsumo: 'Plásticos / Platos / Desechables', monto: formData.plasticos }
            ];

            let todoOk = true;

            for (const item of itemsACrear) {
                if (item.monto !== '' && item.monto !== null && item.monto !== undefined) {
                    const valorNumerico = parseFloat(item.monto);
                    
                    if (!isNaN(valorNumerico) && valorNumerico > 0) {
                        const payload = {
                            TipoInsumo: String(item.tipoInsumo),
                            Monto: Number(valorNumerico),
                            Fecha: new Date().toISOString()
                        };

                        const response = await fetch(API_URL, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error("Falla en el servidor para:", item.tipoInsumo, errorText);
                            todoOk = false;
                        }
                    }
                }
            }

            if (todoOk) {
                setFormData({ carneCerdo: '', tortillas: '', gasolinaGas: '', verduras: '', sueldos: '', plasticos: '' });
                obtenerDatos();
                alert('¡Insumos registrados con éxito!');
            } else {
                alert('Hubo un detalle al registrar algunos insumos. Revisa la consola.');
            }
        } catch (error) {
            console.error('Error general en la petición:', error);
        }
    };

    return (
        <div className="gastos-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
            <h2 style={{ textAlign: 'center' }}>Historial y Corte de Caja</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', flex: '1', textAlign: 'center' }}>
                    <p>Ingresos Totales</p>
                    <h3>${totales.ingresos.toFixed(2)}</h3>
                </div>
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', flex: '1', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
                    <p>Total Insumos (Gastos)</p>
                    <h3>${totales.insumos.toFixed(2)}</h3>
                </div>
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', flex: '1', textAlign: 'center', borderTop: '4px solid #22c55e' }}>
                    <p>Ganancia Neta</p>
                    <h3>${totales.ganancia.toFixed(2)}</h3>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 Capturar Insumos del Día</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                        <label>Inversión en Carne de Cerdo ($):</label>
                        <input type="number" name="carneCerdo" value={formData.carneCerdo} onChange={handleChange} step="0.01" placeholder="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label>Gasto en Tortillas ($):</label>
                        <input type="number" name="tortillas" value={formData.tortillas} onChange={handleChange} step="0.01" placeholder="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label>Gasolina / Gas ($):</label>
                        <input type="number" name="gasolinaGas" value={formData.gasolinaGas} onChange={handleChange} step="0.01" placeholder="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label>Gasto en Verduras ($):</label>
                        <input type="number" name="verduras" value={formData.verduras} onChange={handleChange} step="0.01" placeholder="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label>Sueldos de Empleados ($):</label>
                        <input type="number" name="sueldos" value={formData.sueldos} onChange={handleChange} step="0.01" placeholder="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label>Plásticos / Platos / Desechables ($):</label>
                        <input type="number" name="plasticos" value={formData.plasticos} onChange={handleChange} step="0.01" placeholder="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                    </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    💾 Guardar Registro de Insumos
                </button>
            </form>
        </div>
    );
};

export default Gastos;