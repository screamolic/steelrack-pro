import { calculateMaterial, solveDimensions } from './src/lib/calculator';

const result = solveDimensions(5, 300, null, 40, 100, 4);
console.log("solveDimensions outputs:", result.p, result.l, result.t, "sticks", result.sticksNeeded);

for(let i=56; i>=50; i--) {
   const c = calculateMaterial(i, 40, 100, 4, 300);
   console.log("calculateMaterial P="+i, ":", c.sticksNeeded, "sticks", c.error ? "error" : "");
}
