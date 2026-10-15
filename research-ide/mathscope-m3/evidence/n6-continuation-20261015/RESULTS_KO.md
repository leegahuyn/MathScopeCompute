# MathScope M3/N6 원본 의무 후속 증명·검증 보고서

2026-10-15 KST. 기존 Draft PR #30과 브랜치 `mathscope-m3-n6-cloud-20261014`에서 이어간다. 원래 목표는 Guard/Jet/PDE의 무조건부 0개이며, 이 보고서는 그 목표를 달성했다고 주장하지 않는다.

## 실제 판정

첨부 패키지의 추가 Guard 6개를 독립 검토하고, 입력 인증 결함을 보완한 뒤 전체 원본으로 재실행했다. [클라우드 실행 38694948443](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38694948443)은 SUCCESS이며, 해당 코드 커밋은 `2f88dd1fc36365a5840fc7a9fab486ab868a8085`다. 테스트 72/72, 실패 0, 오류 0이다. 기존 원본/기호 검증 49개와 추가 헤더 결합 검증 23개를 같은 실행에서 실제 수행했다.

| 원본 의무 | 이전 원격 장부 | 이번 확인 후 | 목표 |
|---|---:|---:|---:|
| Global Guard | 16 | 10 | 0 |
| Cartesian Jet | 230 | 230 | 0 |
| PDE 잔여항 | 1,020 | 1,020 | 0 |
| 합계 | 1,266 | 1,260 | 0 |

첨부의 6개 소거를 넘어 새로 무조건부 소거한 원본 의무는 0개다. N6-01 OPEN, N6-02 PARTIAL, M3 56/64를 유지한다. originalUniversalRequirements도 그대로 보존했다. 별도 Picard PR #31은 읽기 전용으로 확인했다. main, 원본 producer, 수식·상수·acceptance 기준, 공개 사이트의 완료 표시는 변경하지 않았다.

`OBLIGATION_MATRIX.json`에는 원래 1,266행을 모두 넣었다. 소거 6행과 OPEN 1,260행의 ID는 중복·누락 없이 분할된다. Guard 원명제, Jet의 순서 있는 좌표·원본 호출 해시, PDE의 정확한 유리수 계수·source factor는 각 실행 증거와 연결된다. `DEPENDENCY_GRAPH.json`은 행별 미해결 전제를 원본 함수 정의에 연결하는 보수적 의존 그래프이며, 완전한 의미론적 최소 그래프라고 주장하지 않는다.

## 입력 인증과 실제 보완

첨부 ZIP의 24개 manifest 항목은 바이트 길이와 SHA-256이 전부 일치했다. ZIP SHA-256은 `0c448b5171e1feeb41cb08b24acf56e8f038b40f6064105f3146298ce92d519f`이다. 첨부가 기준으로 삼은 이전 커밋과 최신 PR head를 구분하고, 기존 세 검증기 파일이 최신 원격 Git blob과 동일함도 확인했다.

| 입력 | SHA-256 |
|---|---|
| 원본 3,892,594-node stream | `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f` |
| 원본 gzip | `42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3` |
| 원본 scalar program | `aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8` |
| Stage4 기준 장부 | `8ac413724219323a8c422d011a3bdb3b38e0d9cd74dee8c308475e9b3bd2456b` |
| gzip 내부 header record 및 별도 header 파일 | `f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1` |
| 엄격 canonical header | `bf22a99a1ff0b83cd022c31bc4c21aff92d6489359ab4d1c983f8662b0e0f464` |

독립 검토에서 `HEADER-BINDING-001`을 발견했다. 기존 Stage3은 gzip 내부 헤더와 전체 stream을 인증했지만, 이후 Stage4와 후속 코드는 별도 `header.json`에서 registry를 읽었다. 기존 장부 해시만으로는 그 두 헤더의 동일성이 보장되지 않았다.

새 코드는 Stage4 실행 전에 두 헤더를 엄격하게 대조하고, 후속 검증은 gzip에서 읽은 헤더로 registry를 만든다. 실행 후에도 헤더 불변성을 재확인한다. 중복 JSON 키, 추가·누락·중첩 정의, 배열 순서, true/1, 1/1.0, 비유한 수, float 반올림으로만 같아지는 서로 다른 decimal, 잘못된 UTF-8 등 변조를 거부한다. 이 gate는 전체 graph 해시 검증과 별개이며, 둘을 모두 통과해야 한다. 헤더 결합 수정 자체는 수학적 소거로 세지 않는다.

## 추가 Guard 6개의 실제 증명

대상 ID는 C-005, C-008, C-009, C-010, C-011, C-059이며, 전체 ID와 원명제는 실행의 `GUARD_DISCHARGES.json`에 보존했다. 적용 영역은 기존 허용 band와 양의 반지름 annular chart다.

원본 window는 `N >= window.lower >= ell0 = 6 + ceil(max(8,...))`를 만족하므로 `N>=14`, `N-2>=12>0`이다. 이로써 실제 log 인자의 양성을 얻는다. 원래 chart에서 `R=sqrt(2sX)`, `s>=1/2`, `X>=Xa/2`, `Xa=4/Lambda>0`이므로 `R>0`이고 `Q=exp(-N log 2)>0`, `sqrt(Q)R>0`이다. scalar44도 정의된 유한 실수의 양의 exponential 두 개의 곱이다. log·역원의 실제 인자에 이 사실을 적용한다. R²>0만으로 부호를 선택하지 않으며, 축 R=0 연장이나 임의 signed R에 대한 주장은 하지 않는다.

C-059는 scalar1528의 실제 끝점 치환이다. source3615202와 source3615048은 같은 `expressionDefinitions:21`, body3614891의 호출이다. 적분 binder rho를 R로 동시에 대입하면 이동 위상차가 정확히 0이고 원래 여섯 인자 `[N,R,Z,T,Y0,Y1]`가 복원된다. 원본 외부 log·sqrt·역원 정의역 9개를 상쇄 전에 확인했다. g의 추이적 본체·registry·인코딩된 payload 136,186개 노드와 84개 정의에서 새 binder가 캡처되지 않음도 확인했다. 이는 동일한 정의역을 갖는 같은 함수 호출의 항등식이며, g의 전체 존재·정칙성 증명이 아니다.

상세 원래 해석 증명은 `tools/n6-remaining-closure-20261015/PROOF_KO.md`에 보존했다. 과거 파일에 적힌 ‘GitHub 실행 없음’은 첨부 당시 기록이며 이번 실행 결과는 본 보고서와 실제 run 영수증으로 판단한다.

## 남은 Guard 10개의 정확한 관문

남은 ID는 C-027, C-061/062, C-069/070, C-077/078, C-085/086, C-093이다. 원본 g는 `expressionDefinitions:21`, body3614891, P는 `expressionDefinitions:23`, body3615054, 적분함수는 scalar248이다.

각 고정 허용 band에서 원래 전체 radial 구간과 이동 위상·Haar cube를 모두 포함하는 공통 compact 근방 위에서 실제 `g,g_Z,g_Y0,g_Y1`의 공동 연속성이 필요하다. 이 명제가 성립하면 먼저 P의 미분 교환을 정당화하고 이어 scalar248의 미분 교환을 정당화할 수 있다. theta 부재만으로 적분의 존재를 증명할 수 없으므로 theta 관련 두 행도 OPEN이다.

`D=partial_R+Psi'(R)(partial_Y0+v1 partial_Y1)`에 대해 원래 이동 위상 적분함수 H는 정칙성 전제 아래 `DH=0`이다. 그러나 압력 `integral_L^R H - chi(R) integral_L^U H`에는 `-chi'(R) integral_L^U H`가 남는다. 이 cutoff remainder를 보존했고, 누락시키는 음성 대조는 실패한다. 조건부 보조정리를 실제 g 정칙성의 증명으로 승격하지 않았다.

실제 g의 보수적 의존 목록은 136,186개 노드, 84개 registry 정의다. 그 안에는 자연급수 노드 533개가 포함된다. 이것은 metadata까지 읽은 상위집합이며, 533개가 서로 다른 독립 profile 또는 동시에 활성화되는 호출이라는 뜻이 아니다. 현재 저장된 g 그래프는 실제 order-one Picard0에 연결된다. 모든 고차 prefix와 모든 universal requirement의 증명으로 확장하지 않는다.

지금까지의 bounded 추출은 자연급수 533개 전체의 실제 인자 범위·적분 경로를 제공하지 못했다. 따라서 새 focused workflow가 인증된 기존 아티팩트에서 그 전체 튜플과 원래 lazy guard/binder 문맥, full fixed/Picard 정의 및 실제 support 인자를 읽도록 추가됐다. 추출 성공은 정의역 증명과 구분한다.

## 확보한 해석 보조정리와 남은 적용 전제

`independent-audits/regularity_audit.md`는 정상 수렴, 단순근, Volterra augmented jet, flat Gaussian, Fourier inverse의 해석을 전개한다. 다음은 단순 수치 샘플에 의존하지 않는 증명이다.

원래 slow chart 방정식은 `F(s,Z,T)=s-Z²s^(2h)-T=0`이다. 실제 image에서 `F_s=1-2h eta²>7/8`이고, 전체 bracket에서도 `F_s>1/2`다. 따라서 선택된 같은 원본 근은 국소 C-infinity이며, implicit 미분은 정당하다. 실제 source node를 결합한 1·2·3차 primitive 도함수 9개와 원래 방정식의 total derivative 검산을 별도 파일에 보존했다. 이 부분 정리는 그 chart를 합성하는 모든 배경 profile의 정칙성을 대신하지 않는다.

원래 C.1 loop의 `M(z)=average exp(z sin theta)`는 양의 density 적분이고 `(log M)''=Var_z(sin theta)>0`이다. `R=M(2z)/M(z)^2`의 removable quotient `(R-1)/z²`는 0에서 1/2로 매끄럽게 연장되고 양수다. 따라서 signed 표현 `d0 mu sqrt(Q(mu p))`의 mu 도함수는 양수이며, zero-variance 지점도 unsigned square-root cusp로 취급할 필요가 없다. 실제 입력 RHS·bracket·branch의 결합은 따로 검증해야 한다.

원래 Diophantine Fourier 역원은 정확한 정수 norm으로 `|1/(v_t dot k)| <= (2+sqrt(2)) |k|_infinity`를 만족한다. 실제 smooth periodic 입력의 고정 mixed slow/phase 미분이 공통 compact에서 유계라면, 충분한 phase 적분 부분적분과 shell당 8n개 격자점으로 완전한 꼬리를 상계하고 모든 필요한 미분의 국소 정상 수렴을 얻는다. 이 정리는 실제 입력의 smoothness를 새로 가정하여 원본을 닫는 용도로 사용하지 않는다. 원래 자연급수 계수 norm, 모든 실제 인자 범위, 실제 Picard 입력 공통 strip·같은 함수 동일성이 여전히 관문이다.

실제 five-row 선형 보정 inverse는 양의 bump 적분 인자와 distinct exponential Vandermonde 노드 및 `1-exp(-2lambda/5)>0`로 비특이성을 증명할 수 있다. 이전 비선형 root의 실제 contraction/RHS와 이 상수 행렬의 비특이성을 혼동하지 않는다.

## Jet 230개 및 PDE 1,020개

원래 Jet operand source 호출은 19개, 고유 native registry 정의는 15개다. 다섯 호출이 같은 meridional-potential 정의를 서로 다른 기존 미분 차수로 부르는 차이를 보존한다. 원래 190/36/4 분류 및 모든 230개 ID·좌표 순서를 유지한다. 190개는 정칙성 이후 계산할 조건부 target이지 증명된 도함수가 아니다. 36개는 앞선 미분의 존재를 입증하기 전 마지막 부재 방향만 보고 0으로 처리하지 않는다. 네 비자명 pullback도 실제 g의 편미분이 확보되어야 한다.

PDE의 169/197/654개 항은 정확 계수와 source factor를 보존했다. 원래 coupled-field 0/1/2는 각각 162개 signed source row의 residual 조립이다. 이를 임의로 직접 PDE와 같다고 정의하지 않았다.

선형 부분 L과 이차 부분 Q에 대해 `E(M+sum w_i)-E(M)-sum(E(M+w_i)-E(M))`는 정확히 `sum_(i!=j) Q(w_i,w_j)`다. 독립 정수 다항식 검산은 26,082개의 cross tensor를 재현하고, mean-wave 항 하나를 누락하는 음성 대조를 거부했다. 지지집합의 실제 분리와 원본 smooth flat joins가 입증되면 cross tensor가 0이 되는 경로다. 현재 checker의 support ideal reduction 자체는 실제 지지집합 분리의 증명이 아니다.

원래 2,250-color palette의 유리수 중심 분리는 독립 검산했다. 다만 162개 실제 row의 center/copy/label/guard/lift가 바로 그 공식에 해당한다는 전체 source-node 결합은 다음 focused 추출로 확인해야 한다. 미해결 native derivative, Cartesian/cylindrical normalization, 실제 오차 예산도 보존했다. 비영 formal numerator를 실제 PDE 반례로 해석하지 않았다.

## 재현·보존과 다음 실제 작업

`run-38694948443/`의 12개 결과 파일은 Actions의 RESULT_SHA256.json과 독립 재계산이 모두 일치한다. 원본 생성기는 다시 실행하지 않았다. 큰 원본 gzip/SQLite는 GitHub Actions 내부에서만 처리했고, 노트북에는 내려받지 않았다. 기록된 증거·장부·한국어 보고서·코드는 기존 PR #30에 추가 전용으로 보존한다. 과거 실패와 이전 장부는 삭제하지 않는다.

남은 실제 작업은 full natural argument와 primitive domain, Picard 입력, 원래 indexed support/flat 접합을 증명하고, 이를 실제 g와 230개 순서 미분 및 1,020개 원본 PDE 행에 적용·독립 검증하는 것이다. 다음 추출이나 CI가 성공해도 이 수학적 적용을 거치지 않으면 잔여 수를 줄이지 않는다.
