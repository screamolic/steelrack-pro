function packDFS(pieces: number[], pBatang: number): { pattern: number[], remaining: number }[] {
  pieces.sort((a, b) => b - a);
  let bestBins: number[][] = [];
  
  // Start linear search from mathematical lower bound to upper bound (greedy)
  const totalLength = pieces.reduce((a, b) => a + b, 0);
  const lowerBound = Math.ceil(totalLength / pBatang);
  
  function greedyFFD(items: number[], capacity: number) {
     const bins: number[] = [];
     for(const item of items) {
        let placed = false;
        for(let j=0; j<bins.length; j++) {
           if (bins[j] >= item) { bins[j] -= item; placed = true; break; }
        }
        if (!placed) bins.push(capacity - item);
     }
     return bins.length;
  }
  
  const upperBound = greedyFFD(pieces, pBatang);
  if (lowerBound === upperBound) {
     // Greedy is already optimal
     // We just do greedy to return the pattern
     const bins: number[] = [];
     const patterns: number[][] = [];
     for(const item of pieces) {
        let placed = false;
        for(let j=0; j<bins.length; j++) {
           if (bins[j] >= item) {
               bins[j] -= item; 
               patterns[j].push(item);
               placed = true; 
               break; 
           }
        }
        if (!placed) {
           bins.push(pBatang - item);
           patterns.push([item]);
        }
     }
     return patterns.map((p, i) => ({ pattern: p, remaining: bins[i] }));
  }

  let minBins = upperBound;
  let finalPatterns: number[][] = [];
  
  const currentBins: number[] = [];
  const currentPatterns: number[][] = [];
  
  // To avoid huge computations, set a max iteration limit
  let iters = 0;
  function solve(index: number) {
     iters++;
     if (iters > 50000) return; // fail safe
     if (currentBins.length >= minBins) return;
     if (index === pieces.length) {
        minBins = currentBins.length;
        finalPatterns = currentPatterns.map(p => [...p]);
        return;
     }
     const piece = pieces[index];
     
     for(let i=0; i<currentBins.length; i++) {
        if (currentBins[i] >= piece) {
           let isDuplicate = false;
           for(let j=0; j<i; j++) {
              if (currentBins[j] === currentBins[i]) {
                 isDuplicate = true; break;
              }
           }
           if (isDuplicate) continue;
           
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
  
  if (finalPatterns.length === 0) {
      // fallback to greedy
      const bins: number[] = [];
      const patterns: number[][] = [];
      for(const item of pieces) {
         let placed = false;
         for(let j=0; j<bins.length; j++) {
            if (bins[j] >= item) { bins[j] -= item; patterns[j].push(item); placed = true; break; }
         }
         if (!placed) { bins.push(pBatang - item); patterns.push([item]); }
      }
      return patterns.map((p, i) => ({ pattern: p, remaining: bins[i] }));
  }
  
  return finalPatterns.map(b => {
     const sum = b.reduce((s, x) => s + x, 0);
     return { pattern: b, remaining: pBatang - sum };
  });
}

console.log("Optimal Pattern:", packDFS([...Array(4).fill(100), ...Array(8).fill(60), ...Array(8).fill(40)], 300));
