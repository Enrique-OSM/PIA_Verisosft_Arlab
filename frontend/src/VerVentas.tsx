import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Interface para los datos que esperamos del API
interface VentaCompleta {
  ventaid: number;
  fechaahora: string; // Postgres envía 'fechaahora' (todo minúsculas)
  clientenombre: string;
  usuarionombre: string;
  total: number;
  descuentoaplicado: number;
}

export function VerVentas() {
  const [ventas, setVentas] = useState<VentaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Estados de los Filtros ---
  const [searchCliente, setSearchCliente] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Función para cargar las ventas
  const fetchVentas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Construimos los parámetros de la URL
      const params = new URLSearchParams();
      if (searchCliente) params.append('searchCliente', searchCliente);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const response = await axios.get(
        `${API_BASE_URL}/api/ventas?${params.toString()}`
      );
      setVentas(response.data);
    } catch (err) {
      setError('Error al cargar las ventas.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carga inicial de datos (sin filtros)
  useEffect(() => {
    fetchVentas();
  }, []); // Se ejecuta solo una vez al montar el componente

  // Manejador para el botón de filtrar
  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchVentas(); // Llama a la API con los filtros actuales
  };

  // Manejador para limpiar los filtros
  const handleClearFilters = () => {
    setSearchCliente('');
    setFechaInicio('');
    setFechaFin('');
    // (Podríamos recargar aquí, pero el submit lo hará)
  };

  // Función para formatear la fecha
  const formatFecha = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h2>Módulo de Reporte de Ventas (RU03)</h2>

      {/* --- Barra de Filtros --- */}
      <form className="toolbar" onSubmit={handleFilterSubmit}>
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={searchCliente}
          onChange={(e) => setSearchCliente(e.target.value)}
        />
        <label>
          Desde:
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </label>
        <label>
          Hasta:
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </label>
        <button type="submit">Filtrar</button>
        <button type="button" onClick={handleClearFilters}>Limpiar</button>
      </form>

      {/* --- Tabla de Resultados --- */}
      {isLoading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Fecha y Hora</th>
            <th>Cliente</th>
            <th>Vendido por</th>
            <th>Total</th>
            {/* Próximamente: Botón de Imprimir (RU04) */}
          </tr>
        </thead>
        <tbody>
          {!isLoading && ventas.length === 0 && (
            <tr>
              <td colSpan={5}>No se encontraron ventas con esos filtros.</td>
            </tr>
          )}
          {ventas.map(venta => (
            <tr key={venta.ventaid}>
              <td>{venta.ventaid}</td>
              <td>{formatFecha(venta.fechaahora)}</td>
              <td>{venta.clientenombre}</td>
              <td>{venta.usuarionombre}</td>
              <td>${venta.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}