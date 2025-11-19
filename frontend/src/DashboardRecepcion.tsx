import React, { useState } from 'react';
import { GestionClientes } from './GestionClientes'; // Importamos el nuevo componente
import { VerVentas } from './VerVentas';

interface DashboardProps {
  nombreUsuario: string;
  onLogout: () => void;
}

// Definimos las vistas posibles
type Vista = 'inicio' | 'clientes' | 'ventas' | 'reportes';

export function DashboardRecepcion({ nombreUsuario, onLogout }: DashboardProps) {
  // Estado para controlar la vista actual
  const [vistaActual, setVistaActual] = useState<Vista>('inicio');

  // Función para renderizar la vista seleccionada
  const renderizarVista = () => {
    switch (vistaActual) {
      case 'clientes':
        return <GestionClientes />;
      case 'ventas':
        return <p>Módulo de Ventas (Próximamente)...</p>; // (RU02)
      case 'reportes':
        return <VerVentas />; // (RU03)
      case 'inicio':
      default:
        return <p>Selecciona una opción del menú para comenzar.</p>;
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <h3>ARLAB - Recepción</h3>
        <p>Usuario: {nombreUsuario}</p>
        <hr />
        {/* Menú de Navegación */}
        <button 
          onClick={() => setVistaActual('ventas')}
          className={vistaActual === 'ventas' ? 'active' : ''}
        >
          Ingresar Venta (RU02)
        </button>
        <button 
          onClick={() => setVistaActual('clientes')}
          className={vistaActual === 'clientes' ? 'active' : ''}
        >
          Gestión de Clientes (RU05-09)
        </button>
        <button 
          onClick={() => setVistaActual('reportes')}
          className={vistaActual === 'reportes' ? 'active' : ''}
        >
          Ver Ventas (RU03)
        </button>
        <hr />
        <button onClick={onLogout}>Cerrar Sesión</button>
      </nav>

      <main className="content">
        {renderizarVista()}
      </main>
    </div>
  );
}