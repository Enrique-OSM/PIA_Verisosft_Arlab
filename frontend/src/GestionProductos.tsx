import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

interface Producto {
  productoid: number;
  codigo: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaid: number;
  categorianombre?: string; // Opcional porque viene del JOIN
}

interface Categoria {
  categoriaid: number;
  nombre: string;
}

export function GestionProductos() {
  // Estados de Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados del Formulario
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prodActual, setProdActual] = useState<Partial<Producto>>({});

  // 1. Cargar Productos y Categorías
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Cargamos productos (con filtro search)
      const resProd = await axios.get(`${API_BASE_URL}/api/productos?search=${searchTerm}`);
      setProductos(resProd.data);

      // Cargamos categorías
      const resCat = await axios.get(`${API_BASE_URL}/api/categorias`);
      setCategorias(resCat.data);
    } catch (error) {
      alert('Error al cargar datos: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

// Esto hace que la búsqueda sea automática al escribir
  useEffect(() => {
    // Creamos un "debounce" para no llamar a la API por cada letra instantáneamente
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300); // Espera 300ms después de que dejes de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 2. Manejo del Formulario (Guardar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && prodActual.productoid) {
        // Editar (RU12)
        await axios.put(`${API_BASE_URL}/api/productos/${prodActual.productoid}`, prodActual);
      } else {
        // Crear (RU11)
        await axios.post(`${API_BASE_URL}/api/productos`, prodActual);
      }
      closeForm();
      fetchData();
    } catch (error) {
      alert('Error al guardar producto: ' + error);
    }
  };

  // 3. Eliminar (RU13)
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este producto?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/productos/${id}`);
        fetchData();
      } catch (error) {
        // CORRECCIÓN: Verificamos correctamente el error de Axios
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            alert(error.response.data.error); // Mensaje: "Ya tiene ventas registradas"
        } else {
            alert('Error al eliminar el producto.');
        }
      }
    }
  };

  // Auxiliares del Modal
  const openNew = () => {
    setProdActual({ codigo: '', descripcion: '', precio: 0, stock: 0, categoriaid: 0 });
    setIsEditing(false);
    setShowForm(true);
  };
  const openEdit = (p: Producto) => {
    setProdActual(p);
    setIsEditing(true);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setProdActual({});
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const isNumber = e.target.type === 'number' || e.target.name === 'categoriaid';
    const val = isNumber ? Number(e.target.value) : e.target.value;
    setProdActual({ ...prodActual, [e.target.name]: val });
  };

  return (
    <div>
      <h2>Gestión de Productos y Análisis (RU10-14)</h2>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="toolbar">
        <input 
          type="text" 
          // CAMBIO: Placeholder actualizado
          placeholder="Buscar por código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '300px' }}
        />
        <button onClick={openNew}>+ Nuevo Producto</button>
      </div>

      {/* TABLA DE PRODUCTOS */}
      {isLoading ? <p>Cargando...</p> : (
        <table>
          <thead>
            <tr>
              <th>Cód</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && (
                <tr><td colSpan={5}>No se encontraron productos.</td></tr>
            )}
            {productos.map(p => (
              <tr key={p.productoid}>
                <td>{p.codigo}</td>
                <td>{p.descripcion}</td>
                <td>{p.categorianombre || 'N/A'}</td>
                <td>${p.precio}</td>
                <td>
                  <button onClick={() => openEdit(p)}>Editar</button>
                  <button onClick={() => handleDelete(p.productoid)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL DE FORMULARIO */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Código:</label>
              <input name="codigo" value={prodActual.codigo || ''} onChange={handleChange} required />

              <label>Descripción:</label>
              <input name="descripcion" value={prodActual.descripcion || ''} onChange={handleChange} required />

              <label>Categoría:</label>
              <select name="categoriaid" value={prodActual.categoriaid || 0} onChange={handleChange} required>
                <option value={0}>-- Seleccione --</option>
                {categorias.map(c => (
                  <option key={c.categoriaid} value={c.categoriaid}>{c.nombre}</option>
                ))}
              </select>

              <label>Precio:</label>
              <input type="number" name="precio" value={prodActual.precio || 0} onChange={handleChange} required step="0.01" />

              <label>Stock (Opcional):</label>
              <input type="number" name="stock" value={prodActual.stock || 0} onChange={handleChange} />

              <div className="form-actions">
                <button type="submit">Guardar</button>
                <button type="button" onClick={closeForm}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}