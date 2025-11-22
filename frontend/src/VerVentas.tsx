import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

interface DetalleProducto {
  producto: string;
  cantidad: number;
  precio: number;
}

interface VentaCompleta {
  ventaid: number;
  fechahora: string;
  clientenombre: string;
  usuarionombre: string;
  total: number;
  descuentoaplicado: number;
  detalles: DetalleProducto[];
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
    // fetchVentas(); // Descomentar si quieres recarga inmediata
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-MX');
  };

const imprimirTicket = (venta: VentaCompleta) => {
    const totalNumerico = Number(venta.total);
    const descuentoNumerico = Number(venta.descuentoaplicado);
    const subtotal = totalNumerico + descuentoNumerico;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket Venta #${venta.ventaid}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; font-size: 12px; margin: 0; padding: 10px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            hr { border-top: 1px dashed black; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 2px 0; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h3 style="margin: 0;">ARLAB</h3>
            <p style="margin: 5px 0;">Laboratorio Clínico</p>
            <p style="font-size: 10px;">Av. Universidad S/N, San Nicolás<br>Nuevo León, México</p>
            <hr>
            <div style="text-align: left;">
              <strong>Folio:</strong> ${venta.ventaid}<br>
              <strong>Fecha:</strong> ${formatFecha(venta.fechahora)}<br>
              <strong>Cliente:</strong> ${venta.clientenombre}<br>
              <strong>Atendió:</strong> ${venta.usuarionombre}
            </div>
            <hr>
          </div>
          
          <table>
            <thead>
              <tr>
                <th align="left" style="border-bottom: 1px solid #000;">Cant. Descrip</th>
                <th align="right" style="border-bottom: 1px solid #000;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${venta.detalles.map(d => `
                <tr>
                  <td>${d.cantidad} x ${d.producto}</td>
                  <td align="right">$${(Number(d.cantidad) * Number(d.precio)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <hr>
          
          <table>
             <tr>
              <td>Subtotal:</td>
              <td align="right">$${subtotal.toFixed(2)}</td>
            </tr>
             <tr>
              <td>Descuento:</td>
              <td align="right">-$${descuentoNumerico.toFixed(2)}</td>
            </tr>
            <tr style="font-size: 14px; font-weight: bold;">
              <td style="padding-top: 5px;">TOTAL:</td>
              <td align="right" style="padding-top: 5px;">$${totalNumerico.toFixed(2)}</td>
            </tr>
          </table>

          <br>
          <div class="text-center">
            <p>¡Gracias por su preferencia!</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    // CAMBIO 2: Especificar la codificación al crear el Blob
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    const url = URL.createObjectURL(blob);
    const ventana = window.open(url, '_blank', 'height=600,width=400');
    if (!ventana) alert('Por favor permite las ventanas emergentes.');
  };

  return (
    <div>
      <h2>Módulo de Reporte de Ventas (RU03 y RU04)</h2>

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
            <th>Detalles</th>
            <th>Descuento</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>

          {fechaInicio > fechaFin && (
            <tr>
              <td colSpan={8}>La fecha final no puede ser menor a la fecha de inicio</td>
            </tr>
          )}
            {/* {!isLoading && ventas.length === 0 && (
            <tr>
              <td colSpan={8}>No se encontraron ventas con esos filtros.</td>
            </tr>
          )} */}
          {ventas.map(venta => (
            <tr key={venta.ventaid}>
              <td>{venta.ventaid}</td>
              <td>{formatFecha(venta.fechahora)}</td>
              <td>{venta.clientenombre}</td>
              <td>{venta.usuarionombre}</td>
              
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

              <td style={{ color: venta.descuentoaplicado > 0 ? 'green' : 'inherit' }}>
                {venta.descuentoaplicado > 0 ? `-$${venta.descuentoaplicado}` : '$0.00'}
              </td>
              
              <td style={{ fontWeight: 'bold' }}>${venta.total}</td>
              
              {/* BOTÓN DE IMPRIMIR (RU04) */}
              <td>
                <button onClick={() => imprimirTicket(venta)}>
                  🖨️ Imprimir
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}