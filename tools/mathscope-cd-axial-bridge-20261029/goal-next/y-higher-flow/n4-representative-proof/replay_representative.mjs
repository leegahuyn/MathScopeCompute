/** Re-run the pinned original pure geometry, using ORIGINAL arithmetic methods.
 * The object is only a sparse arithmetic view, not a sealed source authority.
 * No inverse, real root, series or integral is evaluated numerically.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [slicePath,runtime,output]=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(slicePath),slice=JSON.parse(raw);
if(slice.schema!=='MathScope.OriginalRepresentativeExactSlice/1')throw Error('slice');
const pins={
  'mathscope-m3/navier/source-global-representative.mjs':'f3fbcf74b42c59cbfdd563e0fddcba9fab5cad782a96695930e3445c50373541',
  'mathscope-m3/navier/source-global-expressions.mjs':'89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1',
  'mathscope-m2/navier/actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
  'mathscope-m2/navier/actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'mathscope-m2/navier/actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501'
};
for(const [f,pin]of Object.entries(pins))if(sha(fs.readFileSync(path.join(runtime,f)))!==pin)throw Error('module pin '+f);
const {GlobalSourceExpressions}=await import(pathToFileURL(path.join(runtime,'mathscope-m3/navier/source-global-expressions.mjs')));
const {originalRepresentativeBoxReduction,finishOriginalBoxRepresentative}=await import(pathToFileURL(path.join(runtime,'mathscope-m3/navier/source-global-representative.mjs')));
const G=Object.create(GlobalSourceExpressions.prototype);
G.nodes=[];G.lookup=new Map();G.zero=0;G.one=1;
for(const [id,node]of slice.nodes){G.nodes[id]=node;G.lookup.set(JSON.stringify([node.op,node.args]),id);}
// Unused metadata arithmetic receives scratch IDs beyond the 7,358,162
// original nodes, so these can never be mistaken for an original node ID.
G.nodes.length=8000000;
G.substitutions=new Map();
const originalLength=G.nodes.length;
const reduction=originalRepresentativeBoxReduction(G,{
  radiusBox:slice.boxes[0],axialBox:slice.boxes[1],timeBox:slice.boxes[2],...slice.constants
});
const roots=finishOriginalBoxRepresentative(G,reduction,slice.inverse);
for(const [key,id]of Object.entries(slice.expectedRoots))
  if(roots[key]!==id)throw Error('root mismatch '+key+': '+roots[key]+' != '+id);
const inverse=G.nodes[slice.inverse];
if(JSON.stringify(inverse)!==JSON.stringify({op:'actual_monotone_root',args:[2,reduction.Z,reduction.T]}))throw Error('original inverse operands');
const def=slice.inverseDefinition,[formalZ,formalT]=def.parameters;
const formalEquation=G.sub(G.sub(def.variable,G.mul(G.pow(formalZ,2),G.exp(G.mul(G.mul(G.q(2),slice.constants.h),G.log(def.variable))))),formalT);
if(formalEquation!==def.body||def.left!==19||def.right!==24)throw Error('native original chart equation');
const sign=G.nodes[reduction.Z];
if(sign.op!=='smooth_piecewise'||JSON.stringify(sign.args.slice(0,3))!==JSON.stringify([reduction.negativeWidth,0,0]))throw Error('sign branch');
if(sign.args[3]!==sign.args[4]||sign.args[3]===sign.args[5])throw Error('sign midpoints');
const actualTieResult=G.substitute(reduction.Z,reduction.negativeWidth,G.zero);
if(actualTieResult!==sign.args[3])throw Error('actual native tie substitution');
// The only arithmetic emission absent from REACHED may be positiveWidth,
// because the original live roots never depend on that unused metadata.
const newIds=Array.from({length:G.nodes.length-originalLength},(_,i)=>originalLength+i);
const unusedClosure=new Set(),stack=[reduction.positiveWidth];
while(stack.length){const id=stack.pop();if(unusedClosure.has(id)||id<originalLength)continue;unusedClosure.add(id);stack.push(...G.nodes[id].args);}
if(newIds.some(i=>!unusedClosure.has(i)))throw Error('unmatched live source arithmetic');
const result={schema:'MathScope.OriginalSelectedRepresentativePureKernelReplay/1',
  status:'PASS_EXACT_ORIGINAL_SELECTED_CONSTRUCTION',sliceSHA256:sha(raw),sourcePins:pins,
  inputBoxes:slice.boxes,sourceConstants:slice.constants,exactOriginalRoots:roots,
  reduction,originalInverse:inverse,signChoice:sign,
  nativeDefinition:def,nativeEquation:'s - Z^2*exp(2*h*log(s)) - T = 0 on [1/2,2]',
  tie:'At negativeWidth=0, the original <= left branch chooses the positive midpoint.',
  actualNativeTieSubstitutionResult:actualTieResult,
  sourceArithmeticWithoutNativeEvaluation:true,sliceNodeCount:slice.nodes.length,
  unusedMetadataEmissions:newIds.map(id=>({id,node:G.nodes[id]})),
  selectedTimeAndRadiusMidpointsExactlyOriginal:true,
  activeBoxTheoremLeanStatus:'Not claimed compiled by this source replay',release:'HOLD'};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,sliceNodes:slice.nodes.length,roots:slice.expectedRoots,unusedMetadataEmissions:newIds.length}));
