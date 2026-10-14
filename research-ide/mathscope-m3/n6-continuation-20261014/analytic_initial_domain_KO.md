# 실제 common slow chart의 존재성·C∞ 정의역 증명

원본 `source-global-band.mjs`와 archived registry `monotone[2]`의 실제 함수는

`F(s;Z,T)=s-Z^2*s^(2h)-T`, `s∈[1/2,2]`,

이다. 실제 body는 **622819**, 선택된 root는 **622820**, recovered eta는
**622829**다. `h=exp(-8002*(exp(1048576)+10))`을 원본 정의와 대조했다.
따라서 `0<h<2^-8002<1/64`이며 `h`를 0으로 바꾸지 않는다.
archived header SHA는
`010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c`다.

## 실제 원본 image 전체에서의 unique root

`D=1/2-h`라 두고 원본 normalized domain을

`D_h={(Z,T)=(s^D*eta,s*(1-eta^2)): 1/2≤s≤2, -1≤eta≤1}`

로 정의한다. 이는 compact closed image다. image point의 defining s는
`Z^2*s^(2h)=s*eta^2`에 의해 정확히 root다.

이 image의 모든 `Z`에 대해 `|Z|≤2^D`이고, 전체 bracket의 어떤 s에서도

`Z^2*s^(2h-1) ≤ 2^(2-4h) < 4`.

따라서 `F_s=1-2h*Z^2*s^(2h-1)>1-8h>7/8>1/2`이다.
이는 root에서만 검사한 positivity가 아니라 **전체 bracket**의 strict
monotonicity다. 그러므로 원본 endpoint signs와 unique root가 모두
원본 image 전체에서 성립하고, 실제 선택된 source root가 그 root와 일치한다.

원본 finite bracket은 임의의 `(Z,T)`에서 root를 제공하지 않는다.
예를 들어 `Z=0,T=3`이면 양 끝에서 `F<0`다. 그 점은 위 원본 image 밖이다.
이번 증명은 source의 bracket을 바꾸지 않는다.

## 한 고정 open collar와 모든 fixed-order derivatives

source image로부터 infinity-distance가 `1/256` 미만인 동일한 parameter
collar를 선택한다. 여기서 `s∈[1/4,3]`, `|Z|≤2`이면

`s^(2h-1)≤4`, `F_s>1-32h>1/2`.

원본 parameter에서 `F(1/4)<-1/8`, `F(3)>1/2`이다. 두 endpoint에서
`|F_Z|≤12`, `|F_T|=1`이므로 parameter 변화에 따른 value 변화는
`13/256` 이하이다. 남은 부호 margin은 정확히 `19/256`, `115/256`이다.
따라서 collar 전체에서 unique root가 `(1/4,3)`에 존재한다.

`F`는 `s>0`에서 C∞이고 `F_s`가 같은 collar에서 양의 하계를 갖는다.
parameter implicit-function theorem을 적용하면 s는 C∞이다. unique root
조건이 지역 inverse들을 하나로 접합한다. source
`eta=Z*exp(-(1/2-h)*log(s))`도 같은 collar에서 C∞이다.

`s_T=1/F_s`, `s_Z=2Z*s^(2h)/F_s`가 실제 first derivatives다.
고차에는 `F(s(Z,T),Z,T)=0`을 반복 미분하여
`F_s*∂^I s`를 분리한다. 나머지는 elementary F의 미분과 더 낮은 s의
미분의 유한 합이다. 같은 positive denominator로 나누고 induction을
적용한다. 한 compact subcollar에서 매 고정 차수마다 finite uniform
상수를 얻는다. domain을 미분 차수마다 줄이지 않는다. band/label은
동일한 fixed h와 normalized image를 사용하며 정수 label/ceiling은
미분하지 않는다. `eta=±1`, 즉 `T=0`의 원본 endpoint one-sided jets도
이 open collar의 smooth extension에서 얻는다.

## 더 넓은 positive branch에 대한 별도 정리

`a=2h∈(0,1)`이면 `Z∈R`, `T≥0`, `(Z,T)≠(0,0)`에서 unique positive
root가 있다. `T>0`일 때 `s≥T`에서

`H(s)=(s-T)/s^a`, `H'(s)=(1-a)s^-a+a*T*s^(-a-1)>0`.

`H(T)=0`, `H(s)→∞`이므로 `H(s)=Z^2`의 해는 하나다.
`Z=0`이면 `s=T`, 그 외에는 `s>T`다. `T=0,Z≠0`이면
`s=|Z|^(2/(1-2h))`이다. 모든 이 root에서

`F_s=1-2h+2h*T/s≥1-2h>0`.

따라서 interior에서는 C∞이고 `T=0,Z≠0`에서도 지역 smooth extension이
존재한다. 각 compact subset에서 고정 차수별 상수가 유한하다.
이는 원본 image의 같은 branch를 포함하는 분석적 continuation 정리이며,
원본 source operator의 finite bracket을 바꾸거나 image 밖에서 실제
producer를 실행했다는 뜻은 아니다.

## 실제 fixed bump와 적분 미분의 결과

앞 파일에서 실제 source body에 연결한 `eta0`와 세 geometric copy는
모든 radial derivative에서 flat하게 0으로 연장된다. 이제 s의 positive
smooth chart가 같은 domain에서 증명되었으므로

`s^-A*eta_j(R/sqrt(s))`

는 radial/slow variables에 대해 jointly C∞다. source x0는 fixed positive
scale이고 s는 공통 compact collar에서 위아래로 분리되어 있으므로
모든 radial supports는 0에서 떨어진 동일한 bounded interval에 포함된다.
각 fixed derivative order에서 differentiated integrand는 그 compact
radial/slow set에서 bounded다. 따라서 indicator times finite constant가
dominating function이 되어, 각 다섯 실제 moment를 모든 fixed slow order에서
적분 아래로 미분할 수 있다. 이 lemma는 infinite Fourier sum이나 Volterra
series의 교환을 가정하지 않는다.

실제 target `P,Jtheta,Jz`가 곱해진 전체 correction의 C∞에는 그 target들의
smoothness가 추가로 필요하다. complete source의 모든 infinite/implicit
operator, uniform W/M/S bounds, 전체 moments, PDE 잔차는 별도 조건이다.
**원본 slow chart는 존재성·매끄러움까지 해결했지만 N6-01 전체는 미완료다.**

실행:

```text
python research-ide/mathscope-m3/n6-continuation-20261014/analytic_initial_source.py --artifacts ORIGINAL_SIX_ARTIFACT_DIRECTORIES --output RESULT_DIRECTORY
```
