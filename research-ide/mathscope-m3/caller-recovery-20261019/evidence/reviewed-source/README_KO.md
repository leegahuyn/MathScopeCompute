# 실제 slow inverse 호출 인자와 band 변환 복구

이 폴더는 현재 ChatGPT 작업에서 새로 작성했습니다. 이전에 유실됐다고 보고된
구현을 복구했다고 표시하지 않습니다. 기존 `recovery-20261019/native` 코드,
원본 source graph, 700개 scalar 보충 기록, 3,407개 의존 기록은 변경하지 않았습니다.

**이번 범위:** 두 실제 slow inverse 호출의 인자와 lexical frame을 원 노드까지
추적하고, 원 정수 band 사이의 상대 label·support guard·좌표 배율을 계산합니다.
실제 외부 전역점, `ell>=ell0`, 고정 mesh 정수, 대표점, radial endpoint 적분은
여전히 검증하지 않았습니다. M3는62/64, N7-06·N8-05 OPEN,
actual global last-resolved tau는null입니다.

## 실제 파일과 노드 연결

`evidence/CALLER_SOURCE_CAPSULE.json`은 원 기록329개, 각 기록의 원본 위치,
전체 입력 파일 SHA-256, 원 식, 두 호출 인자의 의존 목록, 실제 indexed row와
lexical frame을 담습니다. 전체 payload SHA-256은 코드에 고정했습니다.
호출자가 내용을 바꾸고 자체 해시를 다시 계산해도 수용하지 않습니다.

| 실제 항목 | 노드 또는 위치 | 판정 |
|---|---|---|
| 원 reference slow inverse |622820, `actual_monotone_root(2,622803,622804)`|실제 원 registry2를 사용|
| 첫 Z/T 인자 |622803/622804|외부 frame의 formal coordinate; 수치가 저장된 노드가 아님|
| 고정 대표점 slow inverse |623935, `actual_monotone_root(2,623921,623934)`|인자 식 보존, 수치 평가 미완료|
| 대표점 Z/T 인자 |623921/623934|ell622791 및 mesh623855/623856/623857에만 의존|
| 원 reference radial guard |622824 = R²/(2s), endpoints3617/28826|Xb 적분 및 실제 R 바인딩 필요|
| 검토한 indexed operation |643019, 원162개 row|모든 row 원본을 승계; dossier에는 가운데 mesh의 두 sign×세 band 실제 row를 표시|
| 가운데 두 sign row |80/81|같은 ell/mesh, 서로 다른 실제 pulse xi/v 인자 유지|
| 가운데 band label |632179|이번 단위가 상대 offset을 계산|
| 원 support endpoints |625191=-3/4,120836=3/4|변경하지 않음|

원 source wrapper는 다음 파일입니다. 정확한 바이트 해시는 capsule의
`source_files`에 있습니다.

- `mathscope-m3/navier/source-global-band.mjs`: 원 slow chart, integer band window,
  (D=1/2-h), 현재 slow 좌표와 대표점 좌표의 정의역.
- `mathscope-m3/navier/source-global-representative.mjs`: 원 같은 box의 대표점 선택.
- `mathscope-m3/navier/source-global-current.mjs`: row별 동시 인자 바인딩,
  원 radial/band/mesh guard 순서, fixed representative 대입.
- `mathscope-m3/navier/global-source-index.mjs`: 원 nearest integer, support3/4,
  complete three-band candidate 구성 및 source window membership 의무.

## 이번에 실행 가능한 부분을 닫은 방법

원 source의 reference band는 정수 $\ell$이며
$Q_{\mathrm{ref}}=2^{-\ell}$, $q=Q_{\mathrm{ref}}s$입니다.
가운데 band label의 원 AST는

$$
\ell_c=\left\lfloor\frac12-\log_2 q\right\rfloor.
$$

정수 translation 항등식에 의해

$$
\ell_c-\ell
=\left\lfloor\frac12-\log_2 s\right\rfloor=d.
$$

따라서 매우 큰 `ell`이나 매우 작은 `Q`의 수치를 만들 필요 없이, 원
$1/2\le s\le2$에서 상대 정수 $d\in\{-1,0,1\}$만 분류합니다.

| 원 s의 위치 | 정확한 d |
|---|---:|
|$s^2\le1/2$|1|
|$1/2<s^2\le2$|0|
|$s^2>2$|-1|

이 닫힌 endpoint 규칙은 원 `-ceil(-x)`를 그대로 따릅니다. 입력 구간이 경계를
가로지르면 `BAND_LABEL_BOUNDARY_OPEN`을 반환하며 label을 반올림하지 않습니다.

세 원 후보는 $\ell_j=\ell_c+j$, $j=-1,0,1$입니다.
$\delta=d+j$, $r=Q_{\mathrm{ref}}/Q_j=2^\delta$로 놓으면 `r`은 정확한
유리수입니다. 원 band support는

$$
|{-\log_2 q-\ell_j}|<3/4
\iff |\log_2(rs)|<3/4
\iff 1/8<(rs)^4<8.
$$

`1/8`과`8`은 원 support3/4에서 유도한 값입니다. M3 인수 조건에 임의로 추가한
임계값이 아닙니다. 경계와 외부는 원 flat zero, 경계 교차 구간은 OPEN입니다.

## 실제 caller 좌표와 root의 변환

원 row가 사용하는 좌표는

$$
R'=r^{1/2}R,\qquad Z'=r^{1/2-h}Z,\qquad T'=rT.
$$

원 residual을 $F(s;Z,T)=s-Z^2s^{2h}-T$라 하면,
$2(1/2-h)+2h=1$에 의해

$$
F(rs;r^{1/2-h}Z,rT)=rF(s;Z,T).
$$

따라서 원 root가 $s$이면 transport된 root는 정확히 $rs$입니다.
active band guard는 이를 $(2^{-3/4},2^{3/4})\subset(1/2,2)$에 놓으며,
원 $\eta=Z/s^{1/2-h}$도 보존됩니다. frozen label을 먼저 정하고 그 local body를
미분하는 원 규칙을 유지하므로, R/Z/T 미분의 배율은 각각
$r^{1/2},r^{1/2-h},r$입니다. nearest-label map을 미분하지 않습니다.

또한 $R'^2/(2s')=R^2/(2s)$이므로 원 indexed row의 radial guard가
reference frame의 노드622824를 사용한다는 점과 일치합니다.

출력의 Z/T 구간을 서로 독립적인 새 source box로 간주하지 마십시오.
transport된 변수들은 원 입력에서 생긴 상관관계를 가지며, root certificate는
위 정확한 covariance 항등식을 사용합니다. 별도 구간의 모든 Cartesian 조합이
source image에 속한다고 주장하지 않습니다.

### 오차 처리

모든 endpoint 계산은 `Fraction`입니다. $\sqrt r$은 정수 제곱근으로 아래·위
dyadic endpoint를 만들고 두 제곱을 정확히 비교합니다.

원 $0<h<h_u=2^{-(b+32)}$와 $\log2<1$을 유지합니다.
$r^{1/2-h}=\sqrt r\,\exp(-h\delta\log2)$에서
$\epsilon=|\delta|h_u$라 하면, 양의 delta에는
$[1-\epsilon,1]$, 음의 delta에는 $[1,(1-\epsilon)^{-1}]$를 사용합니다.
delta0일 때만 배율이 정확히1입니다. 실제 h를0으로 바꾸지 않습니다.

이 작은 caller 구현의 자원 범위는16–512비트입니다. 이것은 구현 자원 제한이며,
N8-05의 arithmetic precision 인수 기준이나 완료 임계값이 아닙니다.

## 실제 미해결 지점

1. **Reference frame.**622802/622803/622804/622791은 원 R/Z/T/ell formal입니다.
   원 실제 전역점에서 온 interval과 원 coefficient window membership이 필요합니다.
   파일이나 record가 빠진 것으로 재분류하지 않았습니다.
2. **고정 mesh 정수.**가운데 row80/81은 mesh를632236/632240/632244에 바인딩합니다.
   이들은 `ell_label^6`배한 각 실제 좌표의 원 nearest integer입니다. 이번 상대 band
   축약은 `ell_label^6`이나 mesh ceiling crossing을 계산하지 않습니다.
3. **Radial endpoint.**Xa는 원4/Lambda입니다. Xb28826은 `XR*exp(node319)`이며,
   outer definite integral239/257/275와 nested integral229/249를 포함합니다.
   기록과 원 integrand는 모두 존재합니다. 예를 들어275는 역수276의 피연산자이므로
   수치 평가에는 양의 하계도 필요합니다. 이번 구현은 이 적분을0이나 경험값으로
   대체하지 않습니다.
4. **대표점 sign/time 선택.**623914=`negativeWidth`의 부호로623921의 실제 Z를
   고릅니다. 같은 원 box에 active interior가 있다는 전제와 frozen label 값이 먼저
   검증돼야 합니다. 현재점 자체를 대표점으로 대체하지 않습니다.

Lexical frame은 서로 구분해야 합니다. 첫 호출622820의622803은 호출된 frame의 Z이고,
둘째 호출623935에서는 인자623921을 그 호출자의 frozen frame에서 먼저 계산한 뒤,
registry2의 formal622803에 새로 바인딩합니다. node ID만으로 전역 memoization하면
이 두 의미를 섞게 됩니다. 모든 실제 frame 배열은 capsule에 기록했습니다.

또한 원 `source_parameter T` 노드6은 거대한 고정 상수이고, slow time coordinate
`T` 노드622804는 별도의 formal입니다. 문자열 이름 `T` 하나로 두 값을 합치는
환경도 올바른 원 바인딩이 아닙니다. 원 노드 ID와 lexical frame을 함께 유지해야 합니다.

## 원 상수·정의역 출처

원 논문 SHA-256:
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

- PDF24쪽(4.1),62–63쪽(6.1): 원 chart/scale 관계.
- PDF106–107쪽 Proposition9.5: **B0=0.7, C0*=1.2** 및 원 stage0 조건.
- 원 설계도 SHA-256
  `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`,
  PDF62쪽 N6-01: 같은 상수와(9.9),(9.10)를 인수 조건으로 명시합니다.

`original-excerpts/`에는 실제 PDF의 해당 페이지 텍스트와 원 PDF/추출물 해시를
저장했습니다. OCR 또는 수식의 임의 수정은 하지 않았습니다.

## 실행 및 검증

이 폴더에서 실행합니다.

```sh
python build_caller_dossier.py
python verify_band_caller.py
```

계산 runtime은 Python 표준 라이브러리만 사용합니다. 독립 검증 스크립트는
mpmath1.3.0과Sympy1.14.0을 사용했습니다. 현재 세션에서 실제 실행한 의존 경로와
명령은 `EXECUTION_RECEIPT.json`에 남겼습니다.

첫 실행 결과: 검사232개, 변조·잘못된 입력 대조군13개, formal chart 실행22개 PASS.
독립 계산은 원 logarithmic floor/guard 식, 원 $Z=0\Rightarrow s=T$ image witness,
보존된 기존 nonzero-Z 입력, 정확한 symbolic 항등식과 양의 h-envelope 배율을
검사했습니다. 두 irrational threshold crossing과 두 support crossing을 OPEN으로
유지했습니다.32·64·128·512비트의 배율 enclosure 폭 감소도 확인했습니다.

이러한 실행은 N7-06의 실제 전역장 에너지 공간·시간 비교나 N8-05의 네 축 및
각 tail bound를 대신하지 않습니다. 새로운 M3 완료 항목은0개입니다.
