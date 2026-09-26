// FR-06 / D5: responde sin tocar la base, para que un monitor no despierte la base serverless.
import { json } from '../lib/http.js';

export function GET() {
  return json({ estado: 'ok', servicio: 'municipios-serverless', hora: new Date().toISOString() });
}
