import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Tu URL directa de Google Sheets CSV
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRVnI_RqxCSt1wAfQthb5aG1m1NVIbiyjF6rovbmM0hUk2ZoNrLSWkDIlTsRTn2B3PbUXv_NFq8l3q/pub?gid=898899239&single=true&output=csv";

  try {
    const response = await fetch(CSV_URL);
    const text = await response.text();

    // Dividir filas y columnas
    const rows = text.split('\n').map(row => row.split(','));
    
    const preciosServicios: Record<string, number> = {};
    
    // Recorrer filas desde la 1 para omitir la cabecera (ID_Servicio, Tipo_Proceso, Descripción, Precio_Unidad_AR$)
    for (let i = 1; i < rows.length; i++) {
      const idServicio = rows[i][0]?.trim(); // Columna A (S01, S02, etc.)
      const rawPrecio = rows[i][3]?.trim();   // Columna D (Precio)
      
      const precio = parseFloat(rawPrecio);

      if (idServicio && !isNaN(precio)) {
        preciosServicios[idServicio] = precio;
      }
    }

    return new Response(JSON.stringify(preciosServicios), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate' // Cachea por 5 min
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener los precios' }), { status: 500 });
  }
};