/** Independent SU(2) arithmetic: no matrix-product or lattice-action imports. */
import {check} from './contracts.mjs';
export const qIdentity=()=>[1,0,0,0];
export const qInverse=q=>[q[0],-q[1],-q[2],-q[3]];
// Matrix map a I+i(b sigma_1+c sigma_2+d sigma_3). Thus the vector
// part of a product is a v+b u-u cross v (opposite to Hamilton's i,j,k).
export function qMultiply(p,q){const [a,b,c,d]=p,[e,f,g,h]=q;return [a*e-b*f-c*g-d*h,a*f+e*b-c*h+d*g,a*g+e*c-d*f+b*h,a*h+e*d-b*g+c*f];}
export function qHaar(rng){const q=[rng.normal(),rng.normal(),rng.normal(),rng.normal()],r=Math.hypot(...q);check(r>0&&Number.isFinite(r),'FAILED','Independent Haar draw was not finite.');return q.map(x=>x/r);}
export function qLoop(links,edges){let q=qIdentity();for(const e of edges){const u=links[e.id];check(u,'FAILED','Independent loop references an absent positive link.');q=qMultiply(q,e.inverse?qInverse(u):u);}return q;}
export function qWilson(geometry,links){let action=0,trace=0;const loops=[];for(const p of geometry.plaquettes){const value=qLoop(links,p.edges)[0];action+=p.weight*(1-value);trace+=value;loops.push(value);}return {action,meanPlaquette:trace/geometry.plaquettes.length,normalizedPlaquetteTraces:loops};}
export function qConfiguration(geometry,rng){const links=Array(geometry.V*4).fill(null);for(const e of geometry.active)links[e.id]=qHaar(rng);return links;}
export function qFromMatrix(m){return [m.re[0],m.im[1],m.re[1],m.im[0]];}
export function qTransform(links,edges,frames){const out=links.slice();for(const e of edges)out[e.id]=qMultiply(qMultiply(frames[e.site],links[e.id]),qInverse(frames[e.end]));return out;}
