import { buildFormalClaims } from '../formal-claims.mjs';
import { verifyCoreKernelReplay } from '../kernel-evidence.mjs';

const kernel = await verifyCoreKernelReplay();
console.log(JSON.stringify({
  status: kernel.status,
  claims: kernel.verified ? buildFormalClaims(kernel) : [],
}));
