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
  ].sort((a, b) => b - a);

  if (pieces.some(piece => piece > pBatang)) {
    return { error: `Ada dimensi rak yang melebihi panjang 1 batang besi (${pBatang} cm). Anda butuh besi yang lebih panjang atau gabungan (tidak disarankan).` };
  }

  // 1. Establish a greedy baseline (First-Fit Decreasing)
  function greedyFFD(items: number[], cap: number) {
     const b: number[] = [];
     const p: number[][] = [];
     for(const item of items) {
        let placed = false;
        for(let j=0; j<b.length; j++) {
           if (b[j] >= item) { b[j] -= item; p[j].push(item); placed = true; break; }
        }
        if (!placed) { b.push(cap - item); p.push([item]); }
     }
     return { bins: b, patterns: p };
  }

  let bestSolution = greedyFFD(pieces, pBatang);
  let bestSolutionDiv = 1;

  // 2. Try symmetric subsets and DFS
  const counts = new Map<number, number>();
  for(const pw of pieces) counts.set(pw, (counts.get(pw) || 0) + 1);
  function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
  let g = 0;
  for(const c of counts.values()) g = gcd(g, c);

  for (let div = g; div >= 1; div--) {
      if (pieces.length % div !== 0) continue;
      
      const groupPieces: number[] = [];
      for(const [len, count] of counts.entries()) {
          for(let i=0; i<count/div; i++) groupPieces.push(len);
      }
      groupPieces.sort((a,b)=>b-a);
      
      const subsetLowerBound = Math.ceil(groupPieces.reduce((a,b)=>a+b,0) / pBatang);
      const subsetGreedy = greedyFFD(groupPieces, pBatang);
      
      let minBins = subsetGreedy.bins.length;
      let finalPatterns = subsetGreedy.patterns;
      
      // If there's room to optimize the subgroup, use bounded DFS
      if (minBins > subsetLowerBound && groupPieces.length <= 20) {
          let iters = 0;
          const currentBins: number[] = [];
          const currentPatterns: number[][] = [];
          
          function solve(index: number) {
             iters++;
             if (iters > 20000) return;
             if (currentBins.length >= minBins) return;
             if (index === groupPieces.length) {
                minBins = currentBins.length;
                finalPatterns = currentPatterns.map(pw => [...pw]);
                return;
             }
             const piece = groupPieces[index];
             for(let i=0; i<currentBins.length; i++) {
                 if (currentBins[i] >= piece) {
                     let isDup = false;
                     for(let j=0; j<i; j++) { if (currentBins[j] === currentBins[i]) { isDup = true; break; } }
                     if (isDup) continue;
                     
                     currentBins[i] -= piece;
                     currentPatterns[i].push(piece);
                     solve(index + 1);
                     currentPatterns[i].pop();
                     currentBins[i] += piece;
                 }
             }
             if (currentBins.length + 1 < minBins) {
                 currentBins.push(pBatang - piece);
                 currentPatterns.push([piece]);
                 solve(index + 1);
                 currentPatterns.pop();
                 currentBins.pop();
             }
          }
          solve(0);
      }
      
      const totalBinsIfUsed = minBins * div;
      if (totalBinsIfUsed < bestSolution.patterns.length || 
         (totalBinsIfUsed === bestSolution.patterns.length && div > bestSolutionDiv)) {
          const expandedBins: number[] = [];
          const expandedPatterns: number[][] = [];
          for(let i=0; i<div; i++) {
              finalPatterns.forEach(pw => {
                  expandedPatterns.push([...pw]);
                  expandedBins.push(pBatang - pw.reduce((a,b)=>a+b,0));
              });
          }
          bestSolution = { bins: expandedBins, patterns: expandedPatterns };
          bestSolutionDiv = div;
      }
  }

  const bins = bestSolution.patterns.map((p, i) => ({ pattern: p, remaining: bestSolution.bins[i] }));

  let totalBaut = 0;
  let totalPlat = 0;
  
  if (usePlates) {
    if (susun >= 2) {
      totalPlat = 16; // 8 top, 8 bottom
      totalBaut = (2 * 4 * 6) + ((susun - 2) * 4 * 2); // 48 + (susun-2)*8
    } else {
      totalPlat = 8;
      totalBaut = 4 * 6; // 24
    }
  } else {
    totalBaut = susun * 4 * 2; // 8 baut/susun
  }

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
