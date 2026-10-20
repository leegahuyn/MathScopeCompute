# 실제 Picard0의 미분 손실 구조와 국소 수렴

원본은 `picard:0`, `ActualSameN3OrderOneInner`이며 defining registry SHA-256은 `c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60`이다. 인증된 전체 원본에서 추출한 실제 A0/A1/forcing의 ordinary 의존 노드는 3,679개다. 이 목록은 기존 Picard PR #31의 원래 계수 핵심과 일치한다. 새 검사는 그 원래 정의를 사용하며 generic fixture로 대체하지 않는다.

실제 singular diagonal은 c=(0,0,2,0,3,1)이고 모든 성분이 비음수다. 원래 적분 연산자는

`(Gf)_i(x)=x integral_0^1 t^(c_i) f_i(tx) dt`

이다. A1과 모든 η 도함수는 앞의 네 좌표에서 뒤의 두 좌표로만 사상하며 뒤의 두 좌표에서는 0이다. 이 사실은 실제 원본 행렬의 정확한 zero/nonzero 위치로 확인했다. η와 독립인 diagonal 적분 weight는 그 지지 패턴을 바꾸지 않는다. 따라서 T1=G A1 partial_η에 대해 T1T1=0이다. ∂η가 다음 A1에 작용한 항도 같은 위치 패턴으로 0이다. T0=G A0와 T1의 길이 k인 살아 있는 word에는 T1이 최대 ceil(k/2)개다. 유한 길이 검사만으로 모든 k를 주장하는 것이 아니라, 연속된 T1이 불가능하다는 위치 불변식이 모든 길이의 증명이다.

실제 계수에 있는 smooth-step 31개는 모두 η coordinate2와 독립이다. 적분 binder는 본문에서만 제거하고 끝점의 의존성은 보존하여 검사했다. 따라서 smooth-step 자체를 그 인자의 복소 함수로 연장할 필요는 없다. 이 사실이 나머지 자연급수·역원·적분의 복소 정의역까지 증명하는 것은 아니다.

다음 국소 수렴 정리는 실제 구조에 적용 가능한 충분 조건을 줄인다. A0,A1,f가 [0,a]와 하나의 η complex tube에서 유계이고 η에 대해 holomorphic이며 x에 대해 모든 유한 차수로 매끄럽다고 하자. x 미분은 holomorphic-function-valued norm에서도 연속이라고 하자. 공통 작은 tube까지의 여유를 Δ>0, 행렬과 forcing의 공통 상계를 C>=1로 둔다.

각 word의 q<=ceil(k/2)개 η 미분에 각각 Δ/q의 여유를 배분한다. Cauchy estimate는 미분 하나마다 q/Δ를 준다. 비음수 diagonal 때문에 real radial integration weight의 크기는 1 이하이고, k+1개의 ordered radial 적분은 a^(k+1)/(k+1)!를 준다. word 수를 2^k로 상계하면

`||T^k Gf|| <= 2^k C^(k+1) a^(k+1)/(k+1)! * max(1,q/Δ)^q`.

q가 k/2 이하이므로 Stirling 하계 또는 n!>=(n/e)^n에 의해 이 급수의 항은 결국 `(constant/sqrt(k+1))^(k+1)` 이하가 된다. 따라서 임의의 고정 유한 a,C에 대해 정상 수렴하며, a가 작다는 가정이나 거대한 원본 truncation index를 실제 물질화할 필요가 없다. η의 고정 유한 차수 미분은 더 작은 tube에서 Cauchy estimate를 한 번 더 적용하면 된다.

x의 p차 미분은 원래 rescaled integral 표현을 p번 미분하여 처리한다. p는 고정되고, 각 항의 계수에 미분이 분배되는 방법은 k의 다항식 개수다. 모든 p차 이하 x 미분 계수의 공통 상계 C_p를 사용하면 위 subfactorial 감소에 고정 다항식만 더해진다. k<p인 유한 개 항은 원래 rescaled compact integral에서 직접 매끄럽다. 따라서 x와 η의 모든 고정 유한 차수 mixed derivative도 정상 수렴한다. 원래 native Picard partial sums와 같은 반복식을 합하므로 별도 함수를 발명하지 않는다.

이 정리는 실제 계수의 자연급수 노름·인자 범위·Φ 비영성·적분의 공동 complex tube를 증명해야만 원본에 적용할 수 있다. 새 checker는 그 가정을 true로 만들지 않는다. 현재 원본 Guard/Jet/PDE 신규 소거는 모두 0으로 유지한다. `actual_picard_structure.py`는 실제 위치 불변식, cutoff의 η 독립성, 미지 연산 거부, 위치 변조 및 η 의존 cutoff 탐지 등 6개 대조를 재현한다.
