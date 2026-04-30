import { calculateMaterial } from './src/lib/calculator';

console.log("P=86:", calculateMaterial(86, 40, 100, 4, 300).sticksNeeded);
console.log("P=86.0044:", calculateMaterial(86.0044, 40, 100, 4, 300).sticksNeeded);
