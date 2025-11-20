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
  descripcion: string;
  precio: number;
  categorianombre: string;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface Props {
  usuarioId: number;
  onVentaTerminada: () => void;
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

  // --- CAMBIO 1: Estado para el descuento ---
  const [descuento, setDescuento] = useState<number>(0); 

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

    const existe = carrito.find(item => item.producto.productoid === prod.productoid);
    
    if (existe) {
      alert('Este análisis ya está agregado a la lista.');
      return;
    }

    setCarrito([...carrito, { producto: prod, cantidad: 1 }]);
    setProductoSeleccionado('');
  };

  // 3. Eliminar del Carrito
  const eliminarDelCarrito = (idProducto: number) => {
    setCarrito(carrito.filter(item => item.producto.productoid !== idProducto));
  };

  // --- CAMBIO 2: Cálculo de Subtotal y Total Final ---
  const subTotal = carrito.reduce((acc, item) => {
    return acc + (Number(item.producto.precio) * item.cantidad);
  }, 0);

  const totalFinal = subTotal - descuento;

  // 5. Finalizar Venta (Enviar al Backend)
  const handleFinalizarVenta = async () => {
    if (clienteSeleccionado === '' || carrito.length === 0) {
      alert('Selecciona un cliente y agrega al menos un producto.');
      return;
    }

    // Validar que el descuento no sea mayor al total
    if (totalFinal < 0) {
      alert('El descuento no puede ser mayor al total de la venta.');
      return;
    }

    if (!window.confirm(`¿Confirmar venta por un total final de $${totalFinal}?`)) return;

    setIsSubmitting(true);
    try {
      // Construir el payload para el backend
      const payload = {
        clienteId: Number(clienteSeleccionado),
        usuarioId: usuarioId,
        total: totalFinal, // Enviamos el total ya con descuento
        descuento: descuento, // --- CAMBIO 3: Enviamos el descuento para registro ---
        items: carrito.map(item => ({
          productoId: item.producto.productoid,
          cantidad: item.cantidad,
          precio: item.producto.precio
        }))
      };

      // (Nota: Asegúrate de que tu backend endpoint /api/ventas reciba 'descuento' en el body 
      // y lo guarde en la columna DescuentoAplicado de la tabla Ventas)
      await axios.post(`${API_BASE_URL}/api/ventas`, payload);
      
      alert('¡Venta registrada exitosamente!');
      setCarrito([]);
      setClienteSeleccionado('');
      setDescuento(0); // Resetear descuento
      onVentaTerminada();

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
            {/* --- CAMBIO 4: Footer de Tabla con Subtotal, Descuento y Total --- */}
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right' }}>Subtotal:</td>
                <td style={{ fontWeight: 'bold' }}>${subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', color: 'green' }}>
                   Descuento (-):
                </td>
                <td>
                  <input 
                    type="number" 
                    min="0" 
                    max={subTotal}
                    value={descuento} 
                    onChange={(e) => setDescuento(Number(e.target.value))}
                    style={{ width: '80px', textAlign: 'right' }}
                  />
                </td>
              </tr>
              <tr style={{ fontSize: '1.2em', borderTop: '2px solid #ccc' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}><strong>TOTAL A PAGAR:</strong></td>
                <td style={{ fontWeight: 'bold', color: '#007bff' }}>${totalFinal.toFixed(2)}</td>
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