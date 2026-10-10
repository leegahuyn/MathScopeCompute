export const M2_SOURCE_BRANCH='mathscope-m2-completion-20261011';
export function evidenceURL(path,ref=M2_SOURCE_BRANCH){
  if(typeof path!=='string'||!/^mathscope-m[012]\/[A-Za-z0-9_./-]+$/.test(path)||path.split('/').some(p=>!p||p==='.'||p==='..'))return null;
  return 'https://github.com/leegahuyn/MathScopeCompute/blob/'+encodeURIComponent(ref)+'/research-ide/'+path.split('/').map(encodeURIComponent).join('/');
}
