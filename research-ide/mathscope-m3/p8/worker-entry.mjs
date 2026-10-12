import {createP8Engine} from './engine.mjs';
const engine=createP8Engine(globalThis.__MATHSCOPE_P8_BUILD__);
let busy=false;
self.onmessage=async event=>{
  const {id,method,input}=event.data||{};
  if(busy){self.postMessage({id,error:'P8 worker is busy.'});return;}
  busy=true;
  try{const api=await engine;if(!['capabilities','run','replay','exportReviewPackets'].includes(method))throw Error('Unknown P8 worker method.');self.postMessage({id,result:await api[method](input)});}
  catch(error){self.postMessage({id,error:String(error?.message||error)});}
  finally{busy=false;}
};
