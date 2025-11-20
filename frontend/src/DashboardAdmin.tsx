import React, { useState } from 'react';
import { GestionProductos } from './GestionProductos'; // Importamos el componente nuevo

interface DashboardProps {
  nombreUsuario: string;
  onLogout: () => void;
}

// Vistas disponibles para el admin
type VistaAdmin = 'inicio' | 'productos' | 'usuarios' | 'metricas';

export function DashboardAdmin({ nombreUsuario, onLogout }: DashboardProps) {
  const [vistaActual, setVistaActual] = useState<VistaAdmin>('inicio');

  const renderizarVista = () => {
    switch (vistaActual) {
      case 'productos':
        return <GestionProductos />; // Aquí mostramos el componente que acabamos de crear
      case 'usuarios':
        return <p>Módulo de Usuarios (Próximamente - RU17)</p>;
      case 'metricas':
        return <p>Módulo de Métricas (Próximamente - RU15)</p>;
      case 'inicio':
      default:
        return <p>Selecciona una opción del menú de administración.</p>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR / MENÚ LATERAL */}
      <nav className="sidebar">
        <h3>ARLAB - Admin</h3>
        <p>Usuario: {nombreUsuario}</p>
        <hr />
        <button 
          onClick={() => setVistaActual('productos')}
          className={vistaActual === 'productos' ? 'active' : ''}
        >
          Gestión Productos (RU10-14)
        </button>
        <button 
          onClick={() => setVistaActual('usuarios')}
          className={vistaActual === 'usuarios' ? 'active' : ''}
        >
          Gestión Usuarios (RU17)
        </button>
        <button 
          onClick={() => setVistaActual('metricas')}
          className={vistaActual === 'metricas' ? 'active' : ''}
        >
          Métricas y Reportes (RU15)
        </button>
        <hr />
        <button onClick={onLogout}>Cerrar Sesión</button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="content">
        {renderizarVista()}
      </main>
    </div>
  );
}