import { calculateMaterial } from './src/lib/calculator';

// 4 ts, 8 ps, 8 ls -> 4 susun
const pBatang = 300;
const susun = 4;
// T=100, P=60, L=40
console.log(calculateMaterial(60, 40, 100, susun, pBatang).sticksNeeded);
