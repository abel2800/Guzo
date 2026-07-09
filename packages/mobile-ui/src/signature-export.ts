type Stroke = Array<{ x: number; y: number }>;

export type SignatureUpload = {
  uri: string;
  name: string;
  type: string;
};

export function strokesToSignatureUpload(
  strokes: Stroke[],
  width = 400,
  height = 140,
): SignatureUpload | undefined {
  const lines = strokes.filter((s) => s.length > 1);
  if (lines.length === 0) return undefined;

  const polylines = lines
    .map((stroke) => {
      const points = stroke.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      return `<polyline points="${points}" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/>${polylines}</svg>`;
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = globalThis.btoa(binary);

  return {
    uri: `data:image/svg+xml;base64,${base64}`,
    name: 'signature.svg',
    type: 'image/svg+xml',
  };
}
