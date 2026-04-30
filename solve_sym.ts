function packSymmetric(piecesArray: number[], pBatang: number): { pattern: number[], remaining: number }[] {
   // Create count map
   const counts = new Map<number, number>();
   for(const p of piecesArray) counts.set(p, (counts.get(p) || 0) + 1);
   
   // Find GCD of all counts
   function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
   let g = 0;
   for(const c of counts.values()) {
       g = gcd(g, c);
   }
   
   // If g > 1, we can try to pack 1 group and multiply
   // Actually, we can try all divisors of g, starting from largest to smallest (1).
   function findDivisors(n: number) {
       const divs = [];
       for(let i=1; i<=n; i++) if (n%i===0) divs.push(i);
       return divs.sort((a,b) => b-a);
   }
   
   const divisors = findDivisors(g);
   
   for(const div of divisors) {
       const groupPieces: number[] = [];
       for(const [len, count] of counts.entries()) {
           for(let i=0; i<count/div; i++) groupPieces.push(len);
       }
       
       // Try DFS or Greedy on this subgroup
       groupPieces.sort((a,b)=>b-a);
       
       // DFS solver for the subgroup
       let minBins = groupPieces.length + 1;
       let bestPatterns: number[][] = [];
       let iters = 0;
       
       // bounds
       const totalLength = groupPieces.reduce((a,b)=>a+b, 0);
       const lowerBound = Math.ceil(totalLength / pBatang);
       
       const currentBins: number[] = [];
       const currentPatterns: number[][] = [];
       
       function solve(index: number) {
           iters++;
           if (iters > 10000) return; 
           if (currentBins.length >= minBins) return;
           if (index === groupPieces.length) {
               minBins = currentBins.length;
               bestPatterns = currentPatterns.map(p => [...p]);
               return;
           }
           const piece = groupPieces[index];
           
           for(let i=0; i<currentBins.length; i++) {
               if (currentBins[i] >= piece) {
                   let isDup = false;
                   for(let j=0; j<i; j++) {
                       if (currentBins[j] === currentBins[i]) { isDup = true; break; }
                   }
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
       
       if (bestPatterns.length > 0) {
           // We found a packing for the subgroup!
           // Does it hit the lower bound OR did it finish searching perfectly?
           // Actually, whatever it finds, we multiply by `div`.
           // But wait, what if `div`=4 gives a 2-bin solution (total 8 bins), but `div`=1 gives a 7-bin solution?
           // Usually larger `div` (more symmetric) is preferred by the user even if it might sacrifice 1 bin?
           // Actually, the user wants symmetric AND minimal waste.
           // Let's just return the best we find.
           
           const overallBins = minBins * div;
           
           // Return if it's the first one we tried (we test divisors from largest to smallest)
           // But what if a smaller divisor gives FEWER total bins?
           // We should calculate greedy for div=1 first to establish an Absolute Upper Bound!
       }
   }
   
   return [];
}
console.log("ok");
