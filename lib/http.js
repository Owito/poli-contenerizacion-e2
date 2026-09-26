// Respuestas JSON y manejo de errores comunes a todas las funciones.

export class ErrorEntrada extends Error {}

export function json(datos, estado = 200, cache = 'no-store') {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // s-maxage deja que la CDN responda sin invocar la función ni tocar la base.
      'cache-control': cache,
    },
  });
}

// Envuelve un handler: 400 para entradas inválidas (NFR-04), 503 si la base falla.
export function manejar(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ErrorEntrada) return json({ error: error.message }, 400);
      console.error(error);
      return json({ error: 'La base de datos no está disponible en este momento.' }, 503);
    }
  };
}
