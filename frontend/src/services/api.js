import axios from 'axios';

// Cambia el 5000 si tu API de .NET usa otro puerto
const API_URL = 'http://localhost:5242/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getProductos = async () => {
  const response = await api.get('/Productos');
  return response.data;
};

export const registrarVenta = async (datosVenta) => {
  const response = await api.post('/Ventas', datosVenta);
  return response.data;
};

export const getVentas = async () => {
  const response = await api.get('/Ventas');
  return response.data;
};
export const getInsumos = async () => {
  const response = await api.get('/Insumos');
  return response.data;
};

export const registrarInsumo = async (datosInsumo) => {
  const response = await api.post('/Insumos', datosInsumo);
  return response.data;
};

export default api;