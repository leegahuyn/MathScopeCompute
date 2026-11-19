import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [goal,work,tracePath,output] = process.argv.slice(2);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = (path,pin) => {
 const bytes=readFileSync(path);if(pin) assert.equal(sha(bytes),pin,path);
 return [JSON.parse(bytes),sha(bytes)];
};
const [packet,packetSHA] = read(tracePath);
const [history,historySHA] = read(resolve(work,'whole-k-prefix/historical-scale-arithmetic-input.json'),
 '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const [norm, normSHA] = read(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const [local,localSHA] = read(resolve(goal,'final67/local-background-c8/c8-slab.json'),
 'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b');
const {sourceArithmetic} = await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator} =
 await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),norm.sourcePins,'coarse-upper');
const [leading,leadingSHA] = read(resolve(goal,'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'),
 '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966');
assert.deepEqual(Object.keys(leading.leadingOrdinaryC10),['F0','U0']);
const [coefficientProof,chartSHA] = read(resolve(work,'continuation37/slow-chart-majorant.json'),
 'f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5');
assert.deepEqual(coefficientProof.coefficientAtomBound,{powerOfTwo:156,powerOfH:13});
assert.deepEqual(coefficientProof.coefficientRecurrenceBound.at(-1),{order:8,powerOfTwo:1516,powerOfH:117});
const names = [...new Set([...packet.trace.sourceParameters,'h'])];
const params = evaluateClosedArithmeticDefinitions(history.definitions,N,{names}).values;
const boundaries = new Map();
assert.deepEqual(packet.trace.nonArithmeticBoundaries.map(row=>row.id),[239,257,275]);
for (const item of packet.trace.nonArithmeticBoundaries) {
 assert.deepEqual(item.node,history.nodes.find(row=>row.id===item.id).node);
 boundaries.set(item.id,N.fromClosed(history.boundaryIntervals[item.id]));
}
const ev = tracedArithmeticEvaluator(packet.trace,N,{parameters:params,boundaries,maxNodeVisits:packet.trace.nodeCount});
const ell = N.fromClosed(history.archivedEllMinimumInterval);
const H = N.mul(params.get('h'),N.mul(N.add(ell,N.point('15')),N.log(N.point('2'))));
const maxByN = [];
for (const row of packet.finite) {
 const envelope = N.max([ev.value(row.E),ev.value(row.U)]);
 const qWt = N.mul(N.point('2'),N.exp(N.mul(N.point(String(-2*row.n)),H)));
 const weighted = N.mul(envelope,qWt);
 maxByN.push({n:row.n,envelope:N.toClosed(envelope),weighted:N.toClosed(weighted),
  weightedUnitComparison:N.compareEndpoints(N.toClosed(weighted).upper,N.toClosed(N.point('1')).lower)});
}
const chartParams = evaluateClosedArithmeticDefinitions(history.definitions,N,{names:['Lambda','C12EnvelopeR']}).values;
const Hc = N.max([N.point('2'),chartParams.get('Lambda'),chartParams.get('C12EnvelopeR')]);
assert(6n*2n**11n < 2n**14n && 4n*286n < 2n**11n);
const chartMultiplier = N.mul(N.pow(N.point('2'),1867),N.pow(Hc,143));
const leadMax = N.max(Object.values(leading.leadingOrdinaryC10).map(upper=>N.fromClosed({lower:{rational:'0'},upper})));
const upper = N.mul(chartMultiplier,N.add(leadMax,...maxByN.map(r=>N.fromClosed(r.weighted))));
const gate = local.gates.smallGrowth128;
const combinedComparison = N.compareEndpoints(N.toClosed(upper).upper,gate.lower);
const result={schema:'MathScope.N7.OriginalLiveC10PositiveProfileDirected/1',
 packetSHA,historySHA,normSHA,localSHA,chartSHA,leadingSHA,rows:maxByN,upperPointUsesQatMostTwoTau0:true,
 chartMultiplier:{geometry:'Hc=max(2,Lambda,C12EnvelopeR)',pointwiseBound:'2^1867*Hc^143',
   order9OrdinaryPointwiseCoefficientAtom:{powerOfTwo:1686,powerOfH:130},maximumProfileTerms:220},
 candidateFullC10:{originalLeadingProfileC10Required:true,upper:N.toClosed(upper),gate,combinedComparison},
 inputCutoffScope:'All n>=4 vanish on live slab; selected original positive normalized E/U through order10.',
 boundOnSameFamilyPhysicalBoxOnly:true,actualNativeOperandTransport:false,finalJets:0,release:'HOLD'};
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({weightedUnitComparisons:maxByN.map(r=>r.weightedUnitComparison),combinedComparison,trace:ev.report()}));
