// Emula en local lo que hace la plataforma serverless: sirve public/ como archivos estáticos
// y ejecuta api/<nombre>.js por cada petición a /api/<nombre>. Solo para desarrollo.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUERTO = Number(process.env.PORT ?? 3005);
const PUBLICO = fileURLToPath(new URL('../public/', import.meta.url));
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function responder(res, respuesta) {
  res.writeHead(respuesta.status, Object.fromEntries(respuesta.headers));
  res.end(Buffer.from(await respuesta.arrayBuffer()));
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const funcion = url.pathname.match(/^\/api\/([a-z-]+)\/?$/);
    if (funcion) {
      const modulo = await import(`../api/${funcion[1]}.js`).catch(() => null);
      const handler = modulo?.[req.method];
      if (!handler) return responder(res, new Response('No encontrado', { status: 404 }));
      return responder(res, await handler(new Request(url, { method: req.method })));
    }
    const ruta = normalize(join(PUBLICO, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!ruta.startsWith(PUBLICO)) return responder(res, new Response('Prohibido', { status: 403 }));
    const cuerpo = await readFile(ruta);
    res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
    res.end(cuerpo);
  } catch {
    responder(res, new Response('No encontrado', { status: 404 }));
  }
}).listen(PUERTO, () => console.log(`Servidor local en http://localhost:${PUERTO}`));
