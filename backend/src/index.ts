import express, { Request, Response } from 'express';
import { Pool } from 'pg'; // Importa el Pool de node-postgres
import cors from 'cors';
import bcrypt from 'bcrypt';

// 1. INICIALIZACIÓN DE EXPRESS
const app = express();
const port = 3001; // Puerto para el servidor backend (diferente al de React)

// 2. MIDDLEWARE
// Permite a Express entender y enviar/recibir JSON
app.use(express.json());
app.use(cors());

// 3. POOL DE CONEXIÓN A POSTGRESQL
// Estos datos deben coincidir con tu archivo docker-compose.yml
const pool = new Pool({
  user: 'arlab_user',
  host: 'localhost',
  database: 'arlab_db',
  password: 'yoursecurepassword', // ¡IMPORTANTE: Usa la contraseña que definiste!
  port: 5433,
});

// 4. ENDPOINTS (RUTAS DE TU API)

// Endpoint simple para probar que el servidor funciona
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: '¡El backend de ARLAB está funcionando!' });
});

// Endpoint para probar la conexión con la Base de Datos
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Consulta la hora actual de la BD
    res.json({ 
      message: 'Conexión a PostgreSQL exitosa', 
      time: result.rows[0].now 
    });
  } catch (error) {
    console.error('Error al conectar con la BD:', error);
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});

// --- ENDPOINT DE LOGIN (AUTENTICACIÓN) ---
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Validar que tengamos email y password
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  try {
    // 2. Buscar al usuario en la base de datos por su email
    const userQuery = await pool.query(
      'SELECT * FROM Usuarios WHERE Email = $1',
      [email]
    );

    // 3. Verificar si el usuario existe
    if (userQuery.rows.length === 0) {
      // Usamos un mensaje genérico por seguridad
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userQuery.rows[0];

    // 4. Comparar la contraseña enviada con el hash guardado
    const passwordMatch = await bcrypt.compare(password, user.passwordhash);

    if (!passwordMatch) {
      // Mensaje genérico por seguridad
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 5. ¡Login exitoso!
    // (Aquí es donde generarías un Token JWT, pero por ahora...)
    console.log(`Login exitoso para: ${user.email}`);

    // No envíes NUNCA el hash de la contraseña de vuelta
    res.json({
      message: 'Login exitoso',
      user: {
        id: user.usuarioid,
        nombre: user.nombre,
        email: user.email,
        rolId: user.rolid
      },
      // Enviaremos un "token" falso por ahora
      token: 'dummy-jwt-token-para-simular-sesion' 
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- API CRUD DE CLIENTES ---

// GET /api/clientes (RU05: Ver Clientes) y (RU09: Buscar Cliente)
app.get('/api/clientes', async (req: Request, res: Response) => {
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM Clientes ORDER BY Nombre ASC';
    const params = [];

    if (search && typeof search === 'string') {
      // Búsqueda por DNI, Nombre o Teléfono (RU09)
      query = `
        SELECT * FROM Clientes 
        WHERE Nombre ILIKE $1 
           OR DNI ILIKE $1 
           OR Telefono ILIKE $1 
        ORDER BY Nombre ASC
      `;
      params.push(`%${search}%`); // ILIKE es case-insensitive en Postgres
    }

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clientes/:id (Para obtener un solo cliente para editar)
app.get('/api/clientes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Clientes WHERE ClienteID = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clientes (RU06: Crear Cliente)
app.post('/api/clientes', async (req: Request, res: Response) => {
  // Datos del RU06 
  const { dni, nombre, telefono, direccion, razonsocial } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Clientes (DNI, Nombre, Telefono, Direccion, RazonSocial) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`, // RETURNING * devuelve el cliente recién creado
      [dni, nombre, telefono, direccion, razonsocial]
    );
    res.status(201).json(result.rows[0]); // 201 = Creado
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/clientes/:id (RU07: Modificar Cliente)
app.put('/api/clientes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { dni, nombre, telefono, direccion, razonsocial } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const result = await pool.query(
      `UPDATE Clientes 
       SET DNI = $1, Nombre = $2, Telefono = $3, Direccion = $4, RazonSocial = $5
       WHERE ClienteID = $6
       RETURNING *`,
      [dni, nombre, telefono, direccion, razonsocial, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]); // Devuelve el cliente actualizado
  } catch (error) {
    console.error('Error al modificar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/clientes/:id (RU08: Eliminar Cliente)
app.delete('/api/clientes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM Clientes WHERE ClienteID = $1 RETURNING *', 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado', cliente: result.rows[0] });
    
  } catch (error) {
    // Captura de error de llave foránea (si el cliente ya tiene ventas)
    if (error === '23503') { // Código de FK violation en Postgres
        return res.status(409).json({ error: 'No se puede eliminar el cliente porque tiene ventas asociadas.' });
    }
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- API PARA VER VENTAS (RU03) ---

// GET /api/ventas (RU03: Ver Ventas con filtros)
app.get('/api/ventas', async (req: Request, res: Response) => {
  const { searchCliente, fechaInicio, fechaFin } = req.query;

  try {
    const params = [];
    const whereClauses = [];

    // Consultamos Venta, Cliente, Usuario Y agregamos un JSON con los detalles
    let query = `
      SELECT 
        v.VentaID, 
        v.FechaHora, 
        c.Nombre AS ClienteNombre, 
        u.Nombre AS UsuarioNombre, 
        v.Total,
        v.DescuentoAplicado,
        json_agg(json_build_object(
          'producto', p.Descripcion,
          'cantidad', vd.Cantidad,
          'precio', vd.PrecioUnitario
        )) AS detalles
      FROM Ventas v
      JOIN Clientes c ON v.ClienteID = c.ClienteID
      JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
      LEFT JOIN Venta_Detalle vd ON v.VentaID = vd.VentaID
      LEFT JOIN Productos p ON vd.ProductoID = p.ProductoID
    `;

    // Filtros (Igual que antes)
    if (searchCliente && typeof searchCliente === 'string') {
      params.push(`%${searchCliente}%`);
      whereClauses.push(`c.Nombre ILIKE $${params.length}`);
    }
    if (fechaInicio && typeof fechaInicio === 'string') {
      params.push(fechaInicio);
      whereClauses.push(`v.FechaHora >= $${params.length}::date`);
    }
    if (fechaFin && typeof fechaFin === 'string') {
      params.push(fechaFin);
      whereClauses.push(`v.FechaHora < $${params.length}::date + interval '1 day'`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // IMPORTANTE: Agrupar para que json_agg funcione
    query += ' GROUP BY v.VentaID, c.Nombre, u.Nombre ORDER BY v.FechaHora DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- API PARA INGRESAR VENTA (RU02) Y PRODUCTOS ---

// GET /api/productos (Para llenar el selector de análisis)
app.get('/api/productos', async (req: Request, res: Response) => {
  try {
    // Obtenemos productos con el nombre de su categoría
    const result = await pool.query(`
      SELECT p.*, c.Nombre as CategoriaNombre 
      FROM Productos p
      LEFT JOIN Categorias c ON p.CategoriaID = c.CategoriaID
      ORDER BY p.Descripcion ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/ventas (CREAR VENTA - TRANSACCIÓN COMPLEJA)
app.post('/api/ventas', async (req: Request, res: Response) => {
  const { clienteId, usuarioId, items, total } = req.body;

  // items es un array: [{ productoId: 1, cantidad: 1, precio: 150 }, ...]

  if (!clienteId || !usuarioId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para la venta.' });
  }

  // Iniciamos un CLIENTE de conexión para la transacción (no usar 'pool' directo aquí)
  const client = await pool.connect();

  try {
    // 1. INICIAR TRANSACCIÓN
    await client.query('BEGIN');

    // 2. INSERTAR LA VENTA (CABECERA)
    const ventaRes = await client.query(
      `INSERT INTO Ventas (ClienteID, UsuarioID, Total, DescuentoAplicado)
       VALUES ($1, $2, $3, 0)
       RETURNING VentaID`,
      [clienteId, usuarioId, total]
    );
    const ventaId = ventaRes.rows[0].ventaid;

    // 3. INSERTAR LOS DETALLES (PRODUCTOS)
    for (const item of items) {
      await client.query(
        `INSERT INTO Venta_Detalle (VentaID, ProductoID, Cantidad, PrecioUnitario)
         VALUES ($1, $2, $3, $4)`,
        [ventaId, item.productoId, item.cantidad, item.precio]
      );
    }

    // 4. CONFIRMAR TRANSACCIÓN (COMMIT)
    await client.query('COMMIT');

    res.status(201).json({ message: 'Venta registrada con éxito', ventaId });

  } catch (error) {
    // 5. SI ALGO FALLA, DESHACER TODO (ROLLBACK)
    await client.query('ROLLBACK');
    console.error('Error en transacción de venta:', error);
    res.status(500).json({ error: 'Error al procesar la venta.' });
  } finally {
    // Liberar el cliente de conexión
    client.release();
  }
});

// GET /api/categorias (Para llenar el select del formulario)
app.get('/api/categorias', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM Categorias ORDER BY Nombre ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/productos (RU10 y RU14: Ver y Buscar Productos)
// (Nota: Reemplaza el anterior si ya lo tenías, este incluye búsqueda)
app.get('/api/productos', async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT p.*, c.Nombre as CategoriaNombre 
      FROM Productos p
      LEFT JOIN Categorias c ON p.CategoriaID = c.CategoriaID
    `;
    const params = [];

    if (search && typeof search === 'string') {
      query += ` WHERE p.Descripcion ILIKE $1 OR p.Codigo ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.Descripcion ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/productos (RU11: Crear Producto)
app.post('/api/productos', async (req: Request, res: Response) => {
  // CORRECCIÓN: Usamos 'categoriaid' en minúsculas para coincidir con el frontend
  const { codigo, descripcion, precio, stock, categoriaid } = req.body; 

  try {
    const result = await pool.query(
      `INSERT INTO Productos (Codigo, Descripcion, Precio, Stock, CategoriaID)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [codigo, descripcion, precio, stock || 0, categoriaid]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/productos/:id (RU12: Modificar Producto)
app.put('/api/productos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // CORRECCIÓN: Aquí también 'categoriaid' en minúsculas
  const { codigo, descripcion, precio, stock, categoriaid } = req.body;

  try {
    const result = await pool.query(
      `UPDATE Productos 
       SET Codigo=$1, Descripcion=$2, Precio=$3, Stock=$4, CategoriaID=$5
       WHERE ProductoID=$6 RETURNING *`,
      [codigo, descripcion, precio, stock, categoriaid, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/productos/:id (RU13: Eliminar Producto)
app.delete('/api/productos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Productos WHERE ProductoID = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    // Error código 23503 es Violación de Llave Foránea (si el producto ya se vendió)
    if (error === '23503') {
        return res.status(409).json({ error: 'No se puede eliminar: Este producto ya tiene ventas registradas.' });
    }
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// --- API GESTIÓN DE USUARIOS (RU17) ---

// GET /api/roles (Para llenar el select del formulario)
app.get('/api/roles', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM Roles ORDER BY RolID ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// GET /api/usuarios (Listar usuarios sin mostrar contraseñas)
app.get('/api/usuarios', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.UsuarioID, u.Nombre, u.Email, u.RolID, u.Activo, r.Nombre as RolNombre
      FROM Usuarios u
      JOIN Roles r ON u.RolID = r.RolID
      ORDER BY u.UsuarioID ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/usuarios (Crear Usuario con contraseña encriptada)
app.post('/api/usuarios', async (req: Request, res: Response) => {
  const { nombre, email, password, rolid } = req.body;

  if (!password) return res.status(400).json({ error: 'La contraseña es obligatoria.' });

  try {
    // 1. Encriptar contraseña
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // 2. Insertar
    const result = await pool.query(
      `INSERT INTO Usuarios (Nombre, Email, PasswordHash, RolID, Activo)
       VALUES ($1, $2, $3, $4, true) RETURNING UsuarioID, Nombre, Email, RolID, Activo`,
      [nombre, email, hash, rolid]
    );
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/usuarios/:id (Editar Usuario y/o cambiar contraseña)
app.put('/api/usuarios/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, email, password, rolid, activo } = req.body;

  try {
    let query = '';
    let params = [];

    if (password && password.trim() !== '') {
      // CASO 1: El usuario quiere cambiar la contraseña (se debe hashear de nuevo)
      const hash = await bcrypt.hash(password, 10);
      query = `
        UPDATE Usuarios 
        SET Nombre=$1, Email=$2, RolID=$3, Activo=$4, PasswordHash=$5
        WHERE UsuarioID=$6 RETURNING UsuarioID, Nombre, Email, RolID, Activo`;
      params = [nombre, email, rolid, activo, hash, id];
    } else {
      // CASO 2: Solo actualizar datos, mantener contraseña vieja
      query = `
        UPDATE Usuarios 
        SET Nombre=$1, Email=$2, RolID=$3, Activo=$4
        WHERE UsuarioID=$5 RETURNING UsuarioID, Nombre, Email, RolID, Activo`;
      params = [nombre, email, rolid, activo, id];
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// --- API DE MÉTRICAS Y REPORTES (RU15) ---

// GET /api/reportes/general (KPIs Globales)
app.get('/api/reportes/general', async (req: Request, res: Response) => {
  try {
    // Consultamos 3 datos en paralelo
    const ventasQ = await pool.query('SELECT COUNT(*) as cant, SUM(Total) as dinero FROM Ventas');
    const clientesQ = await pool.query('SELECT COUNT(*) as total FROM Clientes');
    
    // Construimos la respuesta
    res.json({
      totalVentas: ventasQ.rows[0].cant || 0,
      ingresosTotales: ventasQ.rows[0].dinero || 0,
      totalClientes: clientesQ.rows[0].total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en métricas generales' });
  }
});

// GET /api/reportes/top-productos (Productos Más Vendidos)
app.get('/api/reportes/top-productos', async (req: Request, res: Response) => {
  try {
    // Unimos Detalle -> Productos para ver nombres y sumamos cantidades
    const result = await pool.query(`
      SELECT p.Descripcion, SUM(vd.Cantidad) as CantidadVendida, SUM(vd.Cantidad * vd.PrecioUnitario) as IngresoGenerado
      FROM Venta_Detalle vd
      JOIN Productos p ON vd.ProductoID = p.ProductoID
      GROUP BY p.Descripcion
      ORDER BY CantidadVendida DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en top productos' });
  }
});

// GET /api/reportes/ventas-semana (Ventas de los últimos 7 días)
app.get('/api/reportes/ventas-semana', async (req: Request, res: Response) => {
  try {
    // Agrupamos por FECHA (sin hora)
    const result = await pool.query(`
      SELECT 
        TO_CHAR(FechaHora, 'YYYY-MM-DD') as Fecha, 
        COUNT(*) as CantidadVentas, 
        SUM(Total) as TotalDinero
      FROM Ventas
      WHERE FechaHora >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(FechaHora, 'YYYY-MM-DD')
      ORDER BY Fecha ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en ventas por periodo' });
  }
});

// 5. INICIAR EL SERVIDOR
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});