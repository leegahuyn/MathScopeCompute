# 원래 velocity/potential 계열의 all-order tail 독립 검토

검토자: root. 2026-10-11. 작성 agent와 별도로 모듈 본체, 원래 cutoff
weight 생산자, 실행 process 및 실제 certificate를 읽었다. 이 검토는 같은
폴더의 이미 봉인된 `validation.json`에 덧붙이는 독립 검토이며, 그 기존
packet의 바이트를 수정하지 않는다.

검토 source `actual-velocity-all-order-tail.mjs`의 SHA256은
`275000b0e3ce22a16a17855fb41fabc1c75e350ba4a2c0973f72920cfe168f08`이다.
source 실행 당시 38개 import(새 모듈 1개와 기존 의존 37개)를 현재 바이트와
다시 대조했고 전부 일치했다. process exit0, 26.243071613초,
최대 RSS 2,291,625,984 bytes와 TAP 7/7 PASS를 확인했다.
선택된 실제 graph SHA256은
`2d1288a9f408c95dadc2033ac2362840a2f1597493e3e90b57772ac1daa7357a`이다.

## 검토한 수학 연결

1. 원래 양의 차수 M_X=U와 regular core average가 `M/X`의 축 근처 정의를
   공급한다. 따라서 실제 Cartesian profile을 만드는 과정에서 축의 0/0을
   수치 평가하거나 임의의 상수로 대체하지 않는다. compact mass의 마지막
   0 branch는 원래 mass moment의 정확한 상쇄를 사용한다.
2. 두 potential 성분, 두 angular 성분, 두 radial 성분, 두 cutoff stream
   보정 성분, axial 성분을 모두 확인했다. potential의 기본 q 손실 h,
   angular/axial의 A, radial/extra의 1/2를 각각 유지한다. `sigma*chi'`
   항을 버리지 않았고 원래 time cutoff의 exp(-1/t) seed를 사용한다.
3. 원래 cutoff weight는 `(q d_q)^e(q^(2nh) chi(a_n q))`의 모든 binomial
   항을 포함한다. extra term에서는 cutoff의 Euler 미분 차수가 하나 더
   높다. n과 양수 h는 원래 값이며 n h를 0으로 놓지 않는다.
4. 물리 미분의 q 지수 손실은 각 공간 방향에서 1/2 또는 D, 시간 방향에서
   1이다. source에서 0<D<1/2이고 길이 j의 word 손실은 j 이하이다.
   다음 Euler 계수의 크기를 baseLoss+j로 감싸는 positive calculus는
   이 서로 다른 word를 모두 포함한다. profile 혼합 미분의 모든 Leibniz
   계수와 좌표/1/L 미분도 포함되어 있다. 따라서 2A+m이라는 공통 손실은
   n과 독립이고, 실제 계수의 n 의존성은 B_(n,m) 안에 남는다.
5. Cartesian box는 y1,y2 각각 +/-sqrt(2Xb)이므로 X는 2Xb까지 간다.
   원래 양의 차수 profile의 support가 그 안에 있고, 축과 mass-closed
   바깥 branch의 매끄러움을 사용하므로 직사각형 FTC의 여덟 face를 쓸 수
   있다. |eta|<=1에서 반지름 1/2 복소 원판과 원래 h<1/16은
   |1-2h z²|>1/2를 주므로 1/L의 Cauchy bound도 충분하다.
6. 각 n에서 m<=n의 실제 유한 B_(n,m)를 모두 넣어
   `log a_n >= (n log2 + log B_(n,m))/(n h)`로 정한다. 기존 c_n와
   `2 a_(n-1)`도 하한으로 유지한다. cutoff support에서는
   `B_(n,m) q^(n h)<=2^-n`이고, n>J>=m의 합은
   `2^-J q^((J+1)h-(2A+m))` 이하이다. 실제 h>0이므로 고정 목표 지수마다
   충분히 큰 유한 J가 존재한다. 그 J를 작게 근사하거나 실제로 계산했다고
   말하지 않는다.
7. 원래 uncut finite truncation과의 차이를 tail로 해석하려면 추가로
   `q<1/(2a_J)`가 필요하다. 이 조건을 결과에서 명시했고, 새 sequence를
   과거 runtime의 sequence와 동일시하지 않는다.

현재 한정된 velocity/potential 명제에서 추가 수학 오류를 찾지 못했다.
다만 all-order 결론은 명시된 source smoothness·FTC·대각 선택에 대한 수학적
논증이다. 실제 실행한 것은 n=1,m=1 및 n=2,m=2의 source prefix이다.
generic 17차 Leibniz 확인을 전체 actual source 17차 계산으로 확대하지 않는다.

## 완료 범위

새 selector는 실제 18개 positive source 항과 6개 합 root에 적용되었다.
이는 양의 차수 **유한 prefix**이며 원래 leading field나 미구성된 무한 나머지를
0으로 선언한 전체 장이 아니다. 원래 source norm의 transcendental 값을
수치 평가한 결과도 아니다. 압력, stress, NS 잔차의 전체 flatness, 실제
물리 curl 전체 검증, 새 Lean kernel 인스턴스와 M3 진입은 여기서 완료하지 않는다.
파일 해시와 software PASS를 그 증명으로 대체하지 않았다.
