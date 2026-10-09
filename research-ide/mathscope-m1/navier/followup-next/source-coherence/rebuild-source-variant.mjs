#!/usr/bin/env node
/**
 * Regenerate a separate source-dependent local chain from actual A.21 inputs.
 *
 * The frozen source producer validates all ranges and computes its own bounds.
 * This entry point cannot accept norms, solution arrays, truth flags, Lambda,
 * or a claimed outer-cone certificate. No existing evidence is overwritten.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {axisSourceExampleInput} from '../../followup-construction/axis-source-certificate.mjs';
import {validateSourcePressureAnalyticInput} from '../../followup-construction/pressure-analytic.mjs';
import {certifySourceAxisForCone} from './refine-axis-certificate.mjs';
import {runSourceAxisPrefix} from './axis-prefix.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const hashBytes=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJSON=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const writeJSON=(p,value)=>fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');
const sourceKeys=['Md','logP','lambda','h','logXR','Tf','co'];
const sourceFiles=[
  'source-axis-cone-refined.json',
  'uniform-source-debt-cone-refined.json',
  'continuation-refinement.json',
  'uniform-source-debt-final.json',
  'axis-prefix-final.json',
];

function argumentsOf(argv){
  const out={parameters:{},baseline:false};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(key==='--baseline-check'){out.baseline=true;continue;}
    if(key==='--help'){out.help=true;continue;}
    if(!['--name',...sourceKeys.map(x=>'--'+x)].includes(key))throw Error('Unknown option: '+key);
    if(i+1>=argv.length||argv[i+1].startsWith('--'))throw Error('Missing value for '+key);
    const value=argv[++i];
    if(key==='--name')out.name=value;
    else{
      const name=key.slice(2);
      if(Object.hasOwn(out.parameters,name))throw Error('Duplicate source parameter: '+name);
      out.parameters[name]=value;
    }
  }
  if(out.baseline&&Object.keys(out.parameters).length)throw Error('Baseline parity does not permit parameter overrides');
  out.name??=out.baseline?'baseline-exact-parity':undefined;
  if(!out.help&&(!out.name||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(out.name)))throw Error('--name must contain 1..64 lowercase letters, digits or hyphens');
  return out;
}

function runPython(script,directory){
  const command=['python3',path.join(ROOT,script),'--directory',directory];
  const result=spawnSync(command[0],command.slice(1),{encoding:'utf8',maxBuffer:4*1024*1024});
  fs.writeFileSync(path.join(directory,script+'.log'),(result.stdout??'')+(result.stderr??''));
  const receipt={command,exitCode:result.status,signal:result.signal,error:result.error?.message??null};
  writeJSON(path.join(directory,script+'.command.json'),receipt);
  if(result.error||result.status!==0)throw Error(script+' did not complete successfully; inspect its saved log');
}

function manifest(directory){
  const entries=fs.readdirSync(directory).filter(f=>f!=='variant-manifest.json').sort().map(file=>{
    const bytes=fs.readFileSync(path.join(directory,file));
    return {file,bytes:bytes.length,sha256:hashBytes(bytes)};
  });
  writeJSON(path.join(directory,'variant-manifest.json'),{schema:'MathScope.Navier.SourceVariantManifest/1',files:entries});
}

function frozenHashes(){
  return Object.fromEntries(sourceFiles.map(f=>[f,hashBytes(fs.readFileSync(path.join(ROOT,f)))]));
}

function main(){
  const options=argumentsOf(process.argv.slice(2));
  if(options.help){
    console.log('node rebuild-source-variant.mjs --baseline-check [--name unique-name]');
    console.log('node rebuild-source-variant.mjs --name unique-name [--Md rational] [--logP rational] [--h rational] [--lambda rational] [--logXR rational] [--Tf rational] [--co rational]');
    console.log('Writes a new variants/name directory. Existing directories are rejected. Every result is LOCAL ONLY; the whole outer cone is not certified by this command.');
    return;
  }
  const defaults=axisSourceExampleInput();
  const parameters={...defaults.pressure.parameters,...options.parameters};
  const sourceInput={...defaults,j0:'1/10000000000',sampleEta:'0',pressure:{family:'source-outer-A21',parameters}};
  const checked=validateSourcePressureAnalyticInput({parameters,boundBits:defaults.boundBits});
  if(!checked.valid)throw Error((checked.status??'INVALID_INPUT')+': '+checked.message);
  const directory=path.join(ROOT,'variants',options.name);
  if(fs.existsSync(directory))throw Error('Variant directory already exists; choose a new --name. Original evidence is never overwritten.');
  fs.mkdirSync(directory,{recursive:true});
  const original=frozenHashes();
  const receipt={
    schema:'MathScope.Navier.SourceVariantRun/1',
    status:'RUNNING',
    mode:options.baseline?'EXACT_BASELINE_PARITY':'REGENERATE_LOCAL_SOURCE_CHAIN',
    sourceInput,parametersExact:checked.parametersExact,inputBinding:checked.inputBinding,
    outputDirectory:path.relative(ROOT,directory),
    originalSourceHashes:original,
    originalGlobalParameterHierarchyComplete:false,
    entireOuterProfileConeCertified:false,
    generatedAnalyticPremisesKernelChecked:false,
    fullProfileCertified:false,
    warning:'This command regenerates a local analytic source chain. It does not establish the outer cone, final outgoing pressure equality, complete finite-frequency field or global support. The default Md=1 datum has an independently certified negative outer Pc.',
  };
  const receiptPath=path.join(directory,'variant-run.json');
  writeJSON(receiptPath,receipt);
  try{
    if(options.baseline){
      fs.copyFileSync(path.join(ROOT,sourceFiles[0]),path.join(directory,sourceFiles[0]));
      receipt.axisComputation='The immutable original axis certificate is copied byte-for-byte as the parity input; no new axis computation is claimed in this mode.';
    }else{
      console.log('Computing the actual A.21 pressure and cone-margin axis selection.');
      const axis=certifySourceAxisForCone(sourceInput);
      writeJSON(path.join(directory,sourceFiles[0]),axis);
      if(axis.status!=='VERIFIED_LOCAL_BOUND_CERTIFICATE')throw Error('Actual source axis generation did not pass: '+axis.status);
      if(JSON.stringify(axis.sourcePressureCertificate.parametersExact)!==JSON.stringify(checked.parametersExact))throw Error('Generated pressure parameters differ from validated exact inputs');
      receipt.axisComputation='Actual frozen A.21 producer and automatic remainder-based Lambda refinement executed.';
    }
    console.log('Computing source-dependent C0/C1 debt and positive after-C widths with C2 bounds.');
    runPython('derive_uniform_debt_parametric.py',directory);
    runPython('refine_continuation_parametric.py',directory);
    const datum=readJSON(path.join(directory,'uniform-source-debt-final.json'));
    if(options.baseline){
      const comparisons=sourceFiles.slice(1,4).map(file=>{
        const reference=fs.readFileSync(path.join(ROOT,file)),actual=fs.readFileSync(path.join(directory,file));
        return {file,byteForByteEqual:reference.equals(actual),referenceSHA256:hashBytes(reference),regeneratedSHA256:hashBytes(actual)};
      });
      const passed=comparisons.every(x=>x.byteForByteEqual);
      writeJSON(path.join(directory,'exact-baseline-parity.json'),{
        schema:'MathScope.Navier.SourceVariantExactParity/1',status:passed?'PASSED':'FAILED',
        comparedWholeJSONDocuments:true,excludedFields:[],comparisons,
        originalAxisInputSHA256:original[sourceFiles[0]],
        originalFinalPrefixSHA256:original['axis-prefix-final.json'],
        prefixScope:'The existing rounded prefix is referenced, not regenerated. Every value of the final parameter datum must be byte-identical before that existing prefix remains applicable.',
      });
      if(!passed)throw Error('Parameterized regeneration differs from an original baseline document');
      receipt.status='BASELINE_EXACT_PARITY_PASSED';
      receipt.prefixComputation='Unmodified original prefix referenced through exact whole-datum equality.';
    }else{
      console.log('Computing the actual radial degree-24, eta degree-2, 1024-bit interval prefix.');
      const prefix=runSourceAxisPrefix({source:sourceInput,sourceSelection:'cone-margin',radialDegree:24,etaDegree:2,arithmeticBits:1024,logC:datum.singleSourceProfile.logC});
      writeJSON(path.join(directory,'axis-prefix-final.json'),prefix);
      if(prefix.status!=='SOURCE_BOUND_INTERVAL_PREFIX_COMPUTED')throw Error('Actual source interval prefix did not complete');
      for(const k of ['h','j0','Lambda','sigmaStar','logC'])if(prefix.sourceProfileParameters[k]!==datum.singleSourceProfile[k])throw Error('Prefix/datum mismatch: '+k);
      const generatedAxis=readJSON(path.join(directory,'source-axis-cone-refined.json'));
      const axisMathHash=hashBytes(JSON.stringify({...generatedAxis,execution:undefined}));
      if(prefix.sourceCertificateBinding.sourceCertificateMathematicalHash!==axisMathHash)throw Error('Prefix and continuation are bound to different generated axis certificates');
      receipt.sourceMathematicalProfileHash=prefix.sourceProfileHash;
      receipt.axisMathematicalCertificateHash=axisMathHash;
      receipt.prefixComputation='The finite nonlinear recurrence, directed rounding and analytic radial tail were recomputed for this exact source.';
      receipt.status='LOCAL_SOURCE_CHAIN_REGENERATED_NOT_GLOBAL_CERTIFIED';
    }
    const axis=readJSON(path.join(directory,sourceFiles[0]));
    receipt.sourceParameterContract=axis.sourcePressureCertificate.sourceParameterContract;
    receipt.finalSourceSHA256=hashBytes(fs.readFileSync(path.join(directory,'uniform-source-debt-final.json')));
    receipt.originalFilesUnchanged=JSON.stringify(frozenHashes())===JSON.stringify(original);
    if(!receipt.originalFilesUnchanged)throw Error('An original source evidence file changed during variant generation');
    receipt.scalarChecks={
      debt:Object.values(datum.checks).filter(Boolean).length,
      debtTotal:Object.keys(datum.checks).length,
      continuation:Object.values(readJSON(path.join(directory,'continuation-refinement.json')).checks).filter(Boolean).length,
      continuationTotal:Object.keys(readJSON(path.join(directory,'continuation-refinement.json')).checks).length,
    };
    writeJSON(receiptPath,receipt);manifest(directory);
    console.log(JSON.stringify({status:receipt.status,directory:receipt.outputDirectory,finalSourceSHA256:receipt.finalSourceSHA256,checks:receipt.scalarChecks,originalFilesUnchanged:receipt.originalFilesUnchanged,fullProfileCertified:false},null,2));
  }catch(error){
    receipt.status='FAILED_OR_BLOCKED';receipt.error=error.message;
    receipt.originalFilesUnchanged=JSON.stringify(frozenHashes())===JSON.stringify(original);
    writeJSON(receiptPath,receipt);manifest(directory);throw error;
  }
}

try{main();}catch(error){console.error(error.message);process.exitCode=1;}
