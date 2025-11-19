import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Definimos la 'interface' para el objeto Cliente
interface Cliente {
  clienteid: number;
  dni: string;
  nombre: string;
  telefono: string;
  direccion: string;
  razonsocial: string;
}

export function GestionClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para el formulario (Crear/Editar)
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clienteActual, setClienteActual] = useState<Partial<Cliente> | null>(null);

  // --- 1. FUNCIÓN DE CARGA DE DATOS (RU05 y RU09) ---
  const fetchClientes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Usamos el endpoint con el parámetro 'search'
      const response = await axios.get(`${API_BASE_URL}/api/clientes?search=${searchTerm}`);
      setClientes(response.data);
    } catch (err) {
      setError('Error al cargar clientes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carga inicial y recarga al buscar
  useEffect(() => {
    fetchClientes();
  }, [searchTerm]); // Se re-ejecuta cada vez que 'searchTerm' cambia

  // --- 2. FUNCIONES CRUD ---

  // (RU08: Eliminar Cliente)
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/clientes/${id}`);
        fetchClientes(); // Recarga la lista
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          alert(err.response.data.error); // Muestra error de FK
        } else {
          alert('Error al eliminar cliente.');
        }
      }
    }
  };
  
  // (RU06 y RU07: Lógica del Formulario)
  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clienteActual?.nombre) {
      alert('El nombre es obligatorio.');
      return;
    }

    try {
      if (isEditing) {
        // (RU07: Modificar)
        await axios.put(`${API_BASE_URL}/api/clientes/${clienteActual.clienteid}`, clienteActual);
      } else {
        // (RU06: Crear)
        await axios.post(`${API_BASE_URL}/api/clientes`, clienteActual);
      }
      closeForm();
      fetchClientes(); // Recarga la lista
    } catch (err) {
      alert('Error al guardar cliente:' + err);
    }
  };

  // --- 3. FUNCIONES AUXILIARES (Formulario) ---
  
  const openFormForCreate = () => {
    setClienteActual({ // Objeto vacío para crear
      dni: '',
      nombre: '',
      telefono: '',
      direccion: '',
      razonsocial: ''
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const openFormForEdit = (cliente: Cliente) => {
    setClienteActual(cliente); // Carga datos del cliente a editar
    setIsEditing(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setClienteActual(null);
    setShowForm(false);
    setIsEditing(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClienteActual({
      ...clienteActual!,
      [e.target.name]: e.target.value
    });
  };

  // --- 4. RENDERIZADO ---
  return (
    <div>
      <h2>Módulo de Gestión de Clientes</h2>

      {/* --- FORMULARIO (Se muestra encima) --- */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>{isEditing ? 'Modificar Cliente' : 'Crear Nuevo Cliente'}</h3>
            <form onSubmit={handleSubmitForm}>
              <label>Nombre (*)</label>
              <input 
                name="nombre" 
                value={clienteActual?.nombre || ''} 
                onChange={handleFormChange} 
                required 
              />
              
              <label>DNI (Cédula/CURP)</label>
              <input 
                name="dni" 
                value={clienteActual?.dni || ''} 
                onChange={handleFormChange} 
              />
              
              <label>Teléfono</label>
              <input 
                name="telefono" 
                value={clienteActual?.telefono || ''} 
                onChange={handleFormChange} 
              />

              <label>Razón Social (Facturación)</label>
              <input 
                name="razonsocial" 
                value={clienteActual?.razonsocial || ''} 
                onChange={handleFormChange} 
              />

              <label>Dirección</label>
              <textarea 
                name="direccion" 
                value={clienteActual?.direccion || ''} 
                onChange={handleFormChange} 
                rows={3}
              />
              
              <div className="form-actions">
                <button type="submit">{isEditing ? 'Actualizar' : 'Crear'}</button>
                <button type="button" onClick={closeForm}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BARRA DE BÚSQUEDA Y ACCIONES (RU09) --- */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '300px' }}
        />
        <button onClick={openFormForCreate}>
          + Nuevo Cliente (RU06)
        </button>
      </div>

      {/* --- TABLA DE CLIENTES (RU05) --- */}
      {isLoading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>DNI</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {!isLoading && clientes.length === 0 && (
            <tr>
              <td colSpan={4}>No se encontraron clientes.</td>
            </tr>
          )}
          {clientes.map(cliente => (
            <tr key={cliente.clienteid}>
              <td>{cliente.nombre}</td>
              <td>{cliente.telefono}</td>
              <td>{cliente.dni}</td>
              <td>
                <button onClick={() => openFormForEdit(cliente)}>
                  Editar (RU07)
                </button>
                <button onClick={() => handleDelete(cliente.clienteid)}>
                  Eliminar (RU08)
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}