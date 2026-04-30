import { calculateMaterial } from './src/lib/calculator';

const simP1 = 53.0000;
const simP2 = 53.0098;

console.log("P1", calculateMaterial(simP1, 40, 100, 4, 300).sticksNeeded);
console.log("P2", calculateMaterial(simP2, 40, 100, 4, 300).sticksNeeded);
