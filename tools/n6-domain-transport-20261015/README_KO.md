# N6 Stage 3 — 활성 band 정의역과 native 변분 바인딩

2026-10-15 · 기존 PR #30 승계. 원본 생성기, 진행 기준, public UI, Picard PR #31 불변.

## 결과와 적용 범위

원래 선언된 기준 atlas에서 네 입력족의 **활성 indexed 행**이 원본 slow-root 정의역에 포함됨을 증명하고 실제 source graph에 결합했다. 원래 Cartesian checkpoint의 2,349행을 포함해, 전체 parent의 indexed 정의 28개/4,050행을 전수 검사했다. `m3GlobalBlocks`의 38개 block/188행은 native 부모 pulse와 바인딩을 전부 대조했다.

4,050행의 row-level domain transport와 188행의 native binding에는 남은 불일치가 없다. 이 행 수들은 N6의 1,288개 의무와 다른 단위다. 전체 nested 호출·대표점·FTC/Volterra 계수의 해석적 정의역/노름, 전체 Cartesian 소비기의 경로/접합은 별도다. Jet 230 / Guard 38 / PDE 1,020 / 합계 1,288, N6-01 OPEN, N6-02 PARTIAL, M3 56/64를 유지한다.

## 원본 및 실행

축약 SQLite는 633,816-node prefix였다. 없는 node를 추측하지 않고 원본 압축 네 조각을 다시 검증했다. GitHub Actions source export `38673138045`는 SUCCESS이며 전체 3,892,594-node parent를 보존한다. 수학적 검증 성공과 단순 source-export 성공은 구분한다.

- source export commit: `8b259c42b2af73a8bdd59d78c6763360a15e52fa`
- parent node SHA-256: `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f`
- complete raw SHA-256: `9be5187506edbd2e7ccdad81392b0c29cc84350f374e331b7b5845a435c7fdf0`
- gzip SHA-256: `42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3`
- Cartesian checkpoint: `ba1fd222b9b50236dcbe8eff144a43ac6d4a5b724f2352fc0f67afad83f34ef2`
- historical frontier: `98275fe97be5933ef51a0facb633eaf11b5f1a90b7d6d42735e9e1473e3f825e`
- historical structural audit: `18c98a280e9dbb355fe10eaecdb5997acd3bd3c99698426f2b825bb3d1a34541`

검증기는 전체 gzip을 매번 인증하고 새 SQLite cache를 만든다. 과거 완료 flag, 재사용 cache, SHA 인증 그 자체를 수학 증명으로 취급하지 않는다. 서면 해석 증명과 실제 AST 결합/정확 산술 검사가 근거이며 Lean 인증은 아니다.

## 정리: 모든 활성 band의 원래 root bracket 보존

원본 `source-global-current.mjs`는 기준 chart를 `T>=0, q=Q_ref*s>0, 1/2<=s<=2`로 명시한다. 원본 root는

```
F(s;Z,T)=s-Z^2*s^(2h)-T,
D=1/2-h,
(Z,T)=(s^D*eta, s*(1-eta^2)),
1/2<=s<=2, |eta|<=1.
```

실제 h는 `exp(-8002*(exp(1048576)+10))`이며 `0<h<1/64`이다. 이 원래 atlas를 벗어난 임의 실수 Z,T에 대한 결론이 아니다. 예를 들어 (0,0)에 양의 root는 없다.

기준 band N, 후보 ell에 대해 `Q_ref=2^-N`, `Q_ell=2^-ell`, `c=Q_ref/Q_ell>0`, `L=-log2(Q_ref*s)`이다. 원본의 실제 outermost band guard는

```
-3/4 < L-ell < 3/4.
```

따라서

```
c*s = 2^(ell-L),
2^(-3/4) < c*s < 2^(3/4),
(2^(-3/4),2^(3/4)) is a strict subset of (1/2,2).
```

마지막 포함은 `2^3=8<16=2^4`와 양수 역수 비교로 검산된다. 두 원본 인자에서 같은 c를 사용하는지 확인한 뒤 `2D+2h=1`로

```
F(c*s; c^D*Z, c*T)=c*F(s;Z,T)=0,
eta'=(c^D*Z)/(c*s)^D=eta,
T'=c*s*(1-eta^2)>=0
```

를 얻는다. 그러므로 원래 `[1/2,2]` 유한 bracket 안의 유일 root는 정확히 c*s이고 입력은 원래 atlas로 다시 들어간다. 모든 admissible N과 활성 ell에 대한 동일한 정리이며 유한 band 샘플의 외삽이 아니다. 항등 입력족은 원래 root를 그대로 유지한다.

| source Z/T | 기존 checkpoint | 전체 parent |
|---|---:|---:|
| 622803 / 622804 | 486 | 1,458 |
| 632193 / 632194 | 621 | 864 |
| 632227 / 632228 | 621 | 864 |
| 632262 / 632263 | 621 | 864 |
| 합계 | 2,349 | 4,050 |

각 indexed 정의마다 81개 label 전부, 양 부호의 원본 중복도, localSystem/body/parameters, 실제 R/Z/T 값과 Jacobian, 마지막 guard가 실제 해당 scale의 band guard인지를 검사했다. 모든 실제 Z/T 슬롯이 네 source pair로 고정되므로 grid/sign/torus-copy의 다른 인자가 이 slow 포함 결론을 바꾸지 않는다. band guard는 R이나 방사형 적분 binder와 무관하므로 적분 중 만나는 mesh cell에도 같은 논증을 적용한다. 점 하나의 label 목록을 전체 방사형 적분으로 바꾸지 않는다.

원본 세 global/auxiliary/coupled 구현은 `choose(x,left,right,0,body,0)`를 guard 목록 순서대로 겹친다. 마지막 band guard가 가장 바깥쪽이다. 실제 JavaScript loop를 추출해 3개 구현의 AST 순서와 inactive/끝점 선택을 실행 검사했다. 전체 수치 evaluator나 원본 생성기를 실행했다는 의미는 아니다.

## 정리: 요청된 두 plateau 부등식

이전 원본 bump 증명(`../n6-bump-bridge-20261014/PROOF_KO.md`)에서

```
a0=Xa/(2eX0), b0=200Xb/(121eX0),
Xa<4, X0>110, Xb>e^13*X0.
```

따라서 `a0<1/110<1/2` 및 `b0>819200/121>2`이다. 위 모든 활성 입력의 root s'는 a0와 b0 사이에 있다. T'>=0에서

```
H(u)=(u-T')/u^(2h),
H'(u)=(1-2h)u^(-2h)+2h*T'*u^(-2h-1)>0,
H(s')=Z'^2
```

이므로 실제 입력에 대해

```
T'+Z'^2*a0^(2h)>a0,
T'+Z'^2*b0^(2h)<b0.
```

원래 요청한 비엄격 부등식보다 강한 엄격 포함이다. 따라서 해당 호출에서 bump 전체 지지집합은 고정 적분구간에 포함되고 I(s')=C_beta, `1/14580<C_beta<1/160`, 정규화의 양의 차수 slow 미분=0을 쓸 수 있다. 이 결과의 전체 acceptance 적용과 상위·중첩 호출 문맥은 별도 검증이다.

## 188행의 정확한 정체와 해결

이전 설명을 바로잡는다. `m3GlobalBlocks`의 행은 indexed-cover 행이 아니라 pulse ODE를 다중미분한 **native sparse variational row**다. indexed 형식의 localParameters를 행마다 요구했던 검사가 맞지 않았다. 원본 데이터에 가짜 필드를 추가하지 않았다.

부모 pulse의 원래 바인딩은 time=622805, parameters=[622802,622803,622804,622807,622808,622809,622791], directions=[622802,622803,622804], directionParameterIndices=[0,1,2], initial=[1,0], interval=[0,623027]이다. 각 행은 `pulse` index로 이 부모를 참조한다.

```
partial_v w_alpha = sum_(beta<=alpha) binomial(alpha,beta) * D^(alpha-beta)M * w_beta.
```

부모의 originalDefinition covariance와 전체 매개변수·행렬·초깃값·구간이 같은지, 모든 downward multi-index와 alpha-beta/column/binomial이 맞는지 확인했다. 원래 188행의 definition/row SHA는 변하지 않았다.

- native systems: 2; variational blocks: 38; rows: 188/188.
- sparse terms: 574; 실제 scaled matrix cells: 2,296; scaled norm cells: 574.
- 미확인 native 부모 바인딩: 188 → 0.

norm의 실제 shared body, 전체 8개 입력, 시간 미분 차수, value-at-zero, 새 적분 binder, [0,Ls] 끝점, sqrt(1+f^2) 및 sqrt(1+(partial_v f)^2), sum/maximum도 대조했다. 이것은 계수의 전체 정의역·C1성·독립 미분식·균일 norm을 증명한 것과는 다르다.

## 검증과 재현

로컬에서 실제 full audit PASS, 최종 unittest 44/44 PASS. 첫 test harness는 중첩 JavaScript 중괄호를 잘라내 1개 테스트가 실패했으나, 테스트 추출기만 고친 뒤 전부 통과했다. 원본 kernel은 불변이며 실패 로그는 대화 패키지에 보존한다. 전 차수·모든 band 결론은 서면 증명으로 정당화하며 유한 테스트를 외삽하지 않는다.

```sh
python verify_domain_transport.py --source /path/to/source-export \
  --prepared /path/to/prepare-artifact/prepared \
  --prior /path/to/final-summary --out ./evidence
N6_SOURCE=/path/to/source-export \
N6_PREPARED=/path/to/prepare-artifact/prepared \
N6_PRIOR=/path/to/final-summary N6_EVIDENCE=./evidence \
  python -m unittest -v test_domain_transport
```

의존성은 Python 표준 라이브러리와 Node.js이다. CI는 run 38673138045의 source export, 38523108728의 prepare, 38529033425의 final summary를 재사용하되 실제 내용 해시를 재검증한다. 생성 cache는 결과 아티팩트에 업로드하지 않는다. GitHub Actions 성공 여부는 실행이 완료된 뒤 별도 STATUS.json에 관측값을 기록한다.

## 남은 공식 범위

전체 nested 대표점/FTC/Volterra 내부 root 호출, 실제 Cartesian 소비기의 모든 경로와 접합, native 계수의 해석적 정의·노름은 아직 별도다. 이번에 닫은 행별 증거를 그 상위 호출과 원래 8개 Guard acceptance에 연결해야 한다. 따라서 원래 Jet 230 / Guard 38 / PDE 1020은 변경하지 않았다.
