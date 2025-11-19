import React from 'react';

// Reutilizamos la misma 'interface' de props
interface DashboardProps {
  nombreUsuario: string;
  onLogout: () => void;
}

export function DashboardAdmin({ nombreUsuario, onLogout }: DashboardProps) {
  return (
    <div className="card">
      <h2>ARLAB - Panel de Administrador</h2>
      <p>Bienvenido, {nombreUsuario} (Admin).</p>
      
      {/* Aquí irían los componentes de Admin (ej. Ver Métricas) */}
      <button>Ver Métricas (Próximamente)</button>
      <button>Gestión de Usuarios (Próximamente)</button>
      
      <hr />
      <button onClick={onLogout}>Cerrar Sesión</button>
    </div>
  );
}