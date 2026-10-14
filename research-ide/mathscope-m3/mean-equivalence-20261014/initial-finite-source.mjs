import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {savedInitializedSourceProgram} from '../navier/source-saved-initialized-authority.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const IDS=['angular-moment-0','angular-moment-1','angular-moment-2','axial-zero-weighted-moment','axial-target-moment'];
/** Export actual arithmetic operands through a genuine privately sealed source.
 * Python independently checks them; none of the stored pass flags is exported.
 */
export async function exportInitialFiniteWitness(cap,out){
  const p=savedInitializedSourceProgram(cap),mean=p.mean;
  const rows=IDS.map(id=>{const row=mean.checks.find(x=>x.id===id);if(!row||!Number.isSafeInteger(row.expression))throw new Error('Actual five-row source is missing');return {id,expression:row.expression};});
  const required=[...rows.map(x=>x.expression),...mean.bumps.coefficients.angularMatrix.flat(),...mean.bumps.coefficients.axialMatrix.flat(),...mean.bumps.coefficients.angular,...mean.bumps.coefficients.axial];
  const seen=new Set(),pending=[...required],nodes=[];
  while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);const node=p.node(id);nodes.push([id,node]);
    if(node.op==='add'||node.op==='multiply')pending.push(...node.args);
    else if(node.op==='inverse'||node.op==='integer_power')pending.push(node.args[0]);
    // An analytic leaf remains its exact original source ID and body. The
    // arithmetic certificate does not prove its existence or denominators.
  }
  nodes.sort((a,b)=>a[0]-b[0]);
  const result={schema:'MathScope.N6.ActualFiveRowArithmeticWitness/1',source:cap.source,rows,nodes,nodeRowsSHA256:hash(nodes),arithmeticClosureOnly:true,storedPassFlagsConsumed:false,actualInputDefects:mean.bumps.actualInputDefects,latestVelocity:mean.stages.moments.velocity,latestPressure:mean.stages.moments.pressure,actualClassBoundsProved:false,originalN601Complete:false};
  await writeFile(resolve(out,'initial-finite-witness.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
}
