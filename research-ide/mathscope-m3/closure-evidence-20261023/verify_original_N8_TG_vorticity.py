#!/usr/bin/env python3
"""Source-pinned Fourier vorticity / enstrophy for actual N8 Taylor-Green fixture.

Replays the 125 retained 3D Fourier modes from original N8-TG.json,
without replacing physical C/D final fields by this generic comparator.
"""
import argparse,hashlib,json,math
from pathlib import Path

REL="research-ide/mathscope-m3/navier/evidence/N8-TG.json"
ORIGINAL_BLOB="c572d2ed4399524bdbc665305c6acb9e7d38ee3d"
RUN="8bdf584da5121931d1fb7d79416d568c698f5a8211c22d7d600648ea23015b6f"

def check(ok,msg):
    if not ok:raise ValueError("N8_ORIGINAL_FIXTURE_REJECTED: "+msg)

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\x00"+data).hexdigest()

def curl_from_actual_3D_Fourier(coef,K,position):
    """Evaluate every original k x u_hat with the exp(i k.x) convention."""
    out=[0.,0.,0.];i=0
    for kx in range(-K,K+1):
      for ky in range(-K,K+1):
       for kz in range(-K,K+1):
        u=[complex(coef[6*i+2*j],coef[6*i+2*j+1]) for j in range(3)]
        omega=(1j*(ky*u[2]-kz*u[1]),
               1j*(kz*u[0]-kx*u[2]),
               1j*(kx*u[1]-ky*u[0]))
        phase=kx*position[0]+ky*position[1]+kz*position[2]
        c=complex(math.cos(phase),math.sin(phase))
        for j in range(3):out[j]+=(omega[j]*c).real
        i+=1
    check(i==(2*K+1)**3,"incorrect Fourier mode traversal")
    return out

def replay(data,actual_blob):
    check(actual_blob==ORIGINAL_BLOB,"original Git blob SHA drift")
    check(data["schema"]=="MathScope.NavierM3.Result/1" and data["runHash"]==RUN,"run/hash drift")
    check(data["results"]["branch"]=="GENERIC_FOURIER_GALERKIN","not original finite comparator")
    check(data["sourceBoundaries"]["wholeM3Complete"] is False,"invalid status promotion")
    check(len(data["observations"]["curves"])==32,"different observed time grid")
    check(len(data["observations"]["samples"])==81,"different original samples")
    params=data["input"]["parameters"]
    check(params["cutoff"]==2 and params["viscosity"]==1,"unexpected K or viscosity")
    modes=params["cutoff"];v=data["results"]["final"]
    check(len(v)==6*(2*modes+1)**3,"3D complex Fourier coefficient order changed")
    energy=0.;grad2=0.;vort2=0.;divMax=0.;z3err=0.;nonzero=0;index=0
    for kx in range(-modes,modes+1):
      for ky in range(-modes,modes+1):
       for kz in range(-modes,modes+1):
        ux,uy,uz=complex(v[6*index],v[6*index+1]),complex(v[6*index+2],v[6*index+3]),complex(v[6*index+4],v[6*index+5])
        check(all(math.isfinite(t) for t in v[6*index:6*index+6]),"non-finite Fourier coefficient")
        norm=abs(ux)**2+abs(uy)**2+abs(uz)**2
        energy+=norm/2
        grad2+=(kx*kx+ky*ky+kz*kz)*norm
        wx=1j*(ky*uz-kz*uy)
        wy=1j*(kz*ux-kx*uz)
        wz=1j*(kx*uy-ky*ux)
        vort2+=abs(wx)**2+abs(wy)**2+abs(wz)**2
        divMax=max(divMax,abs(kx*ux+ky*uy+kz*uz))
        if kz: z3err=max(z3err,abs(ux),abs(uy),abs(uz))
        z3err=max(z3err,abs(uz),abs(wx),abs(wy))
        if norm>0:nonzero+=1
        index+=1
    last=data["observations"]["curves"][-1]
    check(abs(last["time"]-0.5)<1e-14,"unexpected actual final frame")
    check(abs(energy-last["energy"])<1e-12,"Parseval energy disagrees with saved run")
    check(abs(grad2-last["gradientSquared"])<1e-12,"gradient norm disagrees")
    check(vort2-grad2<1e-12 and abs(vort2-grad2)<1e-12,"curl vs gradient mismatch")
    check(divMax<=1e-12 and z3err<=1e-12,"not the recorded 2D-in-3D TG field")
    # Replay pointwise curl from original coefficients; do not infer any
    # per-time Fourier coefficients at earlier frames.
    max_curl_error=0.;max_horizontal_vort=0.
    amplitude=math.sqrt(4*last["energy"])
    for sample in data["observations"]["samples"]:
      pos=sample["position"]
      check(len(pos)==3,"sample point is not a 3D coordinate")
      curl=curl_from_actual_3D_Fourier(v,modes,pos)
      analytic=2*amplitude*math.sin(pos[0])*math.sin(pos[1])
      max_curl_error=max(max_curl_error,abs(curl[2]-analytic))
      max_horizontal_vort=max(max_horizontal_vort,math.hypot(curl[0],curl[1]))
    check(max_curl_error<1e-12 and max_horizontal_vort<1e-12,
          "original 81 source sample 3D curl/Taylor-Green reference mismatch")
    return {
      "schema":"MathScope.M3.N8.OriginalTG3DFourierVorticityIndependentReplay/1",
      "original_blob_sha1":ORIGINAL_BLOB,"runHash":RUN,
      "scope":"ACTUAL_GENERIC_FOURIER_GALERKIN_COMPARATOR_NOT_CLAY_C_D_FINAL_FIELD",
      "retained_3D_Fourier_modes":index,"six_component_real_coefficients":len(v),
      "nonzero_wavevectors":nonzero,"time":last["time"],
      "mean_kinetic_energy":energy,
      "mean_gradient_squared":grad2,
      "mean_vorticity_squared":vort2,
      "mean_enstrophy":vort2/2,
      "original_81_point_3D_Fourier_curl_vs_exact_Taylor_Green_max_error":max_curl_error,
      "original_81_point_horizontal_vorticity_max":max_horizontal_vort,
      "Fourier_divergence_max":divMax,
      "z_invariance_and_u_z_and_horizontal_vorticity_max":z3err,
      "Parseval_and_curl_divergence_identity_verified":True,
      "actual_global_K_energy_C_certified":False,
      "actual_final_A_D_67_jets_certified":0,
      "N7_06":"OPEN","N8_05":"OPEN","M3":"62/64","M4":"0/16",
      "release":"HOLD"
    }

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--out",type=Path)
    args=ap.parse_args()
    root=Path(__file__).resolve().parents[3]
    raw=(root/REL).read_bytes()
    result=replay(json.loads(raw),git_blob(raw))
    if args.out:
      args.out.parent.mkdir(parents=True,exist_ok=True)
      args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,indent=2))
if __name__=="__main__":main()
