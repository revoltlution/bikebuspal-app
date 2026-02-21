export const parseGPX = async (file: File): Promise<[number, number][]> => {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const points = Array.from(xml.getElementsByTagName("trkpt"));

  const coordinates = points.map((pt) => {
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    return [lat, lon] as [number, number];
  });

  // Basic simplification: only take every 5th point to keep the map snappy
  return coordinates.filter((_, index) => index % 5 === 0);
};