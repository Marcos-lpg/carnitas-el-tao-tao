import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [vista, setVista] = useState('login');

  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regNombreUsuario, setRegNombreUsuario] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [codigo, setCodigo] = useState('');
  const [correoParaVerificar, setCorreoParaVerificar] = useState('');

  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5242/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreUsuario: loginUsuario, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', data.usuario);
        onLoginSuccess();
      } else {
        setError(data.message || 'Credenciales incorrectas o correo sin verificar');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor. Revisa si la API está corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5242/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombreUsuario: regNombreUsuario, 
          correo: regCorreo, 
          password: regPassword 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setCorreoParaVerificar(regCorreo);
        setMensajeExito('¡Cuenta creada exitosamente! Revisa tu bandeja de correo electrónico.');
        setVista('verificar');
      } else {
        setError(data.message || 'No se pudo registrar la cuenta.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5242/api/auth/verificar-correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correoParaVerificar, codigo })
      });
      const data = await response.json();
      if (response.ok) {
        setMensajeExito('¡Correo verificado con éxito! Ya puedes iniciar sesión.');
        setVista('login');
      } else {
        setError(data.message || 'Código inválido o expirado.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '28rem', padding: '2rem', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Carnitas El Tao Tao</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {vista === 'login' && 'Inicia sesión para gestionar el sistema'}
            {vista === 'register' && 'Regístrate para crear tu cuenta'}
            {vista === 'verificar' && 'Verifica tu dirección de correo'}
          </p>
        </div>
        
        {error && (
          <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#f87171', backgroundColor: 'rgba(69, 10, 10, 0.5)', border: '1px solid #991b1b', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {mensajeExito && (
          <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#4ade80', backgroundColor: 'rgba(6, 78, 59, 0.5)', border: '1px solid #065f46', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            {mensajeExito}
          </div>
        )}
        
        {vista === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Usuario</label>
              <input 
                type="text" 
                value={loginUsuario} 
                onChange={(e) => setLoginUsuario(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Ingresa tu usuario"
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contraseña</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontWeight: '700', color: 'white', backgroundColor: '#d97706', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.3)' }}
            >
              {loading ? 'Entrando...' : 'Entrar al Sistema'}
            </button>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', textAlign: 'center' }}>
              <button 
                type="button"
                onClick={() => { setVista('register'); setError(''); setMensajeExito(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', color: '#fbbf24', textDecoration: 'underline' }}
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </div>
          </form>
        )}

        {vista === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Nombre de Usuario</label>
              <input 
                type="text" 
                value={regNombreUsuario} 
                onChange={(e) => setRegNombreUsuario(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Tu usuario"
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Correo Electrónico</label>
              <input 
                type="email" 
                value={regCorreo} 
                onChange={(e) => setRegCorreo(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="tucorreo@email.com"
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contraseña</label>
              <input 
                type="password" 
                value={regPassword} 
                onChange={(e) => setRegPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Confirmar Contraseña</label>
              <input 
                type="password" 
                value={regConfirmPassword} 
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontWeight: '700', color: 'white', backgroundColor: '#16a34a', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', textAlign: 'center' }}>
              <button 
                type="button"
                onClick={() => { setVista('login'); setError(''); setMensajeExito(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textDecoration: 'underline' }}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </form>
        )}

        {vista === 'verificar' && (
          <form onSubmit={handleVerificar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.25rem', textAlign: 'center' }}>Código de 6 Dígitos</label>
              <input 
                type="text" 
                maxLength="6"
                value={codigo} 
                onChange={(e) => setCodigo(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.25rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                placeholder="123456"
                required 
              />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center', lineHeight: '1.4' }}>
                Hemos enviado un código de verificación a tu correo electrónico. Revisa tu bandeja de entrada o spam.
              </p>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontWeight: '700', color: 'white', backgroundColor: '#d97706', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.3)' }}
            >
              {loading ? 'Validando...' : 'Validar Código'}
            </button>
            <button 
              type="button"
              onClick={() => { setVista('login'); setError(''); setMensajeExito(''); }}
              style={{ width: '100%', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}
            >
              Ir a Iniciar Sesión
            </button>
          </form>
        )}

      </div>
    </div>
  );
}