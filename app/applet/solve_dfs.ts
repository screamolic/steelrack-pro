function packDFS(pieces: number[], pBatang: number): { pattern: number[], remaining: number }[] {
  pieces.sort((a, b) => b - a);
  let bestBins: number[][] = [];
  let minBins = pieces.length + 1;
  
  const currentBins: number[] = [];
  const currentPatterns: number[][] = [];
  
  function solve(index: number) {
     if (currentBins.length >= minBins) return;
     if (index === pieces.length) {
        minBins = currentBins.length;
        bestBins = currentPatterns.map(p => [...p]);
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
     
     currentBins.push(pBatang - piece);
     currentPatterns.push([piece]);
     solve(index + 1);
     currentPatterns.pop();
     currentBins.pop();
  }
  
  solve(0);
  
  return bestBins.map(b => {
     const sum = b.reduce((s, x) => s + x, 0);
     return { pattern: b, remaining: pBatang - sum };
  });
}

console.log(packDFS([...Array(4).fill(100), ...Array(8).fill(60), ...Array(8).fill(40)], 300).length);
