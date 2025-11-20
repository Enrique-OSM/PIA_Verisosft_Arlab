import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Interface para el detalle individual (Producto, cantidad, precio)
interface DetalleProducto {
  producto: string;
  cantidad: number;
  precio: number;
}

// Interface actualizada para la Venta
interface VentaCompleta {
  ventaid: number;
  fechahora: string; // Ojo: Postgres suele devolver esto como 'fechahora'
  clientenombre: string;
  usuarionombre: string;
  total: number;
  descuentoaplicado: number;
  detalles: DetalleProducto[]; // <-- AÑADIDO: Array con los productos
}

export function VerVentas() {
  const [ventas, setVentas] = useState<VentaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchCliente, setSearchCliente] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchVentas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchCliente) params.append('searchCliente', searchCliente);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const response = await axios.get(`${API_BASE_URL}/api/ventas?${params.toString()}`);
      setVentas(response.data);
    } catch (err) {
      setError('Error al cargar las ventas.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchVentas();
  };

  const handleClearFilters = () => {
    setSearchCliente('');
    setFechaInicio('');
    setFechaFin('');
    // Opcional: llamar a fetchVentas() aquí si quieres recargar al limpiar
  };

  // Función simple para formatear fecha
  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-MX');
  };

  return (
    <div>
      <h2>Módulo de Reporte de Ventas (RU03)</h2>

      <form className="toolbar" onSubmit={handleFilterSubmit}>
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={searchCliente}
          onChange={(e) => setSearchCliente(e.target.value)}
        />
        <label>
          Desde:
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </label>
        <label>
          Hasta:
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </label>
        <button type="submit">Filtrar</button>
        <button type="button" onClick={handleClearFilters}>Limpiar</button>
      </form>

      {isLoading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

<table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Detalles de Productos</th>
            <th>Descuento</th> {/* <--- 1. NUEVA COLUMNA ENCABEZADO */}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {!isLoading && ventas.length === 0 && (
            <tr>
              <td colSpan={7}>No se encontraron ventas con esos filtros.</td>
            </tr>
          )}
          {ventas.map(venta => (
            <tr key={venta.ventaid}>
              <td>{venta.ventaid}</td>
              <td>{formatFecha(venta.fechahora)}</td>
              <td>{venta.clientenombre}</td>
              <td>{venta.usuarionombre}</td>
              
              {/* Lista de productos */}
              <td style={{ fontSize: '0.9em' }}>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {venta.detalles && venta.detalles.map((d, idx) => (
                    <li key={idx}>
                      <strong>{d.producto}</strong> <br/>
                      <span style={{ color: '#666' }}>
                        Cant: {d.cantidad} x ${d.precio}
                      </span>
                    </li>
                  ))}
                </ul>
              </td>

              {/* <--- 2. NUEVA COLUMNA DATO (DESCUENTO) */}
              <td style={{ color: venta.descuentoaplicado > 0 ? 'green' : 'inherit' }}>
                {venta.descuentoaplicado > 0 ? `-$${venta.descuentoaplicado}` : '$0.00'}
              </td>
              
              <td style={{ fontWeight: 'bold' }}>${venta.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}