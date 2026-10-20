# 실제 axial density1의 양쪽 접합과 고정 ordinary mixed jet

이 후속 단계는 검증된 head83207d3a80bd564af0c5aed156681ce7a82c22cf의
왼쪽 영 collar에서 이어진다. 대상은 원래 native expression1,
`density117047=choose(X4756,Xminus28814,Xplus28824,0,raw117045,0)`다.
angular expression0의 오른쪽 끝점Xb28826과 바꾸지 않는다.
원래 소스, 수치 상수, 적분 구간, derivativeLimits[128,128], quantifier와
수락 gate는 그대로다. 실행별 결과·원시 로그·해시는 별도 run 보고서에 둔다.

## 오른쪽 영 분기의 정확한 의미

같은 실제 원본 source에서 U0=9236, U1=29289, Pi1=50558의 exterior
영 분기를 추적한다. 기존 소스 부등식은

`Xcut28823<aSquared24805<1<XR<IposRight28988<Xv3293<Xplus28824`

를 준다. 특히 `Xplus=Xv*exp(1)`이며
`IposRight/Xv=exp(-9-13/lambda)<1`이다. U0의 원래 cutoff/C12/I1 분기,
U1의 두 after0 분기, Pi1의 원래 Xplus 이후0 분기를 실제 노드와 함께
보존한다. 임의의 pass flag나 sourceAssertions로 영값을 대신하지 않는다.
caller의 X 부등식을 적분 binder나 native 함수의 내부 인자에 옮기지 않는다.

따라서 X>Xplus에서 U0,U1,Pi1은 같은 실제 영 함수이며 그 국소 ordinary
도함수도0이다. 원래 잔차의 여덟 항을 그대로 유지한다. T와 Z 연산자는
영 함수에0을 주고, 대류 항의 U0/U1 미분도0이다. v0와 v1의 값은 같은
실제 raw 정칙성의 positive compact domain에서 유한함을 사용한다.
정의되지 않은 값에0을 곱하는 식의 추론은 하지 않는다.
물리적 abs(eta)<=1에서 원래 `L=1-2h*eta^2>7/8`도 유지한다.

## 오른쪽 smooth germ

기존 원본 raw 정리는 raw117045가 X>0, -1<eta<1에서 C-infinity이고,
모든 고정 inward eta jet이 eta=+-1로 연속임을 준다. a=Xminus,b=Xplus라
놓으면 `J=((a+b)/2,2*b)`는 b를 포함하는 양의 열린 구간이며 a보다 크다.
J의 b 왼쪽에서는 density=raw다. 오른쪽에서는 원래 density=0이고 위
exterior 정리로 raw=0이다. b의 값도 raw의 연속성으로0이다.
그러므로 **J 전체에서 density와 같은 raw 함수가 일치**한다.
모든 고정 mixed derivative와 원래 inward eta jet이 이어진다.

이 증명에는 b 아래쪽 전체 raw-zero collar나 별도 pressure constant의
소거가 필요하지 않다. 기존 raw의 양방향 정칙성과 바깥쪽 영값을 사용한다.
실제 a,b는 eta와 독립인 같은 source 상수이므로 동일한 J를 물리적 eta
구간 전체에 사용할 수 있다. eta 바깥쪽의 양방향 smooth extension은
이 inward 자료만으로 주장하지 않는다.

## 왼쪽과 축, 고정 미분 적용

왼쪽은 이미 증명한 C=(Xa*exp(t1/256),Xa*exp(3*t1/256))를 소비한다.
C는 a를 엄격히 포함하고 raw 및 모든 고정 mixed raw jet은0이다.
따라서 원래 before0 분기와 접합한다. 두 경계 사이에서는 density=raw,
바깥에서는 원래0이다. 이것으로 X>0 및 eta 내부의 density C-infinity와
모든 고정 inward eta jet 연속성을 합성한다.

a>0이고 X<a에서 원래 density는 literal0이다. 축 근방에서는 이 영
germ으로 X=0의 자연스러운 영 연장을 쓴다. raw,1/X 또는 inverse sqrt를
축에서 평가하지 않는다. 이는 원래 raw의 음수 X 영역을 새로 허용한다는
뜻이 아니다.

각 고정 r,s의 ordinary jet support는[a,b]에 포함된다. a,b는 실제
매개변수의 유한한 양의 상수이고 eta 구간은 compact하므로, 각 고정
mixed derivative의 supremum은 유한하다. 모든 차수에 공통인 bound,
계산된 수치 bound 또는 band/label에 균일한 bound는 주지 않는다.
native1의 원래[0,1] 및[1,1] 요청을 genuine ordinary partial로 해석할 수
있는 정리를 공급하지만, 원래 consumer handler를 자동으로 켜거나
전체26개 요청의 모든 전제가 닫혔다고 선언하지 않는다.

## 첨부 논문과 별도 의무

동일성이 확인된166쪽 첨부 논문의 SHA256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다.
[공식 논문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)
p49의(5.9)에서 dX=R dR인 실제 axial 적분 좌표와 접합 구조를 적용한다.
매끄럽고 compact한 밀도에서도 전방 적분에는 비영 상수가 남을 수 있다.
따라서 totalAxial117075=0, Tz117069의 전방117059/후방117067 동일성은
별도의 총 모멘트·매개변수 미분 교환 증명을 요구한다.

원래 결합 fifth moment의 fluxOmega24744와 전체[0,Xplus] 구간을 유지한다.
각 항을 따로0으로 두거나 왼쪽 국소 결과로[0,Xminus] prefix를 삭제하지
않는다. Ttheta117068과 totalAngular117072는 별도 angular density0의
Xb28826 지원구간을 쓰므로 이번 axial 정리로 대체할 수 없다.

original smooth_piecewise517234의 정확한 Cartesian guard, 실제 리터럴
적분517222 및 finite-face517238→517239→517240의 bounded piecewise
적분성, genuine 응력 도함수와 numerical Bnorm300170 honesty도 별도다.
bounded piecewise 결과를 continuousOnFiniteClosedInterval로 표시하지 않는다.
원본 Guard10/Jet230/PDE1020=1260은OPEN, M3는56/64,
N6-01은OPEN, N6-02는PARTIAL을 유지한다. 새 Lean kernel 실행이나
N6/NS의 보편적 완성을 주장하지 않는다.

독립 검토의 초안 발견 사례와 수정 검증은
[원시 검토 로그](AXIAL_DENSITY_REVIEW_HISTORY.log)에 보존한다.
이는 원본 수학 소스의 실패나 원본 의무 소거와 구분한다.

외부 소스 검사의 첫 실행은19개 중18개가 통과했다. 한 새 음성 대조가
v0/v1의 바깥 영값을 원본 검사기가 얻을 수 없다고 잘못 가정했지만,
실제 v0의 원래 바깥 분기는0이다. [원시 실패 로그](AXIAL_EXTERIOR_ZERO_TESTS_ATTEMPT1_FAILURE.log)를
남기고 원래 세 대상 프로파일과 유한성 전제·범위 보존을 검사하도록
고쳤다. 최종19개 검사는 skip 없이 통과했다. 원본 소스나 수락 gate를
완화하지 않았고, v0/v1의 영값은 이 밀도 합성의 전제로 요구하지 않는다.
