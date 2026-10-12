# N6 원본 계산 연결과 N8 관측 확장

이 문서는 P7을 포함하는 새 M3 작업 단계에서 추가한 Navier 구현을 설명한다. 과거 `M3_REVIEW_KO.md`의 56개 기준 평가와 당시 배포 증거는 변경하지 않는다. 원래 N6/N7/N8의 24개 항목은 각각의 `N6_PROGRESS.json`, `N7_PROGRESS.json`, `N8_PROGRESS.json`에서 원문 그대로 유지한다.

이번 추가분은 **원본 common6에서 실제 실행한 유한 함수식 구성**과 **별도의 유한 Fourier–Galerkin 모형 관측**이다. 전체 보정 반복, 최종 원문해, blowup 정리의 완성을 뜻하지 않는다. 그래프의 정수 node ID는 정확히 정의된 함수식의 주소이며, 그 함수값의 수치 enclosure가 아니다.

## 1. 원본과 실제 실행 범위

원 논문은 166쪽 `navier-stokes.pdf`이며 SHA256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 기준표는 2026-10-12 06:14:19 청사진 PDF의 N6 62쪽, N7 64쪽, N8 66쪽이며 SHA256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`다.

| 원본 | 보존한 식별값 | 이번 구현의 관계 |
|---|---|---|
| M2 common6 | `ac98143158c9e7abc6bd656e687269f183bb803ecdc036edb8a3937edc24bc01` | 동일 생성자를 새로 실행하여 original physical graph와 비교한다. |
| M2 source4 | `88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e` | 기존 수치 실행의 출처를 보존한다. 그 수치 증거를 새로운 보정장의 수치값으로 옮기지 않는다. |
| 파라미터 식 | `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152` | 원래 양의 λ와 h, 지수식, 첫 admissible band와 첫 mesh member를 그대로 쓴다. |
| 프로필 | `same-profile-2026-10-10.3` | M2의 원본 source 파일을 수정하지 않는다. |

새 생성자는 원래 source의 두 부호 파동, 원래 위상·potential, 원래 cutoff/palette, 전체 background stress를 가져온다. λ가 매우 작다는 이유로 λ=0으로 바꾸지 않는다. 실제 수치값 대신 생성된 함수식을 보존하며, 정당화되지 않은 underflow 근사도 사용하지 않는다.

현재 구성은 **한 original band와 mesh member**에 대한 것이다. 모든 label과 band를 합한 상태나 Proposition9.5의 초기 `j=0` 상태가 아니다.

## 2. 새 source 구성

### 전체 curl, 공분산과 현재 P/J

`source-current-state.mjs`는 동일 source 생성자를 실행한 뒤 두 부호의 전체 cylindrical curl을 사용한다. leading wave만 취하지 않고 curl remainder를 남긴다. `rr`, `rθ`, `rz`, `θθ`, `θz`, `zz` 여섯 성분의 angular 평균과 원래 Haar 평균을 각각 구성한다. 같은 label 안의 square/cross 항은 support separation을 이유로 삭제하지 않는다.

현재 mean velocity increment가 0인 해당 상태에서 다음을 실제 source 함수식으로 계산한다.

\[
g_r=-(\partial_R+R^{-1})\overline{W_{rr}}
     -\varepsilon\partial_Z\overline{W_{rz}}
     +R^{-1}\overline{W_{\theta\theta}},\qquad
P=\int g_r\,dR.
\]

\[
J_\theta=\int R^2\overline{W_{\theta z}}\,dR,\qquad
J_z=\int R\overline{W_{zz}}\,dR-\frac12\int R^2g_r\,dR.
\]

원래 mean patch 안의 고정 smooth bump를 전체 radial 적분으로 정규화하여 ρ를 만든다. integration envelope는 해당 원래 band의 전체 source support를 포함하도록 고정하며 R/Z/T에 따라 적분 끝점을 바꾸지 않는다. support, 양의 denominator, FTC 및 미분과 적분의 교환에 관한 source 가정은 기록에 남는다.

### 전체 auxiliary-torus pressure

`source-pressure.mjs`는 원래 radial primitive φ의 이동 `φ(r)−φ(R)`를 사용한다. `f=g_r−ρP`에 대해 원래 보조 torus 좌표를 이동한 적분으로

\[
p=I f-\chi J f,\qquad A_0=\partial_R\chi\,Jf,
\qquad D_rp=f-A_0
\]

를 구성한다. mean zero mode만 복원한 것이 아니라 모든 auxiliary mode가 남은 pressure다. A0를 누락하면 identity 검사가 실패하는 negative control도 포함한다. zero mode에서 `∫(g_r−ρP)=0`인 것은 원래 정의 적분과 선형성으로 따로 확인한다. 그 사실을 전체 auxiliary pressure의 A0=0으로 확대하지 않는다.

원래 compact local body를 먼저 미분한 뒤 torus에 periodize한다. floor 또는 nearest-lift의 불연속을 미분하지 않는다. endpoint 이동의 `φ(R)−φ(R)=0`은 정확 대수 검사와 명시적 expression congruence로 처리한다.

### 두 원본 pulse의 C4/C5 미분계

`source-higher-jets.mjs`는 M2의 그래프를 별도 M3 그래프로 복사한다. 원본 node prefix와 함수 정의를 보존하고, 원래 2×2 pulse matrix M과 datum `(1,0)`에서 유한 고차 변분계를 만든다.

\[
\partial_v w_\alpha
=\sum_{\beta\leq\alpha}
 {\alpha\choose\beta}(\partial^{\alpha-\beta}M)w_\beta.
\]

C5에서는 각 부호마다 56개 multi-index와 112개 scalar component를 쓴다. matrix coefficient와 그 실제 pulse-time derivative의 FTC body를 생성한다. time ordering과 비가환 행렬곱을 보존한다. 유한 ordered-integral 합에는

\[
I\,e^{KL}\frac{(KL)^{N+1}}{(N+1)!}
\]

tail을 남기며, 유한 합을 원래 Volterra 해와 동일시하지 않는다. 이는 선택한 chart에서의 C5 함수식 생성이며 모든 차수의 global class constant를 제공하지 않는다. auxiliary Fourier inverse에 필요한 `C^(m+4)` tail bound와도 별개의 의무다.

공유 함수는 정의 파라미터에서 실제 미분 body를 한 번 생성하고, 각 호출의 전체 실제 인자와 capture-free simultaneous substitution을 남긴다. 원래 body를 caller coefficient나 oracle로 바꾸지 않는다. 이 표현은 같은 큰 적분식을 매 호출마다 복제하여 노드 예산을 소모하던 문제를 줄인다. 결합된 인자 치환과 움직이는 적분 끝점의 독립 회귀검사가 이 규칙을 확인한다.

### 실제 현재 signed stress

`source-signed-stress.mjs`는 caller가 입력한 generic target 대신 현재 `Eθ, Ez, P, Jθ, Jz`에서 Corollary8.5의 target을 만든다. 가중 radial inverse와

\[
\sigma_\theta=\rho/R^2,\quad \sigma_z=\rho/R,
\quad \varepsilon\partial_ZJ_\theta,
\quad \varepsilon\partial_Z(J_z+c_\rho P)
\]

를 함께 보존한다. 마지막 항의 `cρP` 전체 곱을 미분한다. pressure source의 zero integral은 원래 gr 및 bump의 정의 적분을 대조한 뒤 선형성과 radial-independent factor를 이용하여 유도한다.

원래 positive amplitude와 H를 고정한 채 `δa=H⁻¹(Σ/ε)/(2a)`를 적용한다. signed Σ에 새 square root를 취하지 않는다. 실제 potential의 full curl과 이전 curl 보정의 interaction, 새 curl remainder의 interaction, 새 increment의 square를 남긴다. 새 여섯 mean covariance와 P/J, 새 mean pressure 및 Eθ/Ez를 다시 계산한다.

한 mesh member의 principal bilinear identity에는 원래 partition의 `ηβ²Σ`가 남는다. 이를 전체 `Σ`로 바꾸는 데 필요한 전체 label 합은 아직 없다. 업데이트 뒤 **전체 auxiliary pressure와 독립 complete physical PDE jet 비교**도 남아 있다. 이 유한 signed update를 초기화된 한 완전 iteration으로 부르지 않는다.

## 3. N8의 실제 유한 관측

새 `N8-flow` 예제는 `parameters.observation`에서 seeds, steps, angularOrigin, coreBounds, coreGrid를 받는다. 이 설정은 solver 실행 전에 검증하고 integrator 입력과 분리하되, 원래 전체 입력 hash에는 포함한다.

| 관측 | 실제 계산 | 명시적 한계 |
|---|---|---|
| 속도 | 실제 유한 Fourier 계수의 81개 고정 위치 값 | continuum의 생략 mode 오차를 인증하지 않는다. |
| 각속도 | 지정 origin/x3 축에 대한 `(x u_y−y u_x)/r²` | vorticity가 아니다. 축에서는 null/UNDEFINED이며 0으로 대신하지 않는다. |
| instantaneous streamline | 최종 시각의 계수를 고정한 RK4 적분 | parameter를 실제 시간 궤적으로 부르지 않는다. |
| particle path | 실제 accepted coefficient history를 시간에 따라 선형 보간한 RK4 적분 | state decimation과 최대 시간 간격, 비엄밀 refinement 오차를 남긴다. |
| global energy | `(2π)^3`을 곱한 Parseval 전체 영역 적분 | 공간평균, core 적분 및 논문의 compact K 에너지와 구별한다. |
| core energy | 사용자가 정한 고정 Cartesian box의 두 midpoint grid 적분 | coarse/fine 차이는 rigorous enclosure가 아니다. |

물리 영역은 `[0,2π]^3`으로 고정한다. 정규화 view는 위치와 속도에 함께 `1/(2π)`를 적용하는 **periodic box 좌표**다. 원문해의 q-based normalized coordinates로 표시하지 않는다. vector scale은 0.3이며 자동 vector 정규화나 공간 fit을 하지 않는다. periodic seam에서는 unwrapped path를 보존하여 잘못된 긴 선분으로 연결하지 않도록 한다.

`observations.claims`에는 위 여섯 관측의 원문 reference, numerical test 파일, 현재 유한 run check, analytic certificate, Lean theorem을 분리한다. 현재 analytic certificate와 Lean theorem은 null이고 certified approximation은 false다. 각각의 sample/path/energy row는 claim ID로 이 장부와 연결되며 전체 run/input hash를 보존한다. 잘못 추가된 analytic certificate나 변경된 path/설정은 fresh replay가 거절한다.

## 4. 실행 증거와 재생 의미

최종 실행 판정과 정확한 artifact/source SHA는 `evidence/source-current-20261012/source-current-execution.json`을 따른다. 이 receipt에는 실제 Node 명령, exit code, raw log, 전체 검사 수, 관측한 최대 RSS, 실행 전 dependency capture와 계산 artifact의 원래 path/hash를 둔다. 구현 hash를 새로 만들기 전에 captured source bytes를 다시 대조한다.

attempt5는 실제 exit0, **7/7 PASS**, 897.813초로 완료됐다. 진행 로그에서 관측한 최대 RSS는 6,394,392,576 bytes다. 이는 OS의 전체 peak memory를 측정한 값은 아니다. 실행 전 capture의 source 108개를 종료 뒤 다시 비교하여 모두 일치했다. 최종 signed graph는 2,159,014 nodes이며 두 부호 각각 1,380개 공유 미분 body와 실제 인자를 연결했다. `source-current-execution.json`의 SHA256은 `3c24c84c3356b458d4866cf2008047ff809dfb0a51524caed1044c5c73334b21`이다.

| 실제 artifact | SHA256 | graph nodes |
|---|---|---:|
| current-state.json | `361d4f2a1b3ef30a26e84d96bd7c28cd1e29b8a36418dbf78c9ed3f0459d6af2` | 720,902 |
| full-pressure.json | `2f149bc253668282684879d561338247c0d2dcf805a98c7c1a6c599f8fc100b4` | 741,181 |
| higher-pulse-jets.json | `4e6865ff830dd3369fbd7b0cb314c4e45c0cc49ee5247be2e8ec7de73cd71917` | 1,226,517 |
| current-signed-stress.json | `8cf28b1e96dd0f0964ea8cf9bc9556c3bf945cc1cc998bc81103b34e063c106a` | 2,159,014 |

과거 `attempt1.log`, `attempt2.log`, `attempt3.log`, `attempt4.log`는 변경하지 않는다. attempt4에서는 pressure/C5 등 6개 검사가 통과했으나 signed curl의 호출별 미분식 복제 중 4,000,000 node 예산을 넘었다. 그 실행의 실패와 source byte capture, 당시 세 성공 artifact를 보존한다. 후속 시도가 통과하더라도 실패 이력을 성공으로 바꾸지 않는다.

브라우저의 `N6-source-reconstruction`은 **저장된 실제 실행 자료 · 출처 검증** 모드다. `recordedOnly:true`, `freshSourceConstructorExecuted:false`를 반환한다. 조회와 replay는 이 summary와 입력/결과/source hash를 재계산한다. 수 GB를 사용하는 원래 source constructor를 브라우저에서 다시 실행하지 않는다.

빠른 회귀검사와 빌드 검사는 원본 생성자의 실제 실행과 별도다.

빠른 회귀검사는 실제 **18/18 PASS**다. raw log와 검사 파일 및 현재 12개 구현 pin을 묶은 `evidence/source-current-20261012/fast-execution.json`의 SHA256은 `1246089e8c9ce0827a6854916cbc2d87f38324d3fcb1601a51e4523aabfd1c9b`다. 구현 pin의 aggregate SHA256은 `e6beb98e1f23b42b84f927a32ca56df02d6fa05695b61510fb1fceec4873628e`이며, source summary의 바이트 검증도 exit0로 통과했다.

```sh
node --test research-ide/mathscope-m3/navier/tests/flow-interface.test.mjs research-ide/mathscope-m3/navier/tests/flow-observations.test.mjs research-ide/mathscope-m3/navier/tests/source-pressure-calculus.test.mjs research-ide/mathscope-m3/navier/tests/source-parametric-body.test.mjs research-ide/mathscope-m3/navier/tests/source-current-summary.test.mjs
python research-ide/mathscope-m3/navier/tests/build-source-current-evidence.py --check
```

무거운 source 생성 명령은 receipt의 `gate.command`를 그대로 사용한다. Node heap 예산은 8192 MiB다. 새 source 파일을 수정한 뒤 과거 실행 receipt가 자동으로 새 source를 인증하도록 해서는 안 된다. summary builder는 capture/artifact의 모든 바이트가 실제 저장값과 일치하는지를 확인한다.

## 5. 남아 있는 원래 요구사항

N6에서는 전체 bands/labels, 실제 temporal update와 다섯 moment 보정, Proposition9.5의 `B0=0.7`, `C0*=1.2`, 전체 substep 뒤 full pressure/PDE residual, 같은 qbig의 차수별 class constants, 최종 shrinking-cutoff sum과 Lemma5.4 tail이 남는다. 이번 실제 source 연결은 이 의존성을 줄였지만 없애지 않았다.

N7의 실제 localization, 전체 compact K의 energy/force, terminal force jets, 모든 차수 force extension, 원래 blowup 경로의 양의 e0 및 explicit remainder는 N6의 최종 field에 의존한다. 현재 generic cutoff·force·periodization 관문이 그 최종 source를 대신하지 않는다.

N8에는 별도의 유한 periodic branch가 있다. 실제 원문 near-terminal velocity, original normalized scaling에 결속된 precision mode, grid/Fourier/coefficient/arithmetic의 독립 refinement와 rigorous source tails는 남는다. 새 관측 코드의 실제 공개 UI 확인도 원문 기준의 완료 승격 전에 필요하다. 일부 그림이나 유한 수치검사만으로 이 의무들을 완료 처리하지 않는다.
