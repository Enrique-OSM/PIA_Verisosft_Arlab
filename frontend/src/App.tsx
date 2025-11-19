import { useState } from 'react';
import axios from 'axios';
import './App.css';

// 1. Importa los nuevos componentes de vista
import { DashboardAdmin } from './DashboardAdmin';
import { DashboardRecepcion } from './DashboardRecepcion';

// 2. Define un tipo para el objeto de usuario (coincide con la respuesta del API)
interface User {
  id: number;
  nombre: string;
  email: string;
  rolId: number; // El RolID 1=Admin, 2=Recepcion
}

function App() {
  // --- Estados del Formulario de Login ---
  const [email, setEmail] = useState('admin@arlab.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 3. Este es nuestro "controlador de sesión"
  // Si es 'null', no hay sesión. Si tiene un objeto User, sí hay sesión.
  const [usuarioLogueado, setUsuarioLogueado] = useState<User | null>(null);

  // --- Funciones de Autenticación ---

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });
      
      // ¡ÉXITO! Guarda el usuario completo en el estado
      setUsuarioLogueado(response.data.user); 
      setPassword(''); // Limpia el password por seguridad

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Error al iniciar sesión');
      } else {
        setError('Ocurrió un error inesperado');
      }
    }
  };

  const handleLogout = () => {
    // Simplemente borramos el usuario del estado para cerrar sesión
    setUsuarioLogueado(null);
  };

  // --- 4. LÓGICA DE RENDERIZADO (EL "ENRUTADOR") ---

  // Si no hay nadie logueado, muestra el formulario de Login
  if (!usuarioLogueado) {
    return (
      <div className="App">
        <h1>ARLAB - Iniciar Sesión</h1>
        <div className="card">
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Entrar</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  // Si hay alguien logueado, decide qué vista mostrar
  // (Usamos el rolID 1 para Admin, 2 para Recepcion, basado en tu seed.sql)
  return (
    <div className="App">
      {usuarioLogueado.rolId === 1 ? (
        <DashboardAdmin 
          nombreUsuario={usuarioLogueado.nombre} 
          onLogout={handleLogout} 
        />
      ) : (
        <DashboardRecepcion 
          nombreUsuario={usuarioLogueado.nombre} 
          onLogout={handleLogout} 
          usuarioId={usuarioLogueado.id} 
        />
      )}
    </div>
  );
}

export default App;