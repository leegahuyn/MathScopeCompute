# M3 · 원본 활성 거대 ell에서의 정확 유리수 축 메시 구성 (2026-10-27)

## 대상과 증거 등급

기존 `prove_original_root623935_autoselected_mesh.py`가 이미 일반 nearest-integer 메시 존재 정리를 기록했으므로 이를 새로운 정리로 중복 계상하지 않는다. 이번 추가분은 첫 post-Signed FiveMap의 source native root **#623935**에 대해, 원본 활성 수준보다 큰 거대 `ell`을 정수 그대로 사용하면서 **축 `sRep=1`의 정확 유리수 입력을 반경·시간 bracket까지 계산하고 안전하게 직렬화하는 특수 fixture**이다. 기존 `prove_original_root623935_general_srep_image.py`의 조건부 image theorem을 사용한다. 임의의 실제 원본 runtime 인덱스가 아래 정수 선택과 동일하다는 주장은 아니다. full physical 3D field, PDE, 523 Y calls 또는 (C)→(D) 주장은 더하지 않는다.

원본 상수는 `0<h<2^-4096`, `D=1/2-h`, `ell>=3`, `E=ell^6`이고 원본 셀 반폭은 `3/(4E)`다. `ell>2^8204`인 활성 영역도 **기호적으로** 다룬다. `h=0`, `Q^h=1`, floating mesh normalizer 사용 금지.

## 1. 임의의 실수 좌표에 대한 메시 존재 정리

임의의 실수 `v`와 양의 정수 `E`에 대해 `j=floor(Ev+1/2)`라 하자. floor의 정의에서

`j <= Ev+1/2 < j+1`, 즉 `-1/2 <= Ev-j < 1/2`.

따라서 `|Ev-j| <=1/2 <3/4`이고, **엄격한 양쪽 셀 내부**

`(j-3/4)/E < v < (j+3/4)/E`

가 성립한다. 경계의 equality와 음의 좌표에도 적용된다. 적어도 `1/(4E)`의 거리 여유가 존재한다.

특히 원본 chart image 대표점

`sRep in [1/2,2], etaRep in [-1,1], Xa<=Xrep<=Xb,`
`Rrep = sqrt(2*sRep*Xrep)>=0,`
`Zrep = sRep^(1/2-h)*etaRep,`
`Trep = sRep*(1-etaRep^2)`

의 각 좌표에 대해 독립적으로 `r=floor(E*Rrep+1/2)`, `z=floor(E*Zrep+1/2)`, `t=floor(E*Trep+1/2)`를 잡으면 **동일 `E`에서 세 엄격한 셀 내부성 가정이 동시에 성립**한다.

원본 `#623935` 일반 representative-image 정리의 남은 전제 `0<Xa<=Xrep<=Xb`, `Rrep^2=2*sRep*Xrep` 및 `0<h<2^-4096`가 참일 때, 그 정리의 `a,b,m,M` bracket 및 부호 선택 결론을 적용할 수 있다. 이 결과는 존재하는 메시를 지정하는 수학적 정리이지, 원본 코드가 실제로 그 메시를 선택한다는 증명이 아니다.

## 2. 모든 양의 원본 h에 대해 정확한 축 fixture (새 테스트 범위)

`sRep=1`, `-1<=eta<=1`, `Xrep=R^2/2`, `R>0`, `0<Xa<=Xrep<=Xb`에서는

`Zrep=eta`, `Trep=1-eta^2`, `F(1;Zrep,Trep)=1-Zrep^2*1^(2h)-Trep=0`

가 **임의의 허용 h**에 대해 정확하다. `E=ell^6`로 위 nearest indices를 만들면 세 엄격한 셀 조건을 갖는다.

원본 정의
`a=max(1/2, max(0,(r-3/4)/E)^2/(2Xb))`,
`b=max(a,min(2,((r+3/4)/E)^2/(2Xa)))`,
`m=max(0,(t-3/4)/E)`, `M=(t+3/4)/E`
는 정확히 `1/2<=a<=1<=b<=2` 및 `0<=m<=Trep<M`를 만족한다. 앞 절의 mesh inequality와 `Xa<=R^2/2<=Xb`를 사용한다. 원본 `F_s>1-8h>1/2`의 기존 조건부 단조성 결과도 유지된다.

`original_representative_mesh_witness.py`는 **유리수 축 fixture**를 Fractions로 구성해 위 bracket을 독립 검사하고 정확한 결과, 메시 여유, 원본 미충족 상태를 출력한다. 원본 거대 ell을 일반 정수로 전개하는 production certificate는 아니다.

## 3. 이번 실행과 열린 의무

- `pytest -q test_original_representative_mesh_witness.py`: 로컬 36개 PASS (여러 ell, 양/음 eta, 경계, 전제 위반). 해당 로컬 테스트 결과는 원격 GitHub Actions PASS와 별개다.
- **기존 정리의 재사용**: 모든 대표점에 대한 nearest 메시 존재성은 이미 기존 코드에 있다. **이번 새로 검증한 구현 범위**는 `ell=2^8205>2^8204`의 거대 활성-규모 시험 입력을 정확한 정수·유리수로 처리하여 bracket을 구성하고, Python 4300자리 십진 변환 제한을 낮은 precision 근사나 안전 제한 해제 없이 16진수 정확 직렬화로 우회한 것이다. 이는 실제 source에서 선택된 ell이나 index의 인증은 아니다.
- **여전히 OPEN**: 실제 source의 frozen `(ell,r,z,t)`가 이 nearest 선택과 일치하거나 충분한 셀 조건을 갖는지, #622820 자유 좌표들의 chart image, 실제 11-root 지원 집합, 490개 Y의 global upper 5, common native analytic domain, 최종 A–D full field와 jet/energy/PDE.
- 전역 original Y 인증 **33/523**, 최종 jet **0/67**, **M3 62/64 · M4 0/16 · RELEASE HOLD**. (A)/(B) 전역 정칙성은 연구 목표에 추가하지 않는다.

**주의**: 이 증명은 임의의 실수 `R,Z,T`에 대한 nearest 정수의 순수한 존재 증명에 해당한다. Python 코드는 원본의 유리수 축 특례만 테스트하며, source의 모든 물리 호출이 실제로 인증되었다고 해석하면 안 된다.
