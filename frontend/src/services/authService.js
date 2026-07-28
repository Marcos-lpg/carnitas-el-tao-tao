import axios from 'axios';

// Asegúrate de que este puerto coincida con el que te da tu backend de .NET al correr (ej: 5000, 7000, etc.)
const API_URL = 'https://localhost:7000/api/auth'; 

export const registrarUsuario = async (datos) => {
    const response = await axios.post(`${API_URL}/register`, datos);
    return response.data;
};

export const verificarCorreoApi = async (datos) => {
    const response = await axios.post(`${API_URL}/verificar-correo`, datos);
    return response.data;
};

export const loginUsuario = async (datos) => {
    const response = await axios.post(`${API_URL}/login`, datos);
    return response.data;
};