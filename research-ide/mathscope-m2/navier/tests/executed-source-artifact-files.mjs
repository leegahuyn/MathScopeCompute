/** Storage transport only. Callers still verify the SHA256 of the returned
 * original bytes; neither a gzip file nor this reader supplies source or
 * mathematical authority. An existing raw artifact always takes priority.
 */
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative as relativePath,isAbsolute,dirname,sep,win32} from 'node:path';
import {gunzipSync} from 'node:zlib';

const invalid=(code,message)=>{throw Object.assign(Error(message),{code});};
const within=(root,path)=>{
  const rel=relativePath(root,path);
  if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))
    invalid('EXECUTED_ARTIFACT_PATH_OUTSIDE_ROOT','Executed artifacts must remain inside the specified repository root.');
};
const checkedFile=(root,path)=>{
  // Reject a directory symlink escape even if its requested child is absent.
  within(root,realpathSync(dirname(path)));
  const real=realpathSync(path);within(root,real);return real;
};

/** Synchronous Buffer result. Missing raw bytes may be read from the exact
 * sibling <relative>.gz. Permission, path, CRC and other errors are retained.
 */
export function readExecutedArtifact(root,relative){
  if(typeof root!=='string'||typeof relative!=='string'||!relative||
    /[\0\r\n]/.test(relative)||isAbsolute(relative)||win32.isAbsolute(relative))
    invalid('EXECUTED_ARTIFACT_INVALID_PATH','Use a filesystem root and one nonempty repository-relative artifact path.');
  const canonicalRoot=realpathSync(root),raw=resolve(canonicalRoot,relative);
  within(canonicalRoot,raw);
  if(raw===canonicalRoot)invalid('EXECUTED_ARTIFACT_INVALID_PATH','The artifact path must name a file, not the repository root.');
  try{return readFileSync(checkedFile(canonicalRoot,raw));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  return gunzipSync(readFileSync(checkedFile(canonicalRoot,raw+'.gz')));
}
