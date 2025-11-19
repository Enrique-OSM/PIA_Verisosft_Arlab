import React, { useState } from 'react';
import { GestionClientes } from './GestionClientes';
import { VerVentas } from './VerVentas';
import { IngresarVenta } from './IngresarVenta'; 

interface DashboardProps {
  nombreUsuario: string;
  usuarioId: number; // ID necesario para registrar ventas
  onLogout: () => void;
}

// Definimos las vistas posibles
type Vista = 'inicio' | 'clientes' | 'ventas' | 'reportes';

export function DashboardRecepcion({ nombreUsuario, usuarioId, onLogout }: DashboardProps) {
  // Estado para controlar la vista actual
  const [vistaActual, setVistaActual] = useState<Vista>('inicio');

  // Función para decidir qué componente mostrar
  const renderizarVista = () => {
    switch (vistaActual) {
      case 'clientes':
        return <GestionClientes />;
      
      case 'ventas':
        return (
          <IngresarVenta 
            usuarioId={usuarioId} 
            onVentaTerminada={() => setVistaActual('reportes')} 
          />
        );

      case 'reportes':
        return <VerVentas />;

      case 'inicio':
      default:
        return <p>Selecciona una opción del menú para comenzar.</p>;
    }
  };

  // --- AQUÍ ESTABA EL PROBLEMA: FALTABA ESTE RETURN ---
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