import { calculateMaterial } from './src/lib/calculator';

const result = calculateMaterial(60, 40, 100, 4, 300);
console.log("Sticks", result.sticksNeeded);
console.log(result.bins);
