/** Independent sparse polynomial integration for finite source controls.
 * It expands supplied bodies and integrates their monomial coefficients;
 * the source differentiation/FTC implementation is not used to integrate.
 */
import assert from 'node:assert/strict';
import {globalGraphEqual} from '../source-global-current.mjs';

export function integratePolynomialControl(G,root){
  const sparse=(body,x)=>{
    const cache=new Map(),clean=p=>new Map([...p].filter(([_,c])=>!globalGraphEqual(G,c,G.zero).pass)),
      add=(a,b)=>{const out=new Map(a);for(const [e,c]of b)out.set(e,G.add(out.get(e)??G.zero,c));return clean(out);},
      mul=(a,b)=>{let out=new Map();for(const [e,c]of a)for(const [f,d]of b)out=add(out,new Map([[e+f,G.mul(c,d)]]));return out;},
      inverse=p=>{assert.equal(p.size,1,'the polynomial control uses only monomial denominators');const [[e,c]]=p;return new Map([[-e,G.inv(c)]]);},
      powers=(p,n)=>{if(n<0)return powers(inverse(p),-n);let out=new Map([[0,G.one]]);while(n){if(n%2)out=mul(out,p);n=Math.floor(n/2);if(n)p=mul(p,p);}return out;},
      read=id=>{
        if(cache.has(id))return cache.get(id);let p;
        if(!G.dependsOn(id,x))p=new Map([[0,id]]);
        else if(id===x)p=new Map([[1,G.one]]);
        else{const {op,args}=G.nodes[id];
          if(op==='add')p=args.map(read).reduce(add,new Map());
          else if(op==='multiply')p=args.map(read).reduce(mul,new Map([[0,G.one]]));
          else if(op==='inverse')p=inverse(read(args[0]));
          else if(op==='integer_power')p=powers(read(args[0]),args[1]);
          else assert.fail('nonpolynomial independent control operand '+op);
        }
        p=clean(p);cache.set(id,p);return p;
      };return read(body);
  };
  const memo=new Map(),visit=id=>{
    if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let out=id;
    if(op==='m3_aux_expression_partial'||op==='actual_expression_partial')out=visit(G.materializeExpressionFunction(...args));
    else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    else if(op==='definite_integral'){
      const [b,x,left,right]=args,body=visit(b),a=visit(left),z=visit(right),terms=[];
      for(const [e,c]of sparse(body,x)){
        assert.ok(e>=0,'the integrated polynomial has no negative powers after exact cylindrical cancellation');
        terms.push(G.mul(G.q(1,e+1),c,G.sub(G.pow(z,e+1),G.pow(a,e+1))));
      }
      out=G.add(...terms);
    }
    memo.set(id,out);return out;
  };return visit(root);
}

export const polynomialControlEqual=(G,a,b)=>globalGraphEqual(G,integratePolynomialControl(G,a),integratePolynomialControl(G,b)).pass;
