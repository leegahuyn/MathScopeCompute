"""Compile and execute the shipped GLSL on native EGL/OpenGL ES, without a browser.

This is an independent shader/raster oracle. It does not claim that the cloud
browser supplied a WebGL context; browser fallback acceptance is recorded apart.
Primary API sources: https://registry.khronos.org/EGL/ and https://docs.mesa3d.org/egl.html
"""
from pathlib import Path
import ctypes as C, ctypes.util, os, re, json, math, hashlib, time, subprocess
ROOT=Path(__file__).resolve().parents[1]
os.environ['EGL_PLATFORM']='surfaceless'
e=C.CDLL(ctypes.util.find_library('EGL'))
I=C.c_int; U=C.c_uint; F=C.c_float; P=C.c_void_p

def egl(name,ret,args):
    fn=getattr(e,name);fn.restype=ret;fn.argtypes=args;return fn
get_display=egl('eglGetDisplay',P,[P]);initialize=egl('eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])
display=get_display(None);major=I();minor=I();assert initialize(display,C.byref(major),C.byref(minor))
assert egl('eglBindAPI',U,[U])(0x30A0)
attributes=(I*15)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3025,0,0x3038)
config=P();count=I();assert egl('eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(display,attributes,C.byref(config),1,C.byref(count)) and count.value
surface=egl('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(display,config,(I*5)(0x3057,800,0x3056,420,0x3038))
context=egl('eglCreateContext',P,[P,P,P,C.POINTER(I)])(display,config,None,(I*3)(0x3098,2,0x3038))
assert surface and context and egl('eglMakeCurrent',U,[P,P,P,P])(display,surface,surface,context)
get_proc=egl('eglGetProcAddress',P,[C.c_char_p])
def gl(name,ret,args):
    address=get_proc(name.encode());assert address,name
    return C.CFUNCTYPE(ret,*args)(address)
get_string=gl('glGetString',C.c_char_p,[U]);vendor=get_string(0x1F00).decode();renderer=get_string(0x1F01).decode();version=get_string(0x1F02).decode()
create_shader=gl('glCreateShader',U,[U]);shader_source=gl('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compile_shader=gl('glCompileShader',None,[U]);shader_iv=gl('glGetShaderiv',None,[U,U,C.POINTER(I)]);shader_log=gl('glGetShaderInfoLog',None,[U,I,C.POINTER(I),C.c_char_p])
create_program=gl('glCreateProgram',U,[]);attach=gl('glAttachShader',None,[U,U]);link=gl('glLinkProgram',None,[U]);program_iv=gl('glGetProgramiv',None,[U,U,C.POINTER(I)]);use=gl('glUseProgram',None,[U]);attribute=gl('glGetAttribLocation',I,[U,C.c_char_p]);uniform=gl('glGetUniformLocation',I,[U,C.c_char_p]);uniform2=gl('glUniform2f',None,[I,F,F]);uniform1=gl('glUniform1f',None,[I,F]);enable_attribute=gl('glEnableVertexAttribArray',None,[U]);pointer=gl('glVertexAttribPointer',None,[U,I,U,U,I,P]);gen_buffer=gl('glGenBuffers',None,[I,C.POINTER(U)]);bind_buffer=gl('glBindBuffer',None,[U,U]);buffer_data=gl('glBufferData',None,[U,C.c_ssize_t,P,U]);viewport=gl('glViewport',None,[I,I,I,I]);clear_color=gl('glClearColor',None,[F,F,F,F]);clear=gl('glClear',None,[U]);enable=gl('glEnable',None,[U]);disable=gl('glDisable',None,[U]);blend=gl('glBlendFunc',None,[U,U]);draw_arrays=gl('glDrawArrays',None,[U,I,I]);read_pixels=gl('glReadPixels',None,[I,I,I,I,U,U,P]);finish=gl('glFinish',None,[]);error=gl('glGetError',U,[])
source=(ROOT/'visualization/webgl-marks.mjs').read_text();vertex=re.search(r"const vertex='([^']+)';",source).group(1);fragment=re.search(r"const fragment='([^']+)';",source).group(1)
def program(vs,fs):
    p=create_program()
    for kind,text in [(0x8B31,vs),(0x8B30,fs)]:
        s=create_shader(kind);encoded=C.c_char_p(text.encode());shader_source(s,1,C.byref(encoded),None);compile_shader(s);ok=I();shader_iv(s,0x8B81,C.byref(ok))
        if not ok.value:
            message=C.create_string_buffer(4096);shader_log(s,4096,None,message);raise AssertionError(message.value.decode())
        attach(p,s)
    link(p);ok=I();program_iv(p,0x8B82,C.byref(ok));assert ok.value,'Program link';return p
p=program(vertex,fragment);bad=program(vertex.replace('clip.x,-clip.y','clip.x+0.10,-clip.y'),fragment)
js="""import {packMarks} from './visualization/webgl-marks.mjs';
const glyphs=Array.from({length:16},(_,i)=>({xy:[20+(i%4)*32,20+Math.floor(i/4)*32,0],radius:4,color:i%2?'#ffd282':'#76e2cd',alpha:[.1,.5,.85,1][i%4]}));
const stress=Array.from({length:6000},(_,i)=>({xy:[4+(i%100)*7.6,4+Math.floor(i/100)*6.5,0],radius:2.5,color:i%2?'#ffd282':'#76e2cd'}));
console.log(JSON.stringify({glyphs,buffer:Array.from(packMarks(glyphs).buffer),stress:Array.from(packMarks(stress).buffer),maxFloat32PixelError:packMarks(stress).maxFloat32PixelError}));"""
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True))
def render(prog,values,w,h):
    use(prog);viewport(0,0,w,h);clear_color(0,0,0,0);clear(0x4000);vbo=U();gen_buffer(1,C.byref(vbo));bind_buffer(0x8892,vbo);buf=(F*len(values))(*values);buffer_data(0x8892,C.sizeof(buf),buf,0x88E8)
    for name,n,offset in [(b'a_position',2,0),(b'a_radius',1,8),(b'a_color',4,12)]:
        a=attribute(prog,name);enable_attribute(a);pointer(a,n,0x1406,0,28,P(offset))
    uniform2(uniform(prog,b'u_resolution'),w,h);uniform1(uniform(prog,b'u_dpr'),1);enable(0x0BE2);blend(1,0x0303);disable(0x0B71);draw_arrays(0,0,len(values)//7);finish();assert error()==0
    gl('glDeleteBuffers',None,[I,C.POINTER(U)])(1,C.byref(vbo))
def raster(prog):
    render(prog,fixture['buffer'],140,140);pixels=(C.c_ubyte*(140*140*4))();read_pixels(0,0,140,140,0x1908,0x1401,pixels);max_err=0;empty=0;hits=0
    for i,g in enumerate(fixture['glyphs']):
        x,y=g['xy'][:2];pos=((139-int(y))*140+int(x))*4;actual=list(pixels[pos:pos+4]);values=fixture['buffer'][i*7:(i+1)*7];expected=[round(255*values[k]*values[6]) for k in [3,4,5]]+[round(255*values[6])];max_err=max(max_err,*[abs(a-b) for a,b in zip(actual,expected)]);hits+=actual[3]>0;outside=((139-int(y))*140+int(x)+8)*4;empty+=pixels[outside+3]==0
    return {'pass':max_err<=2 and hits==16 and empty==16,'maxPremultipliedRGBAError':max_err,'centers':hits,'transparentOutside':empty,'tolerance8Bit':2}
positive=raster(p);negative=raster(bad);assert positive['pass'] and not negative['pass']
durations=[]
for i in range(33):
    started=time.perf_counter();render(p,fixture['stress'],800,420);dt=(time.perf_counter()-started)*1000
    if i>=3:durations.append(dt)
p95=sorted(durations)[math.ceil(.95*len(durations))-1]
report={'schema':'MathScope.ShaderRasterAudit/1','pass':True,'sourceFile':'visualization/webgl-marks.mjs','sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'backend':{'api':version,'vendor':vendor,'renderer':renderer,'EGL':f'{major.value}.{minor.value}'},'positive':positive,'negativeShiftedShaderRejected':not negative['pass'],'bufferSource':'The actual exported JavaScript packMarks function','maxFloat32PixelError':fixture['maxFloat32PixelError'],'pixelTolerance':.001,'stress':{'marks':6000,'samples':len(durations),'p95Milliseconds':p95,'targetMilliseconds':100},'scope':'Native offscreen EGL/OpenGL ES shader and raster oracle; no browser controlled or configured. Software driver identity is explicit. The cloud browser WebGL context was unavailable, and browser CPU fallback/source-table parity is recorded separately.'}
assert fixture['maxFloat32PixelError']<.001
(ROOT/'evidence/gpu-shader-raster-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
egl('eglMakeCurrent',U,[P,P,P,P])(display,None,None,None);egl('eglDestroyContext',U,[P,P])(display,context);egl('eglDestroySurface',U,[P,P])(display,surface);egl('eglTerminate',U,[P])(display)
