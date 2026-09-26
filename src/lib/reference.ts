/**
 * Format reference numbers following the Odoo / Excalidraw structure:
 * <Warehouse>/<Operation>/<ID>
 * e.g. WH/IN/0001 or WH/OUT/0001
 */
export function formatReference(
  warehouseNameOrCode: string | null | undefined,
  type: 'IN' | 'OUT',
  sequenceNumber: number
): string {
  // Extract a 2-3 letter code or default to WH
  let code = 'WH';
  if (warehouseNameOrCode) {
    const cleaned = warehouseNameOrCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length >= 2) {
      code = cleaned.slice(0, 3);
    }
  }
  
  const paddedId = String(sequenceNumber).padStart(4, '0');
  return `${code}/${type}/${paddedId}`;
}

export function parseReference(reference: string) {
  const parts = reference.split('/');
  if (parts.length === 3) {
    return {
      warehouseCode: parts[0],
      type: parts[1] as 'IN' | 'OUT',
      id: parts[2],
    };
  }
  return null;
}
