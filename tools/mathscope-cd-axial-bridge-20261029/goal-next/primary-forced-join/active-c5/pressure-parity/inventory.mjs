import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export function inventory(root){
  const result={};
  function walk(dir,prefix=''){
    for(const ent of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
      const key=prefix?`${prefix}/${ent.name}`:ent.name;
      const file=path.join(dir,ent.name);
      if(ent.isDirectory())walk(file,key);
      else if(ent.isFile())result[key]=sha(fs.readFileSync(file));
      else throw Error(`Unsupported non-file input: ${key}`);
    }
  }
  walk(root);return result;
}
