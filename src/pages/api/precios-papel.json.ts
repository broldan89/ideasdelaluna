import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {

  // URL de tu Google Sheets publicado como CSV para la solapa Precios_Base_Papel (gid=0)
  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRVnI_RqxCSt1wAfQthb5aG1m1NVIbiyjF6rovbmM0hUk2ZoNrLSWkDIlTsRTn2B3PbUXv_NFq8l3q/pub?gid=0&single=true&output=csv";

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Error en la respuesta de Google Sheets: ${response.statusText}`);
    }

    const text = await response.text();

    // Parser manual de CSV que respeta celdas con comillas y comas internas
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (inQuotes) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          row.push(field);
          field = "";
        } else if (char === "\n" || char === "\r") {
          if (char === "\r" && text[i + 1] === "\n") i++;
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else {
          field += char;
        }
      }
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    const preciosPapeles: Record<string, number> = {};

    // Recorrer filas omitiendo la cabecera (Columna A: ID_Papel, Columna E: Costo_Hoja_AR$)
    for (let i = 1; i < rows.length; i++) {
      const idPapel = rows[i][0]?.trim(); // Columna A (P01, P02, P03, etc.)
      const rawPrecio = rows[i][4]?.trim(); // Columna E (Costo_Hoja_AR$)

      if (idPapel && rawPrecio) {
        // Limpia posibles símbolos de moneda, espacios o comas decimales
        const precioLimpio = rawPrecio.replace("$", "").replace(/\./g, "").replace(",", ".");
        const precio = parseFloat(precioLimpio);

        if (!isNaN(precio)) {
          preciosPapeles[idPapel] = precio;
        }
      }
    }

    // Respuesta JSON sin caché para asegurar datos en tiempo real
    return new Response(JSON.stringify(preciosPapeles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("Error al obtener los precios de papeles desde Google Sheets:", error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener los precios de papeles' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};