# 원본 자연급수의 노름 연결: 실제 확인과 남은 전제

앞선 클라우드 계산은 원본의 12개 유한 clock 구간과 양쪽 무한 tail,
정규화 상수를 모두 확인하여 **원본 P0와 g 함수의 일치**를 증명했다.
새 검사는 그 인증서와 source-node 증거의 해시를 다시 확인하고,
독립적인 미분기로 P0의 eta 미분을 계산하여 원본 Zstar 식과 정확히 비교한다.
원본 미분 helper의 출력을 독립 미분의 입력으로 사용하지 않는다.
각 유한 적분은 동일한 방향과 끝점 및 lexical binder를 보존하며,
eta에 의존하는 끝점은 별도 증명 없이 처리하지 않는다.

실제 고정 계수 A,D,d,L,Ustar,Hstar,Wstar,chi,zeta의 식도 원본 노드와
정확 유리식 산술로 비교한다. B.14/B.15의 두 다항식 전개는 서로 다른
정확 정수 verifier와 부호/압력 Euler 계수 변조 검사를 거친다.
이 계산들이 통과해도 원본 전체 natural-series interpreter가 선택된 Banach
고정점의 모든 계수 및 그 eta 미분과 같다는 결론이 자동으로 따라오지는 않는다.
그 연결과 Lean 정리의 전체 가정/커널 인증서 적용을 별도 의무로 남긴다.

다음 전차수 추정은 **실제 계수의 B_rho 노름이 Q 이하라는 전제 아래** 증명된다.

`|∂eta^m c_n| <= Q rho^-m m!/(m+1)^2 binom(n+m,m)/(20^n(n+1)^2)`

이면 모든 정수 k,m>=0 및 R<20에 대하여

`|∂Y^k ∂eta^m f| <= Q rho^-m (m+k)! / ((m+1)^2 20^k) (1-R/20)^(-m-k-1)`.

이는 `(1-r)^(-m-1)`의 이항급수를 k번 미분하고 양의 계수에서
`(n+1)^-2<=1`만 사용한 정확한 추정이다. 모든 고정 k,m에 대한
균등 절대수렴을 주므로 해당 정의역 내부에서 항별 미분이 정당화된다.
유한 차수 계산이나 수치 표본으로 전차수 상계를 대신하지 않는다.

현재 출력은 `nativeB_rhoNormBoundProved=false`,
`nativePhiGlobalPositiveProved=false`, `allActualCallDomainsProved=false`를 유지한다.
전체 원본 인수의 공통 eta 구간/복소 strip 및 radial disk 상이 증명되지 않았으며,
N6-01 OPEN, N6-02 PARTIAL 및 기존 56/64 판정도 유지한다.
