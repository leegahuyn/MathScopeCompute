# 원본 j=0 및 전체 Cartesian residual: 실행·해석 증거의 경계

2026-10-14. **N6-01 source j=0와 N6-02 전체 physical PDE는 OPEN이다.** 이 분석은 새 `initial_residual.py`의 출력 범위를 정한다. 원본 155개 producer, 공개 사이트, main, original 56/64와 이전 판정을 변경하지 않는다.

## 원본 최신 상태는 무엇인가

원본 `initialized-mean-construction.json`의 SHA-256은 `22c878e7ace454c61f00c9ee4952738f7f9fa7b1c269eca538ca224dd8fcb96b`이다. source sequence는 primary current pressure → temporal (8.20) → post-temporal pressure (8.12) → **새 P/J**를 사용하는 five moments (8.25) → post-moment pressure (8.12)다. 속도나 압력이 바뀐 뒤 이전 defect를 재사용하는 경로가 아니다.

| 상태 | beta / v / gamma | 최신 mean pressure | 실제 A0 |
|---|---|---|---|
| temporal 뒤 | 1706773 / 1706624 / 1706782 | 3614634 | 3614635 |
| five moments 뒤 | 3614790 / 3614791 / 3614792 | 3615361 | 3615362 |

논문 p106 Definition9.4 및 pp106–107 Prop9.5가 요구하는 j=0는 이 연산 순서를 갖는 것에 더해 (9.8), (9.9), (9.10), support/divergence/common-domain 조건을 모두 만족해야 한다. 원본 source mean 및 angular certificate의 `initializedJ0`와 `originalProp9_5ClassBoundsEstablished`는 모두 false다. 저장된 zero moment나 클래스 이름을 새 인증으로 바꾸지 않는다.

## 완전한 필드와 source residual

`initialized-angular-construction.json`의 SHA-256은 `ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14`이다. 실제 마지막 full field는 mean + 완전한 wave sum이며 pressure는 base + 최신 mean pressure + primary nonzero angular pressure다.

| 실제 의미 | source roots |
|---|---|
| 세 full cylindrical velocity components | 3825006 / 3825007 / 3825008 |
| full pressure | 3825009 |
| direct advective residual | 3825229 / 3825242 / 3825255 |
| direct conservative residual | 3825257 / 3825259 / 3825261 |
| full divergence | 3825024 |
| assembled complete residual | 3825348 / 3825349 / 3825350 |

이 roots는 mean-only 3,615,866 노드 prefix를 넘어선다. 새 script는 **3,892,594 노드의 실제 full parent stream 전체**를 검증하며, root/geometry 소수 노드만 보관한다. parent node SHA-256은 `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f`다. 각 gzip part/전체 raw bytes/노드 stream hash와 155개 current/captured producer bytes를 확인한다. 새로운 private live producer seal은 만들지 않는다.

Direct와 assembled root ID가 다른 것은 algebraic nonmatch의 증거가 아니다. 새 script는 각각의 실제 body/hash를 보존하지만 그 source-body 차이를 독립적으로 0으로 줄이지 않았다면 `algebraicEqualityIndependentlyVerified=false`로 출력한다.

## 3차원 Cartesian identity에서 확인하는 것

물리 좌표에서 각 `i=0,1,2` 성분에 대해

`R_i(u,p)=dt(u_i)-sum_j d_jj(u_i)+d_i(p)+sum_j u_j*d_j(u_i)`

를 독립적인 exact Fraction jet polynomial로 전개한다. `R(u+du,p+dp)`와 `R(u,p)+Lu(du,dp)+(du dot grad)du`의 차이는 세 성분 모두 정확히 0이다. 세 공간 방향의 quadratic/self term, 두 mixed transport term, 최신 pressure increment를 빼는 negative control은 각각 비영 다항식을 남긴다.

이 항등식은 전체 Cartesian residual의 올바른 대수식이다. 실제 원본 field의 derivative jet을 계산하거나 수치 enclosure를 만든 것은 아니다. 새로운 artifact는 `formalIdentityVerified=true`와 `actualSourceDerivativeBodiesIndependentlyVerified=false`를 함께 출력한다. 유한 fixture나 generic identity를 원본 N6-02 완료로 사용하지 않는다.

`(du dot grad)du=div(du tensor du)`로 바꾸려면 **실제** `div(du)=0`이 필요하다. 일반적으로 오른쪽은 `du*div(du)`를 더 포함한다. 원본 exact curls/potential 실현, cutoff 이후 divergence와 chart captures가 아직 independently discharged되지 않았다면 이 조건을 남긴다.

## Cartesian 변환에 필요한 실제 chain rule

고정된 Q chart에서

`u_phys=Q^(-A)*(u_r*cos(theta)-u_theta*sin(theta), u_r*sin(theta)+u_theta*cos(theta), u_z)`,

`p_phys=Q^(-2A)*p_star`다. source coordinates는 R=622802, Z=622803, T=622804, theta=622806, Y=(635044,635045)다. `Dr=partial_R+a0*(vr dot partial_Y)`, `Dz=epsilon*partial_Z`, `time=-epsilon*partial_T+ci*(vt dot partial_Y)`를 완전히 유지한다.

벡터 Laplacian에는 `-u_r/R^2-2*partial_theta(u_theta)/R^2`와 `-u_theta/R^2+2*partial_theta(u_r)/R^2`가 들어간다. advection에는 `-u_theta^2/R`, `u_r*u_theta/R`가 있다. theta 평균은 이 전체 계산을 대신하지 않는다. source 전역 sum에 존재하는 162 contribution, five palette lift, fast auxiliary paths, carrier integer의 미분 순서, base/pulse flat tail 및 A0/A1은 따로 보존해야 한다.

## 아직 필요한 최소 클래스 연결

| 명세 | 실제 요구 | 아직 필요한 원본 연결 |
|---|---|---|
| (9.8) wave | W^0.7 | 완전한 primary curl W^0.5, 선형 W^(1-3kappa), 모든 nonzero harmonics와 mean-wave interaction의 같은-domain all-order norm |
| (9.8) Etheta/Ez | M^1.2 | 원본 covariance/partition cancellation (9.11), Haar M^1.49, temporal inverse의 실제 M^(1-kappa) input 및 네 추가 torus derivatives |
| (9.8) P/J | S^1.2 | 실제 새 defect의 S^(1-kappa) input, fixed positive lambda/a의 five-map inverse, (8.26)/(8.27) nonlinear remainder 전체 적분 |
| (9.9) w와 rm | W^0.5 / W^0.68 | 원본 positive Hcov weights, complete potential curl, cutoff/connection remainder, 모든 차수의 고정 source constants |
| (9.9) v/gamma/pm | M^0.9 | 실제 temporal/five-map source seminorm을 T1/T0/Fourier leaf에 연결 |
| (9.9) beta | M^1.9 | actual azimuthal potential의 epsilon gain, 미분 endpoint/cutoff 포함 |
| (9.10) 두 moment | 모든 Z,T에서 정확히 0 | actual Fourier zero mode, Haar translation/Fubini와 supported five-row zero equations의 독립 적분 연결 |
| Definition9.4 | support/divergence/common domain | fixed phases, 실제 source closure, smooth zero extensions, chart covariance, original q_big와 flat joins |

원본 `N6_INITIAL_CLASS_SOURCE_MAP_2026_10_12.md`는 이 input 연결을 이미 미완료로 구분한다. `family.constructTargetWeightedNorms`의 recipe가 존재하는 것과 해당 actual input norm rows를 생성하고 bound를 증명하는 것은 다르다. 기존 radial/Fourier/five-map operator leaf는 실제 input class를 대신 제공하지 않는다.

## 재현 실행

`python research-ide/mathscope-m3/certification-20261014/initial_residual.py --output <새 evidence directory>`

출력은 `initial-state-audit.json`, `full-residual-audit.json`, `initial-residual-execution.json`이며 기존 파일을 덮어쓰지 않는다. 실행이 반환되어도 N6-01/N6-02 완료는 false다. 미입증 명세, 실제 roots/식/영역 조건과 full PDE 실행의 남은 범위를 artifact에서 읽을 수 있다.
