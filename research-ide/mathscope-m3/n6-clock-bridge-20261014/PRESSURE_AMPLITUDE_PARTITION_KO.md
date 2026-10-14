# 원본 P0/g의 완전한 clock 분할 연결

`source_clock_bridge.py`는 원본 3,892,594-node parent에 연결된 인증 prefix와 registry를 읽는다. producer를 재실행하지 않는다. 실제 원본 body를 12개 유한 구간과 양쪽 무한 구간으로 **전부** 비교한다. 결론은 아래 함수 동일성까지이며, 원본 nonlinear native coefficient의 Bρ 노름 또는 전체 field 정의역 인증을 자동으로 추가하지 않는다.

## 공통 상수와 step

원본 parameter profile SHA를 확인하고 T=exp(2²⁰)+10, λ=exp(−1000T), h=exp(−8002T), j=h⁴, σ*=j/2000, co=1/256, Tf=128, BOuter=1000T를 원래 expression tree 그대로 확인한다. 따라서 0<h<λ<1/100이고 모든 길이는 양수다. `guard_solve.terminal_theorem`의 실제 Qp/Qb 적분 증명은 Qp>0, Qb>5, Qb/Qp>500과 wait>5를 준다. binary64 근사는 사용하지 않는다.

원본 source step과 공식 commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`의 FlatCutoff는 모두 exp(−1/x²)의 영 연장으로 만든 같은 σ다. 공식 FlatCutoff 원문 8,722바이트의 SHA `fa8b6c0283fbbd949e2501649c67617174fbf4d2d11d5c3ac1556daa6c186d17`를 cloud에서 읽어 확인한다. 다른 차수의 smooth step을 대입하지 않는다. σ(1−x)=1−σ(x)이므로 S(1)=∫₀¹σ=1/2이고 S(0)=0이다. 모든 외부 및 endpoint 양의 차수 미분은 0이다.

## 생략 없는 구간

H=−4 log h, W=log(Qb/Qp)/(1−h), α=−1/2−λ, ρ=co·h라 쓰자. 시작점은 아래 길이의 누적합이다.

| 원본 stage | 길이 | 구간 안 log-amplitude 증가 δ(s) |
|---|---|---|
| initial | 1 | s/10−3S(s)/5 |
| axialDecay | T | −s/2 |
| entry | 1 | −s/2−λS(s) |
| reservedPower | 60000T | αs |
| pulse | 13/λ | αs |
| interpolation | 128 | αs−log(2)σ(s/128) |
| angular | 30000T | αs |
| steepen | 1 | αs−(1−λ)S(s) |
| steepPower | H | −3s/2 |
| flatten | 1 | −3s/2+(1−h)S(s) |
| wait | W | −(1/2+h)s |
| terminal | 3 | −(1/2+h)s+log(fo(s)/(1−ρ)) |

여기서 fo(s)=1−ρ+ρσ((s−1)/2)>0이다. 첫 stage 이전의 clock은 P* exp(y/10), 마지막 이후의 clock은 마지막 값에 exp(−(1/2+h)·거리)를 곱한 것이다. 검사는 각 원본 stage의 실제 start/end/length/logAStart/logAEnd와 **실제 P0 integrand, binder, 양 endpoint**를 독립 구성한 위 식과 비교한다. source node/hash를 별도 evidence에 남긴다. 중간 지점 하나의 값으로 전체 stage를 대체하지 않는다.

## Lean clock과 동일한 이유

Lean의 base logarithmic derivative는

`−1/2+(3/5)(1−σ(y))−λσ(y−(T+1))`이다.

endpoint E=T+2+60000T+13/λ, interpolation 뒤 release 시작은 R=E+128+30000T이다. 추가 logarithmic derivative는

`−log(2)/128 ·σ′((y−E)/128) −(1−λ)σ(y−R)+(1−h)σ(y−R−(1+H))`

와 terminal `fo′/fo`이다. 각 구간의 외부 σ·σ′를 정확히 0 또는 1로 줄이면 표의 δ′와 같다. 코드의 두 독립 정수 다항식 전개기가 이 14개 구간의 임의 변수 항등식을 확인한다. initial/flatten/interpolation/terminal 계수를 변경한 대조는 실패한다.

clock 0에서 양쪽 값은 P*다. 위 logarithmic derivatives는 연속이고, 표의 endpoint 값은 모두 앞 stage의 실제 끝 값이다. 양의 두 clock 비율의 도함수가 각 열린 구간에서 0이고 endpoint에서 연속이므로 전체 실수 clock에서 같은 함수다. 이 논증은 비어 있지 않은 모든 stage와 양 무한 구간을 포함한다.

Lean releaseLag는 Q′+(1+releaseSlope)Q=−releaseSlope−h, Q(0)=(λ−h)/(1−λ)의 같은 integrating-factor 해다. 첫 ramp의 적분 인자는 exp((1−λ)(s−S(s))), hold에서는 계수가 0이고 forcing이 1−h이며, 마지막 ramp의 적분 인자는 exp((1−h)S(s))다. 따라서 ramp 끝 값은 코드가 원본 node에서 검사한 **같은 Qb**다. Lean newTailDebt의 ∫₀³는 σ′가 0인 [0,1]을 제거하면 원본 Qp의 ∫₁³와 같다. 그러므로 terminal wait와 tail 시작점도 같다.

## P0의 정규화와 무한 tail

Lean `newShapeExponent`는 interpolation 이전 1, interpolation 안 `1−σ(s/128)`, 이후 0이다. η는 임의의 실수이며 f=(1+η²)⁻¹>0이므로 exp(2θ log f)=exp(−2θ log(1+η²))이다. 따라서 원본 각 density는 Lean pressure integrand와 같다.

양쪽 무한 구간의 적분은 각각 **5P*² f²**와 **P*² exp(2·최종 logA)/(1+2h)**다. 앞 rate=1/5>0, 뒤 rate=−(1+2h)<0이다. 중간 유한 적분은 연속 함수의 유한 구간 적분이다. 이로써 절대 적분 가능성과 전체 적분의 유한 additivity를 확보한다. 실제 source P0의 −1/2 계수와 P*²도 node에서 확인하므로 native P0=Lean newPressure가 전체 실수 η에서 성립한다. 원본 pressure-neutral angular edit의 별도 증명을 이 함수 동일성으로 대신하지 않는다. 여기서는 **native P0 자체가 정의한** unedited A.21 합을 연결한다.

## g의 적분 상수

독립 node 검사는 D=1/2−h, d=1−η², L=1−2hη², U*=4η+j, H*=Dη+dU*, ζ=−LH*/(H*²+σ*²)와 native ψ=∫₀^ηζ를 확인한다. 분모는 모든 실수 η에서 엄밀히 양수다. 원본 Lean realPhase는 η∫₀¹ζ(tη)dt이므로 oriented 선형 변수변환으로 ψ와 같다. η<0의 방향과 η=0도 포함한다. Λ와 CSelected의 원래 parameter tree를 확인하고, Q>0에서 exp(10log(1+Q³⁰⁰)+Q²⁰⁰)=(1+Q³⁰⁰)¹⁰exp(Q²⁰⁰)를 사용하면 native g=Lean realAmplitude가 된다. 새로운 적분 상수나 amplitude를 고르지 않는다.

## 판정 범위

원본 source byte/hash, 12개 stage와 두 tail, Qb/Qp 및 g node 검사가 하나라도 실패하면 함수 동일성은 미증명으로 남고 정확한 실패 원인을 출력한다. 이 결과가 통과해도 nonlinear coefficient recurrence의 실제 native limit와 선택 fixed point의 완전한 동일성, 모든 실제 호출의 source image, 원본 j0 전체 W/M/S와 Haar/PDE는 따로 남긴다. 이 module은 jet·guard·N6 합격 수를 올리지 않는다.
