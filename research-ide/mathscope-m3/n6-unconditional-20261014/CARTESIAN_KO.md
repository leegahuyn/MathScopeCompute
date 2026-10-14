# 원본 Cartesian jet·좌표 지도 후속 검증

이 개발은 **N6-02 무조건부 인증을 완료하지 않는다.** 원본 전체장에 대한 Cartesian 미분 요청 393개 중 28개의 정확한 규칙을 실제 계산에 연결한다. 나머지는 365개이며, 원래 정의역 의무 94개와 비교 분자 1,020항을 모두 보존한다. 단순한 테스트 성공이나 고정 label에서의 좌표 지도 일치를 전체 PDE의 증명으로 올리지 않는다.

## 정확한 원본과 재사용 범위

대상은 source graph SHA-256 `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f`의 속도 `3825006/3825007/3825008`, 압력 `3825009`, direct residual `3825257/3825259/3825261`, assembled residual `3825348/3825349/3825350`이다. 3,892,594-node producer를 다시 생성하지 않는다. 기존 cloud run `38500114302`의 8개 PDE 파일을 저장소의 원래 byte 수·SHA manifest와 대조한 뒤, 실제 source witness·정의 registry·독립 Cartesian scalar program을 읽는다. 함께 병합한 159,654개 source witness에 전체 그래프 권한이나 수학적 정확성을 새로 부여하지 않는다.

`cartesian_run.py`는 기존 정확 유리수 replay도 실행한다. `sqrt_positive(2)^2=2`로 얻은 `[169,197,654]`항은 그대로이며 새 임의 원자 동치나 미계산 미분값의 치환은 추가하지 않는다. `rational/`에 모든 원래 항·남은 항·분모·수정 로그를 저장한다.

## 실제로 닫힌 28개 요청

23개는 기존 독립 scalar program의 `ceiling` node 40에 대한 1차·2차 미분 요청이다. 그 인자의 **완전한 primitive dependency**는 원래 h와 frozen integer band `N1=622791`에만 의존한다. Cartesian 미분 변수 `R=622802, Z=622803, T=622804, theta=622806, Y0=635044, Y1=635045`에는 의존하지 않는다. h와 band를 고정하면 ceiling 값은 상수이므로 이 변수에 대한 모든 요청 미분이 정확히 0이다. ceiling의 인자에 대한 미분을 0이라고 주장하지 않는다. 인자가 integer 경계를 지나는 경우에도 fixed parameter 함수라는 사실은 같다. 실제 인자의 유한한 정의 가능성은 source parameter domain에 속한다.

5개는 원래 slow inverse `622820`, registry `monotone:2`에 대한 요청이다. 저장된 실제 body `622819`가

\[
F(s;Z,T)=s-Z^2\exp(2h\log s)-T
\]

임을 node별로 검증한다. 원본 이미지

\[
(Z,T)=(s_0^{1/2-h}\eta,s_0(1-\eta^2)),\quad 1/2\le s_0\le2,\quad |\eta|\le1
\]

에서 `F(s0;Z,T)=0`이며, 실제 source h에 대해 `0<h<1/64`이다. 원래 bracket에서 `F_s>1-8h>7/8`이다. 원본 전체 이미지의 `1/256` collar, `1/4<s<3`, `|Z|<2`에는 `F_s>1-32h>1/2`가 성립한다. 양 끝점 perturbation `13/256` 뒤의 margin은 정확히 `19/256`, `115/256`이다. source-pinned header와 SQLite prefix를 다시 열어 실제 h 및 이 공통 collar 증명을 재실행하고, Fraction 산술로 위 margin을 별도 계산한다.

같은 collar에서 implicit-function theorem과 유일성으로 매끄러운 단일 원래 branch를 얻으므로

\[
s_Z={2Zs^{2h}\over1-2hZ^2s^{2h-1}},\qquad s_T={1\over1-2hZ^2s^{2h-1}}
\]

이다. 실제 남은 요청 5개 중 `Z` 요청 하나에는 첫 공식을 적용하고 `R,Y0,Y1,theta` 요청 네 개는 0이다. 후자의 변수는 이 실제 implicit body와 actual input tuple에 들어 있지 않는다. **모든 global PDE application이 이 이미지/collar에 있다는 전역 guard는 이 leaf lemma만으로 해소되지 않는다.** 따라서 정확한 leaf closure와 원본 전체장의 정의역 인증은 분리한다.

`cartesian-applied-pde-checkpoint.json`은 위 28개 규칙을 원래 독립 Cartesian scalar program에 실제 적용한다. Cartesian 속도, divergence, time/spatial/laplacian/pressure jets, advective·conservative 세 성분과 역회전 결과를 새 scalar IDs로 저장한다. 나머지 원래 unresolved source jet는 모두 유지한다. 원래 94개 domain guard도 유지한다. 결과가 0인 PDE라고 선언하지 않는다.

## 모든 1,134개 row의 조건부 실제 좌표 지도 검증

`fieldDefinitions:6/7/8/9`는 원래 initial angular 속도 3개와 압력이다. `definitions:1:0/1/2`는 initialized angular **residual** 3개이다. 각 definition의 162개 row를 빠짐없이 확인하여 7×162=1,134개 row의 `localBody`와 `localParameters`가 해당 실제 registry와 일치함을 검사한다.

독립 primitive 미분기로 row의 실제 application argument를 원래 global directions에 대해 미분하고, 저장된 Jacobian의 source coefficients와 정확한 유리수 polynomial로 비교한다. row에 기록된 physical label·grid 및 해당 primitive expression에서 발견한 원래 nearest-copy ceiling 선택값을 **고정한 cell 내부에서만** 상수로 취급한다. 이는 원본 producer가 명시한 fixed label/nearest copy differentiation의 전제를 그대로 기록한 국소 검사다. changing-label 경계나 nearest-copy 경계를 넘어 전체 field가 매끄럽다는 결론은 넣지 않는다.

첫 unrestricted 시도에서는 원래 implicit-selected labels, ceiling, guarded selector의 미분이 명시적인 STOP로 남았다. 그 전체 numerator·미분 STOP·로그를 `cartesian-pre-cell/` 증거에 보존한다. 후속 fixed-cell 검사에서 서로 다른 324개 chart, 25,272개 Jacobian 비교가 정확히 일치하고, 1,134개 row의 coefficient가 그 같은 cell directions에서 상수임을 별도로 검증한다. 이 국소 전제 아래 opaque derivative STOP는 0개다. source selector 값을 바꾸거나 원래 function value를 단순한 임의 원자로 대체하지 않는다.

2차 derivative-word expansion API는 먼저 **actual source coefficient들의 모든 관련 directional derivatives가 정확히 0임을 계산으로 확인**해야 한다. 이 확인 없이 constant-chart 확장을 호출하면 거절한다. 예를 들어 `t=x²`의 coefficient `2x`를 상수처럼 사용하면 2차 미분의 `2 f_t` 항을 빠뜨리므로 negative control로 거절한다. 국소 coefficient constancy 검사 역시 global joins를 증명하는 권한이 아니다.

아직 필요한 최소 lemma는 같은 actual cover의 모든 changing-label·nearest-copy 경계에서 compact local body가 요구된 모든 미분차수까지 flat하게 접합하고, 모든 누락 label이 locally zero이며, cross-label nonlinear products가 원래 domain 전체에서 사라진다는 것이다. 이 lemma와 actual local body의 limit·미분 전제를 증명하기 전에는 1,134개 국소 Jacobian 일치를 global indexed derivative closure로 사용할 수 없다.

## stage 조사와 남은 node

`3825003/3825004/3825005`가 direct velocity의 leaf에 없는 점을 조사했다. 실제 registry 이름은 `ActualAll162InitializedAngularResidual_0/1/2`이다. 이들은 누락된 velocity update가 아니다. `initialized-angular-construction.json` schema는 `GlobalActualInitializedAngular/1`이며 `forcedInverseApplied=false`이다. direct 경로는 초기 angular+갱신 mean을, assembled 경로는 그 같은 단계의 reference mean residual+162 angular residual 합계를 선언한다. 이 구조만으로 stage mismatch나 수학적 반례를 주장할 근거는 없다. 두 경로의 전체 동치는 여전히 미증명이다.

365개 미계산 요청은 다음 actual bases에 남는다. 압력 관련 이전 `definitionKey=null` 3건은 실제 registry로 수리한다.

| 실제 base | actual registry | 요청 수 |
|---|---|---:|
| 622932, 622933, 622934 | expression:688/689/690 | 각 23 |
| 622935 | expression:691 (`M3GlobalBandSlow_pressure`) | 5 |
| 1696799 | inverseDefinitions:0 | 23 |
| 1706770, 1706771, 1706774, 1706775, 1706776 | expressionDefinitions:12 | 각 23 |
| 3614767, 3614771, 3614789 | expressionDefinitions:18/19/20 | 각 23 |
| 3615055 | expressionDefinitions:23 | 5 |
| 3615202 | expressionDefinitions:21 (`GlobalInitializationAfterFiveMoments_complete_gr`) | 5 |
| 3676894, 3676895, 3676896 | fieldDefinitions:6/7/8 | 각 23 |
| 3676897 | fieldDefinitions:9 (`OriginalAll81InitialAngular_pressure`) | 5 |

94개 원래 guard는 positive argument 19개, nonzero argument 22개, integral Leibniz 40개, step jet 6개, flat join 2개, opaque substitution 5개이다. 이번 full field audit로 해소한 global guard는 0개다. actual Fourier inverse·natural/Picard/Volterra·모멘트 target의 존재 및 같은 source argument neighborhood에서의 C²/tail 교환, 전역 cover 접합, 원래 W/M/S 모든 고정차수 bound와 full Cartesian PDE가 남는다.

## 검증과 판정

13개 독립 controls는 varying ceiling, hidden opaque capture, integral binder/endpoint scope, wrong Jacobian, opaque derivative를 0으로 치환하려는 경우, variable chart coefficient의 Leibniz 누락, 불완전 162-row cover 및 applied PDE에서의 unknown jet 보존을 점검한다. 이 controls의 성공은 위 제한된 실제 규칙의 implementation 검증이다. 전체 수학적 인증의 대용으로 쓰지 않는다.

최종 machine-readable 결과는 `cartesian-closure-result.json`, 모든 국소 비교와 exact failures는 `cartesian-closure-core.json`, 실제 닫힌 scalar PDE는 `cartesian-applied-pde-checkpoint.json`, 원래/남은 rational terms는 `rational/`, 전체 입력 checkpoint는 `checkpoints/`, 실행 SHA·시간·로그는 별도 receipt 파일에 저장한다. baseline commit·implementation commit·reused PDE artifact commit을 서로 구분한다. **N6-01 OPEN, N6-02 PARTIAL, 원래 M3 56/64는 그대로 둔다.**
