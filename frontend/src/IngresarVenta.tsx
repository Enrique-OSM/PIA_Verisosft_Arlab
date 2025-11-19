import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Definición de Tipos
interface Cliente {
  clienteid: number;
  nombre: string;
  dni: string;
}

interface Producto {
  productoid: number;
  descripcion: string; // Nombre del análisis
  precio: number; // Viene como string desde Postgres a veces, cuidado
  categorianombre: string;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface Props {
  usuarioId: number; // Necesitamos saber QUIÉN hace la venta
  onVentaTerminada: () => void; // Para redirigir al terminar
}

export function IngresarVenta({ usuarioId, onVentaTerminada }: Props) {
  // --- Estados de Datos ---
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  // --- Estados del Formulario ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState<number | ''>('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | ''>('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Cargar Clientes y Productos al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resClientes = await axios.get(`${API_BASE_URL}/api/clientes`);
        const resProductos = await axios.get(`${API_BASE_URL}/api/productos`);
        setClientes(resClientes.data);
        setProductos(resProductos.data);
      } catch (error) {
        alert('Error al cargar catálogos' + error);
      }
    };
    cargarDatos();
  }, []);

  // 2. Agregar al Carrito
  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;

    const prod = productos.find(p => p.productoid === Number(productoSeleccionado));
    if (!prod) return;

    // Verificar si ya está en el carrito
    const existe = carrito.find(item => item.producto.productoid === prod.productoid);
    
    if (existe) {
      alert('Este análisis ya está agregado a la lista.');
      return;
    }

    // Agregar nuevo item (Análisis clínicos usualmente son Cantidad: 1)
    setCarrito([...carrito, { producto: prod, cantidad: 1 }]);
    setProductoSeleccionado(''); // Resetear selector
  };

  // 3. Eliminar del Carrito
  const eliminarDelCarrito = (idProducto: number) => {
    setCarrito(carrito.filter(item => item.producto.productoid !== idProducto));
  };

  // 4. Calcular Total
  const totalVenta = carrito.reduce((acc, item) => {
    return acc + (Number(item.producto.precio) * item.cantidad);
  }, 0);

  // 5. Finalizar Venta (Enviar al Backend)
  const handleFinalizarVenta = async () => {
    if (clienteSeleccionado === '' || carrito.length === 0) {
      alert('Selecciona un cliente y agrega al menos un producto.');
      return;
    }

    if (!window.confirm(`¿Confirmar venta por un total de $${totalVenta}?`)) return;

    setIsSubmitting(true);
    try {
      // Construir el payload para el backend
      const payload = {
        clienteId: Number(clienteSeleccionado),
        usuarioId: usuarioId, // ID del recepcionista logueado
        total: totalVenta,
        items: carrito.map(item => ({
          productoId: item.producto.productoid,
          cantidad: item.cantidad,
          precio: item.producto.precio
        }))
      };

      await axios.post(`${API_BASE_URL}/api/ventas`, payload);
      
      alert('¡Venta registrada exitosamente!');
      setCarrito([]); // Limpiar carrito
      setClienteSeleccionado('');
      onVentaTerminada(); // Volver al menú o reporte

    } catch (error) {
      console.error(error);
      alert('Error al procesar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Ingresar Nueva Venta (RU02)</h2>
      
      <div className="card" style={{ textAlign: 'left' }}>
        {/* SELECCIÓN DE CLIENTE */}
        <div style={{ marginBottom: '1rem' }}>
          <label><strong>1. Seleccionar Cliente:</strong></label><br/>
          <select 
            value={clienteSeleccionado} 
            onChange={(e) => setClienteSeleccionado(Number(e.target.value))}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Seleccione un Paciente --</option>
            {clientes.map(c => (
              <option key={c.clienteid} value={c.clienteid}>
                {c.nombre} (DNI: {c.dni})
              </option>
            ))}
          </select>
        </div>

        {/* SELECCIÓN DE PRODUCTOS */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label><strong>2. Agregar Análisis/Estudio:</strong></label><br/>
            <select 
              value={productoSeleccionado} 
              onChange={(e) => setProductoSeleccionado(Number(e.target.value))}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="">-- Seleccione Análisis --</option>
              {productos.map(p => (
                <option key={p.productoid} value={p.productoid}>
                  {p.descripcion} - ${p.precio} ({p.categorianombre})
                </option>
              ))}
            </select>
          </div>
          <button onClick={agregarAlCarrito} style={{ marginTop: '20px' }}>
            + Agregar
          </button>
        </div>

        <hr />

        {/* RESUMEN DE VENTA (CARRITO) */}
        <h3>Resumen de la Orden</h3>
        {carrito.length === 0 ? (
          <p style={{ color: '#888' }}>No hay análisis agregados.</p>
        ) : (
          <table width="100%">
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map(item => (
                <tr key={item.producto.productoid}>
                  <td>{item.producto.descripcion}</td>
                  <td>${item.producto.precio}</td>
                  <td>
                    <button 
                      onClick={() => eliminarDelCarrito(item.producto.productoid)}
                      style={{ background: '#ff4444', color: 'white', padding: '2px 8px' }}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ textAlign: 'right' }}><strong>TOTAL:</strong></td>
                <td style={{ fontWeight: 'bold', fontSize: '1.2em' }}>${totalVenta}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button 
            onClick={handleFinalizarVenta} 
            disabled={isSubmitting || carrito.length === 0}
            style={{ fontSize: '1.1em', padding: '10px 20px' }}
          >
            {isSubmitting ? 'Procesando...' : '✅ Finalizar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
}