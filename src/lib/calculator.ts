export interface BahanResult {
  error?: string;
  sticksNeeded?: number;
  bins?: { pattern: number[]; remaining: number }[];
  totalBaut?: number;
  totalPlat?: number;
  cost?: number;
  loadCapacity?: number;
  totalSisa?: number;
}

export function calculateMaterial(
  p: number,
  l: number,
  t: number,
  susun: number,
  pBatang: number,
  ketebalan: number = 1.5,
  hargaBatang: number = 0,
  hargaBaut: number = 0,
  hargaPlat: number = 0,
  usePlates: boolean = true
): BahanResult {
  // We need 4 vertical poles, 2 * susun long horizontal beams, 2 * susun short horizontal beams
  const pieces = [
    ...Array(4).fill(t),
    ...Array(2 * susun).fill(p),
    ...Array(2 * susun).fill(l),
  ].sort((a, b) => b - a); // sort descending for First-Fit Decreasing algorithm

  const bins: { pattern: number[]; remaining: number }[] = [];

  for (const piece of pieces) {
    if (piece > pBatang) {
      return { error: `Ada dimensi rak (${piece} cm) yang melebihi panjang 1 batang besi (${pBatang} cm). Anda butuh besi yang lebih panjang atau gabungan (tidak disarankan).` };
    }
    let placed = false;
    for (const bin of bins) {
      if (bin.remaining >= piece) {
        bin.remaining -= piece;
        bin.pattern.push(piece);
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push({ pattern: [piece], remaining: pBatang - piece });
    }
  }

  const totalBaut = susun * 16;
  const totalPlat = usePlates ? 16 : 0; // 8 for top tier, 8 for bottom tier (2 plates per corner)
  const cost = (bins.length * hargaBatang) + (totalBaut * hargaBaut) + (totalPlat * hargaPlat);
  const span = Math.max(p, l, 50); 
  const loadCapacity = Math.floor((ketebalan * 60) * Math.min(1.5, Math.max(0.4, 100 / span)));
  const totalSisa = bins.reduce((sum, bin) => sum + bin.remaining, 0);

  return {
    sticksNeeded: bins.length,
    bins,
    totalBaut,
    totalPlat,
    cost,
    loadCapacity,
    totalSisa,
  };
}

export interface DimensiResult {
  error?: string;
  p?: number;
  l?: number;
  t?: number;
  cost?: number;
  loadCapacity?: number;
  totalBaut?: number;
  totalPlat?: number;
  totalSisa?: number;
  bins?: { pattern: number[]; remaining: number }[];
  sticksNeeded?: number;
}

export function solveDimensions(
  jBatang: number,
  pBatang: number,
  p: number | null,
  l: number | null,
  t: number | null,
  susun: number,
  ketebalan: number = 1.5,
  hargaBatang: number = 0,
  hargaBaut: number = 0,
  hargaPlat: number = 0,
  usePlates: boolean = true
): DimensiResult {
  const missing = [p, l, t].filter((v) => v === null || v <= 0).length;

  if (missing === 0) return { error: 'Kosongkan minimal salah satu dimensi untuk dihitung (jadikan 0 atau kosong).' };
  if (missing === 3) return { error: 'Masukkan minimal salah satu dimensi (Panjang, Lebar, atau Tinggi).' };

  // Use Linear Search downwards from pBatang to 1 to find the absolute maximum dimension
  // We don't use Binary Search because First-Fit Decreasing bin packing is non-monotonic!
  // E.g., a larger dimension might magically fit better due to order of packing.
  let bestP = 0, bestL = 0, bestT = 0;
  let bestResult: BahanResult | null = null;

  for (let mid = pBatang; mid >= 1; mid--) {
    let testP = p || 0;
    let testL = l || 0;
    let testT = t || 0;

    if (missing === 1) {
      if (!p || p <= 0) testP = mid;
      if (!l || l <= 0) testL = mid;
      if (!t || t <= 0) testT = mid;
    } else if (missing === 2) {
      if ((!p || p <= 0) && (!l || l <= 0)) {
        testP = mid;
        testL = mid;
      } else if ((!l || l <= 0) && (!t || t <= 0)) {
        testL = mid;
        testT = Math.min(mid * 3, pBatang);
      } else if ((!p || p <= 0) && (!t || t <= 0)) {
        testP = mid;
        testT = Math.min(mid * 2, pBatang);
      }
    }

    if (testP > pBatang || testL > pBatang || testT > pBatang) {
      continue;
    }

    const res = calculateMaterial(testP, testL, testT, susun, pBatang, ketebalan, hargaBatang, hargaBaut, hargaPlat, usePlates);
    if (!res.error && res.sticksNeeded! <= jBatang) {
      bestP = testP;
      bestL = testL;
      bestT = testT;
      bestResult = res;
      break; // Since we iterate downwards, the first one that fits is the maximum possible!
    }
  }

  if (bestP === 0 || bestL === 0 || bestT === 0 || !bestResult) {
    return { error: 'Bahan tidak cukup untuk membangun rak dengan spesifikasi tersebut.' };
  }

  return {
    p: bestP,
    l: bestL,
    t: bestT,
    totalBaut: bestResult.totalBaut,
    totalPlat: bestResult.totalPlat,
    cost: bestResult.cost,
    loadCapacity: bestResult.loadCapacity,
    bins: bestResult.bins,
    totalSisa: bestResult.totalSisa,
    sticksNeeded: bestResult.sticksNeeded,
  };
}
