import {sourceTorusGeometry} from './source-geometry.mjs';

const MODULUS=1048576n,PALETTE=2250,DELTA_MAX=4,R0_DENOMINATOR=16384n*MODULUS;
const mod=(a,m)=>((a%m)+m)%m;
const multiply=(a,b)=>a.map((r,i)=>b[0].map((_,j)=>r.reduce((s,v,k)=>s+v*b[k][j],0n)));
function matrixPower(n){let out=[[1n,0n],[0n,1n]],a=[[3n,1n],[1n,5n]];while(n){if(n%2)out=multiply(out,a);n=Math.floor(n/2);if(n)a=multiply(a,a);}return out;}
const exactInteger=(x,name)=>{if(typeof x==='number'&&Number.isSafeInteger(x))return BigInt(x);if(typeof x==='string'&&/^-?\d+$/.test(x)&&x.length<=256)return BigInt(x);throw Object.assign(Error(name+' requires an exact integer, encoded as decimal text when large.'),{code:'INVALID_INPUT'});};
function normalizeLabel(label,i){
  if(!label||typeof label!=='object'||Array.isArray(label)||Object.keys(label).some(k=>!['id','ell','grid','sign'].includes(k)))throw Object.assign(Error('A source pulse label has id, ell, grid[3], sign only; independent slow interval fixtures are not source mesh labels.'),{code:'INVALID_INPUT'});
  if(label.id!==undefined&&(typeof label.id!=='string'||label.id.length<1||label.id.length>128))throw Object.assign(Error('A displayed source label id must be a nonempty string of at most 128 characters.'),{code:'INVALID_INPUT'});
  const ell=exactInteger(label.ell??16,'ell');if(ell<8n)throw Object.assign(Error('The constructive source palette uses ell>=8.'),{code:'INVALID_INPUT'});
  if(!Array.isArray(label.grid)||label.grid.length!==3)throw Object.assign(Error('grid is the three-dimensional source mesh index.'),{code:'INVALID_INPUT'});
  const grid=label.grid.map((v,k)=>exactInteger(v,'grid['+k+']')),sign=label.sign??1;if(sign!==1&&sign!==-1)throw Object.assign(Error('sign must be +1 or -1.'),{code:'INVALID_INPUT'});
  const color=Number((((mod(ell,9n)*5n+mod(grid[0],5n))*5n+mod(grid[1],5n))*5n+mod(grid[2],5n))*2n+(sign===1?0n:1n));
  return {id:label.id??'source-label-'+i,ell:String(ell),grid:grid.map(String),sign,color,mathematicalLabel:[String(ell),...grid.map(String),sign].join(':'),boxKey:[String(ell),...grid.map(String)].join(':'),centerExact:[`${color+1}/${MODULUS}`,'0'],center:[(color+1)/Number(MODULUS),0]};
}

/** A finite, explicit palette that works for the entire countable mesh of Lemma 6.1. */
export function uniformSupportPalette(){
  const coveringDifferenceCertificate=sourceTorusGeometry().coveringDifferenceCertificate,powers=Array.from({length:DELTA_MAX+1},(_,i)=>matrixPower(i)),maxEntry=powers.at(-1)[1][0]*BigInt(PALETTE),maxRowNorm=powers.at(-1)[1][0]+powers.at(-1)[1][1],errorNumerator=3n*(maxRowNorm+1n),checks=[];
  for(let delta=1;delta<=DELTA_MAX;delta++){
    let nearest=MODULUS;for(let nu=1;nu<=PALETTE;nu++){const residue=mod(powers[delta][1][0]*BigInt(nu),MODULUS),distance=residue<MODULUS-residue?residue:MODULUS-residue;if(distance<nearest)nearest=distance;}
    checks.push({delta,minimumVerticalIntegerDistanceNumerator:String(nearest),denominator:String(MODULUS),pass:nearest>=1n,reason:'Every center has second coordinate zero, so this separates every ordered target/source center pair, including self pairs, at this covering difference.'});
  }
  const proofs={paletteSize:PALETTE,bandPeriod:9,gridPeriod:5,signColors:2,deltaMax:DELTA_MAX,modulus:String(MODULUS),r0Exact:`1/${R0_DENOMINATOR}`,r0:1/Number(R0_DENOMINATOR),centers:'c_nu=((nu+1)/1048576,0), 0<=nu<2250',allOrderedCenterConstraints:{delta0:'Distinct center numerators differ by at least 1 modulo 1048576.',positiveDeltas:checks,largestJ21TimesNumerator:String(maxEntry),strictlyBelowModulus:maxEntry<MODULUS},enlargedRectangleSeparation:{minimumForbiddenDifference:`1/${MODULUS}`,maxCoveringRowNorm:String(maxRowNorm),eigenvectorRowBound:'|v_r[row]|+|v_t[row]|<3/2',perturbationUpper:`${errorNumerator}/${R0_DENOMINATOR}`,strictlyLessThanSeparation:errorNumerator<16384n,injective:true},allBandsCoverage:{lowerBand:'8',maximumCoveringDifferenceProof:'1+(4*(1+h)*log(2)+8/ell0)/log(4+sqrt(2))<4 for ell0>=8 and 0<h<1/100',sameBand:'Enlarged mesh boxes have half width 2*ell^-6; intersecting indices differ by at most 4 in each coordinate. Modulo 5 therefore separates distinct indices.',nearbyBands:'If 0<|ell-ellPrime|<=4, ell modulo 9 differs.',oppositeSigns:'The final binary color separates the two signs of the same slow box.',farBands:'Actual dyadic cutoffs have disjoint q supports for |ell-ellPrime|>2; the proof conservatively separates all differences through 4.'},matrixPowers:powers.map(m=>m.map(row=>row.map(String))),dependsOnEnumeratedActiveSet:false,commonToAllBandsAndLabels:true,newLeanExecution:false};
  return {schema:'MathScope.UniformSourceSupportPalette/1',...proofs,coveringDifferenceCertificate,pass:checks.every(c=>c.pass)&&maxEntry<MODULUS&&errorNumerator<16384n&&coveringDifferenceCertificate.pass};
}

export function sourceSupportAllocation(labels){
  labels=labels??[{id:'same-box-plus',ell:16,grid:[100,0,100],sign:1},{id:'same-box-minus',ell:16,grid:[100,0,100],sign:-1},{id:'neighbor',ell:16,grid:[101,0,100],sign:1},{id:'overlapping-band',ell:17,grid:[142,0,200],sign:1}];
  if(!Array.isArray(labels)||labels.length<1||labels.length>96)throw Object.assign(Error('Display 1–96 source mesh labels. The uniform certificate covers the complete countable mesh.'),{code:'INVALID_INPUT'});
  const rows=labels.map(normalizeLabel),seen=new Set(),ids=new Set();for(const row of rows){if(seen.has(row.mathematicalLabel)||ids.has(row.id))throw Object.assign(Error('A mathematical source label or displayed id is duplicated.'),{code:'INVALID_INPUT'});seen.add(row.mathematicalLabel);ids.add(row.id);}
  const palette=uniformSupportPalette(),pairChecks=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    const a=rows[i],b=rows[j],gap=BigInt(a.ell)-BigInt(b.ell),absGap=gap<0n?-gap:gap,sameBand=absGap===0n,meshOverlaps=sameBand&&a.grid.every((x,k)=>{const gap=BigInt(x)-BigInt(b.grid[k]);return gap>=-4n&&gap<=4n;}),potentialOverlap=absGap<=4n&&(!sameBand||meshOverlaps);
    pairChecks.push({left:a.id,right:b.id,bandGap:String(absGap),potentialSlowOverlap:potentialOverlap,method:sameBand?'EXACT_INTEGER_EXPANDED_MESH_TEST':'CONSERVATIVE_BAND_ENLARGEMENT',differentColors:a.color!==b.color,auxiliarySupportsDisjoint:!potentialOverlap||a.color!==b.color&&palette.pass,reason:potentialOverlap?'All-delta rational center separation and uniform r0 bound.':'Disjoint enlarged same-band mesh boxes or separated physical dyadic supports.'});
  }
  const g=sourceTorusGeometry(),vr=[1,1-Math.SQRT2],vt=[Math.SQRT2-1,1],r0=palette.r0;
  const rectangles=rows.map((row,index)=>({...row,r0Exact:palette.r0Exact,eigenvectorCoordinates:{xi:[-r0,r0],eta:[-r0,r0],enlargement:2},corners:[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([a,b])=>[row.center[0]+r0*(a*vr[0]+b*vt[0]),row.center[1]+r0*(a*vr[1]+b*vt[1]),index])}));
  return {schema:'MathScope.SourcePulseSupport/1',palette,rectangles,pairChecks,torus:g,products:{differentLabels:'Exactly zero for every pair whose physical slow supports overlap, by the uniform enlarged-support certificate.',sameLabelHarmonics:'retained',sameBoxSigns:'Separate auxiliary rectangles; slow squared partition counts this box once.'},distinctSlowBoxes:new Set(rows.map(x=>x.boxKey)).size,displayedLabels:rows.length,allActivePairsCoveredByUniformProof:true,activeMembershipEnumerated:false,proofCoversAllActiveLabelsBecause:'The actual active set is a subset of the full source mesh; the palette works on that complete countable superset.'};
}
