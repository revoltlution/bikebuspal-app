import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

export function getRouteFromGPX(filename: string) {
  const filePath = path.join(process.cwd(), 'src/gpx-files', filename);
  const xmlData = fs.readFileSync(filePath, 'utf8');
  
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonObj = parser.parse(xmlData);
  
  // Navigate the GPX structure: trk -> trkseg -> trkpt
  const points = jsonObj.gpx.trk.trkseg.trkpt;
  
  const coords = points.map((pt: any) => [
    parseFloat(pt['@_lat']),
    parseFloat(pt['@_lon'])
  ]);

  // Simplify: take every 5th point to keep the payload small
  return coords.filter((_: any, i: number) => i % 5 === 0);
}