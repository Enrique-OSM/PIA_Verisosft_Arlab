import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

interface Usuario {
  usuarioid: number;
  nombre: string;
  email: string;
  rolid: number;
  rolnombre?: string;
  activo: boolean;
}

interface Rol {
  rolid: number;
  nombre: string;
}

export function GestionUsuarios() {
  // Estados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados Formulario
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Datos del usuario actual en edición
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState(''); // Opcional al editar
  const [formRolId, setFormRolId] = useState(2); // Default: Recepción
  const [formActivo, setFormActivo] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);

  // 1. Cargar Usuarios y Roles
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resUsers = await axios.get(`${API_BASE_URL}/api/usuarios`);
      const resRoles = await axios.get(`${API_BASE_URL}/api/roles`);
      setUsuarios(resUsers.data);
      setRoles(resRoles.data);
    } catch (error) {
      alert('Error al cargar usuarios' + error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Guardar (Crear o Editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      nombre: formNombre,
      email: formEmail,
      password: formPassword, // Si está vacío en edición, el backend lo ignora
      rolid: formRolId,
      activo: formActivo
    };

    try {
      if (isEditing && editId) {
        await axios.put(`${API_BASE_URL}/api/usuarios/${editId}`, payload);
      } else {
        if (!formPassword) {
          alert('La contraseña es obligatoria para nuevos usuarios.');
          return;
        }
        await axios.post(`${API_BASE_URL}/api/usuarios`, payload);
      }
      closeForm();
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar usuario.');
    }
  };

  // 3. Abrir Modal
  const openNew = () => {
    setFormNombre('');
    setFormEmail('');
    setFormPassword('');
    setFormRolId(2);
    setFormActivo(true);
    setEditId(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (u: Usuario) => {
    setFormNombre(u.nombre);
    setFormEmail(u.email);
    setFormPassword(''); // Limpiamos pass para no mostrar hash
    setFormRolId(u.rolid);
    setFormActivo(u.activo);
    setEditId(u.usuarioid);
    setIsEditing(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  // 4. Cambio Rápido de Estado (Activar/Desactivar)
  const toggleStatus = async (u: Usuario) => {
    if (!window.confirm(`¿Deseas ${u.activo ? 'desactivar' : 'activar'} a ${u.nombre}?`)) return;
    
    try {
      await axios.put(`${API_BASE_URL}/api/usuarios/${u.usuarioid}`, {
        nombre: u.nombre,
        email: u.email,
        rolid: u.rolid,
        activo: !u.activo, // Invertimos el estado
        password: '' // No cambiamos pass
      });
      fetchData();
    } catch (error) {
      alert('Error al cambiar estado'+error);
    }
  };

  return (
    <div>
      <h2>Gestión de Usuarios y Roles (RU17)</h2>

      <div className="toolbar">
        <button onClick={openNew}>+ Nuevo Usuario</button>
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.usuarioid} style={{ opacity: u.activo ? 1 : 0.6 }}>
                <td>{u.usuarioid}</td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rolnombre}</td>
                <td>
                  <span style={{ 
                    color: u.activo ? 'green' : 'red', 
                    fontWeight: 'bold' 
                  }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button onClick={() => openEdit(u)}>Editar</button>
                  <button onClick={() => toggleStatus(u)} style={{ marginLeft: '5px' }}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL FORMULARIO */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Nombre:</label>
              <input value={formNombre} onChange={e => setFormNombre(e.target.value)} required />

              <label>Email (Usuario):</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required />

              <label>
                Contraseña {isEditing && <small>(Dejar en blanco para mantener actual)</small>}:
              </label>
              <input 
                type="password" 
                value={formPassword} 
                onChange={e => setFormPassword(e.target.value)} 
                placeholder={isEditing ? "Sin cambios" : "Obligatoria"}
              />

              <label>Rol:</label>
              <select 
                value={formRolId} 
                onChange={e => setFormRolId(Number(e.target.value))}
              >
                {roles.map(r => (
                  <option key={r.rolid} value={r.rolid}>{r.nombre}</option>
                ))}
              </select>

              {isEditing && (
                <label style={{ marginTop: '10px', display: 'block' }}>
                  <input 
                    type="checkbox" 
                    checked={formActivo} 
                    onChange={e => setFormActivo(e.target.checked)}
                  />
                  Usuario Activo
                </label>
              )}

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