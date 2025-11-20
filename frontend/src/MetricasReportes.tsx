import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

interface Kpis {
  totalventas: number; // Postgres devuelve minúsculas
  ingresostotales: number;
  totalclientes: number;
}

interface TopProducto {
  descripcion: string;
  cantidadvendida: number;
  ingresogenerado: number;
}

interface VentaDiaria {
  fecha: string;
  cantidadventas: number;
  totaldinero: number;
}

export function MetricasReportes() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [ventasSemana, setVentasSemana] = useState<VentaDiaria[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      try {
        // Hacemos las 3 peticiones en paralelo
        const [resKpi, resTop, resSemana] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/reportes/general`),
          axios.get(`${API_BASE_URL}/api/reportes/top-productos`),
          axios.get(`${API_BASE_URL}/api/reportes/ventas-semana`)
        ]);

        setKpis(resKpi.data);
        setTopProductos(resTop.data);
        setVentasSemana(resSemana.data);
      } catch (error) {
        console.error('Error cargando métricas', error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Formateador de moneda
  const money = (val: number) => `$${Number(val).toFixed(2)}`;

  if (isLoading) return <p>Calculando estadísticas...</p>;

  return (
    <div>
      <h2>Métricas y Reportes (RU15)</h2>

      {/* 1. TARJETAS DE KPIS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center', background: '#e3f2fd' }}>
          <h3>Ingresos Totales</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0' }}>
            {kpis ? money(kpis.ingresostotales) : '$0.00'}
          </p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', background: '#e8f5e9' }}>
          <h3>Ventas Realizadas</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0' }}>
            {kpis?.totalventas || 0}
          </p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', background: '#fff3e0' }}>
          <h3>Pacientes Registrados</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0' }}>
            {kpis?.totalclientes || 0}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* 2. TABLA DE TOP PRODUCTOS */}
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <h3>🏆 Productos Más Vendidos</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{textAlign: 'left'}}>Análisis</th>
                <th>Cant.</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.length === 0 ? (
                <tr><td colSpan={3}>Sin datos aún.</td></tr>
              ) : (
                topProductos.map((prod, idx) => (
                  <tr key={idx}>
                    <td>{prod.descripcion}</td>
                    <td style={{textAlign: 'center'}}>
                      <strong>{prod.cantidadvendida}</strong>
                    </td>
                    <td style={{textAlign: 'right'}}>{money(prod.ingresogenerado)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. TABLA DE VENTAS SEMANALES (Simulando gráfico) */}
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <h3>📅 Ventas Últimos 7 Días</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{textAlign: 'left'}}>Fecha</th>
                <th>Ventas</th>
                <th style={{textAlign: 'right'}}>Total</th>
              </tr>
            </thead>
            <tbody>
               {ventasSemana.length === 0 ? (
                <tr><td colSpan={3}>No hubo ventas esta semana.</td></tr>
              ) : (
                ventasSemana.map((dia, idx) => (
                  <tr key={idx}>
                    <td>{dia.fecha}</td>
                    <td style={{textAlign: 'center'}}>
                       {/* Pequeña barra visual hecha con caracteres */}
                       {dia.cantidadventas}
                    </td>
                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>
                      {money(dia.totaldinero)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}