/** Bounded WebGL point rasterization. Exact mathematical values stay in the retained CPU scene. */
const vertex='attribute vec2 a_position;attribute float a_radius;attribute vec4 a_color;uniform vec2 u_resolution;uniform float u_dpr;varying vec4 v_color;void main(){vec2 clip=a_position/u_resolution*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);gl_PointSize=2.0*a_radius*u_dpr;v_color=a_color;}';
const fragment='precision mediump float;varying vec4 v_color;void main(){vec2 p=gl_PointCoord*2.0-1.0;if(dot(p,p)>1.0)discard;gl_FragColor=vec4(v_color.rgb*v_color.a,v_color.a);}';
export function rgb(color){
  if(/^#[\da-f]{6}$/i.test(color||''))return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
  const m=String(color||'').match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);return m?m.slice(1).map(x=>Number(x)/255):[118/255,226/255,205/255];
}
export function packMarks(points){
  const buffer=new Float32Array(points.length*7);let maxFloat32PixelError=0;
  for(const[i,p]of points.entries()){buffer.set([p.xy[0],p.xy[1],p.radius||3,...rgb(p.color),p.alpha??.85],i*7);maxFloat32PixelError=Math.max(maxFloat32PixelError,Math.abs(buffer[i*7]-p.xy[0]),Math.abs(buffer[i*7+1]-p.xy[1]));}
  return {buffer,maxFloat32PixelError};
}
export class WebGLMarks {
  constructor(doc){this.doc=doc;this.canvas=null;this.gl=null;this.state='NOT_REQUESTED';this.reason=null;this.last=null;this.lost=false;}
  initialize(){
    if(this.gl&&!this.lost)return true;if(this.state==='UNAVAILABLE'||this.lost)return false;
    try{
      this.canvas=this.doc.createElement('canvas');
      const gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false});
      if(!gl){this.state='UNAVAILABLE';this.reason='WEBGL_CONTEXT_UNAVAILABLE';return false;}
      this.gl=gl;this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.state='CONTEXT_LOST';this.reason='WEBGL_CONTEXT_LOST';});
      this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.gl=null;this.state='NOT_REQUESTED';});
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
      this.program=p;this.buffer=gl.createBuffer();this.position=gl.getAttribLocation(p,'a_position');this.radius=gl.getAttribLocation(p,'a_radius');this.color=gl.getAttribLocation(p,'a_color');this.resolution=gl.getUniformLocation(p,'u_resolution');this.dpr=gl.getUniformLocation(p,'u_dpr');this.state='AVAILABLE';return true;
    }catch(e){this.state='UNAVAILABLE';this.reason=String(e.message).slice(0,300);return false;}
  }
  draw(points,width,height,dpr=1){
    if(!this.initialize()||points.length>6000||width<2||height<2)return false;
    const gl=this.gl;if(gl.isContextLost()){this.lost=true;this.state='CONTEXT_LOST';return false;}
    try{
      const packed=packMarks(points);this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,packed.buffer,gl.DYNAMIC_DRAW);
      for(const[loc,size,offset]of[[this.position,2,0],[this.radius,1,8],[this.color,4,12]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset);}
      gl.uniform2f(this.resolution,width,height);gl.uniform1f(this.dpr,dpr);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.POINTS,0,points.length);
      if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL draw error');this.last={count:points.length,bytes:packed.buffer.byteLength,maxFloat32PixelError:packed.maxFloat32PixelError,width,height,dpr,backend:'WEBGL_POINTS'};return true;
    }catch(e){this.reason=String(e.message).slice(0,300);return false;}
  }
  rasterAudit(){
    const points=Array.from({length:16},(_,i)=>({xy:[20+(i%4)*32,20+Math.floor(i/4)*32,0],radius:4,color:i%2?'#ffd282':'#76e2cd',alpha:1}));
    if(!this.draw(points,140,140,1))return {status:'UNAVAILABLE',reason:this.reason||this.state,pass:false};
    const gl=this.gl,pixel=new Uint8Array(4);let hit=0,empty=0,maxColorError=0;
    for(const p of points){gl.readPixels(Math.floor(p.xy[0]),139-Math.floor(p.xy[1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(pixel[3]>250)hit++;const expected=rgb(p.color).map(x=>Math.round(x*255));for(let k=0;k<3;k++)maxColorError=Math.max(maxColorError,Math.abs(pixel[k]-expected[k]));gl.readPixels(Math.floor(p.xy[0])+8,139-Math.floor(p.xy[1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(pixel[3]===0)empty++;}
    const pass=hit===16&&empty===16&&maxColorError<=1&&gl.getError()===gl.NO_ERROR;
    return {status:pass?'PASS':'FAIL',pass,fixture:'16 explicitly synthetic isolated audit glyphs; not a mathematical result',hitCenters:hit,transparentOutside:empty,maxColorError,tolerance8BitColor:1};
  }
  metrics(){return {state:this.state,reason:this.reason,last:this.last};}
  destroy(){if(this.gl&&!this.lost){if(this.buffer)this.gl.deleteBuffer(this.buffer);if(this.program)this.gl.deleteProgram(this.program);}this.gl=null;this.canvas=null;this.state='DISPOSED';}
}
