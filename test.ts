import { calculateMaterial, solveDimensions } from './src/lib/calculator';

const pBatang = 300;
const susun = 4;
// Example: L and T are fixed, P is what we need to find.
const result = solveDimensions(4, 300, null, 40, 100, susun);
console.log("solveDimensions:", result.p, result.l, result.t, "sticks", result.sticksNeeded);

const c1 = calculateMaterial(result.p, result.l, result.t, susun, pBatang);
console.log("calculateMaterial direct:", c1.sticksNeeded);

// Simulated unit inch
const unitFactor = 2.54;
const simP = Number((result.p / unitFactor).toFixed(2)) * unitFactor;
const simL = Number((result.l / unitFactor).toFixed(2)) * unitFactor;
const simT = Number((result.t / unitFactor).toFixed(2)) * unitFactor;

const c2 = calculateMaterial(simP, simL, simT, susun, pBatang);
console.log("calculateMaterial rounded:", c2.sticksNeeded);

