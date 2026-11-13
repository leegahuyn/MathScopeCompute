// Exercise the live-export typed grammar on the previous real 168 C7 rows.
// This is not a live C6/C7 comparison or a private-seal check.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {exportActualTargetC6Dag} from './export_target_c6_dag.mjs';
const [jsonPath,graphPath,out]=process.argv.slice(2);assert.ok(jsonPath&&graphPath&&out);
const jb=await readFile(jsonPath);assert.equal(createHash('sha256').update(jb).digest('hex'),'3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770');
const meta=JSON.parse(jb),rl=createInterface({input:createReadStream(graphPath).pipe(createGunzip()),crlfDelay:Infinity});let header=null;const nodes=[],hash=createHash('sha256');
for await(const line of rl){hash.update(line+'\n');const item=JSON.parse(line);if(!header)header=item;else nodes.push(item);}
assert.equal(hash.digest('hex'),meta.graph.uncompressedSHA256);assert.equal(nodes.length,header.nodeCount);
const definitions=header.definitions,G={nodes,expressionSystems:JSON.parse(definitions.expression),picardSystems:JSON.parse(definitions.picard),quadraticSystems:JSON.parse(definitions.quadratic),monotoneSystems:JSON.parse(definitions.monotone),captureFunctionDefinitions:()=>({fixed:definitions.fixed})};
const rows=[];for(const [kind,reg] of Object.entries(meta.regions))for(const row of reg.rows){const [r,e]=row.orders;if(r+e>6)continue;
 rows.push({kind,component:row.component,radialOrder:r,etaOrder:e,coordinates:reg.coordinates,lower:reg.lower,upper:reg.upper,
  body:row.native,actualCoefficientBody:reg.bodies[row.component],actualDerivative:row.native,bound:row.root,
  faces:row.faces.map((f,i)=>({mask:i,derivative:row.native,selectedCoordinates:[],upperBound:f}))});}
const target={G,family:{},request:{derivativeOrder:6},sourceBinding:{parameterExpressionSHA256:meta.sourceParameterSHA256},ftcRows:rows};
const r=await exportActualTargetC6Dag(target,{outputPath:out,maxVisited:1000000});console.log(JSON.stringify({status:'C7_GRAMMAR_ONLY_PASS',...r}));
