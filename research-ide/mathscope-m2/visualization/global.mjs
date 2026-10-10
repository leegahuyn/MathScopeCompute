import * as observations from './observations.mjs';
import * as renderers from './renderer.mjs';
export const visualization=Object.freeze({...observations,...renderers});
if(typeof window!=='undefined')window.MathScopeM2Visualization=visualization;
