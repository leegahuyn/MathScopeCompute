# P7 결과 타입과 가정 내보내기

`p7.result_claim`은 실제로 다시 계산한 유한 수학 결과를 네 타입으로
구분한다. 저장된 플래그나 SHA가 같다는 사실만으로 새 증명 권한을 얻지 않는다.
`replay_result_claim`은 원래 입력으로 수학 계산과 범위 검사를 다시 수행한다.

| resultType | 계산과 판정 | 넘어가지 않는 범위 |
|---|---|---|
| `FINITE_HEIGHT_ZERO_CERTIFICATE` | 전체 strip의 중복도 count, Hardy Z의 독립 고립, endpoint 영점 배제 | 명시된 T 위의 영점이나 보편 RH |
| `SPECIFIC_CURVE_RANK_EQUALITY` | 새 PARI descent 상한, height 하한과 별도의 rigorous central L rank가 같은 최소모형에서 일치 | 다른 곡선, refined BSD, 보편 BSD |
| `REFINED_LEADING_TERM_CHECK` | leading coefficient와 Ω·Reg·Tamagawa·torsion의 구간 비교, 필요한 Sha 증거 목록 | interval overlap을 exact identity 또는 Sha 위수 증명으로 변경 |
| `UNIVERSAL_CONJECTURE` | `CLASSICAL_RH` 또는 `UNIVERSAL_BSD` 연구 명제와 양화사 보존 | 유한 계산으로 universal quantifier 충족 |

구체적 rank equality/leading-term analytic 예제는 현재 `11a1`, `37a1`
모델의 검증된 0차·1차 중심값을 사용한다. 일반 rational 모델의 Tate 자료와
complex L 연장은 별도 API가 제공하지만, 여기서 더 높은 rank를 자동 인증하지 않는다.

## 요청

```json
{
  "kind": "p7.result_claim",
  "input": {
    "resultType": "SPECIFIC_CURVE_RANK_EQUALITY",
    "input": {"model": "37a1", "coefficientLimit": 64}
  }
}
```

`examples/`에 네 타입, 등록 연산자, finite-field RH 복사 거부 예제가 있다.
Curve 입력은 `model`, `coefficientLimit`, `precisionBits`, `heightIterations`,
`knownPoints`, `tolerance`를 받는다. Refined 타입에만 `conditionalShaOrder`가
허용된다. 이 값은 외부에서 증명된 사실을 받는 인증서 필드가 아니라 명시적인
사용자 가정이다. 독립 Sha 증거가 없다는 의무는 그대로 남는다.

## Coefficient·prime·zero completeness

선택 사항 `presentedCompleteness`는 세 필드를 모두 가진다.

```json
{
  "coefficientIndices": [1, 2, 3],
  "primeFactors": [2, 3, 37],
  "positiveZeroIndices": []
}
```

값은 예시이며 실제 기대목록은 요청의 cutoff와 전체 나쁜 소수에서 다시
생성한다. 각 누락·추가·중복 항목을 자동 목록화하고 결과 내보내기를 거부한다.
목록을 생략하면 fresh 계산의 전체 유한 목록을 사용한다. 이 목록은 숫자의
진위를 인증하는 서명이 아니다. 수학 값과 certificate가 삭제·변조된 저장
결과는 별도 fresh replay에서 불일치로 거부된다. 유한 cutoff 뒤의 모든
계수를 나열했다고 주장하지 않으며, 무한 tail은 원래 analytic 인증서의
명시적 상계로 처리한다.

`11a1/37a1`의 fresh rank equality가 실제로 성립해도 `universalBSDProved`는
항상 false다. `promotion`의 `sourceDomain=FINITE_FIELD`,
`targetDomain=CLASSICAL_RH` 요청은 다른 대상과 양화사를 가진 정리를
axiom 이름 변경으로 옮길 수 없으므로 계산 전에 거부한다. 유한 높이 또는
한 곡선에서 보편 결론으로의 승격도 같은 경계에서 거부한다.

## Lean 가정 목록은 무엇을 뜻하는가

`researchHypotheses`는 `{id, statement, role}` 목록이며 role은
`ASSUMPTION` 또는 `TARGET`이다. 원문 수학 텍스트와 ID를 그대로 보존하여
Lean의 proposition parameter `Pi : Prop`, proof binder `hi : Pi`와 함께
내보낸다. 생성된 theorem은 이 가정들의 conjunction만 묶는다.

이 내보내기는 임의의 operator/domain/trace 문장을 자동으로 Lean 정의로
번역하지 않는다. `semanticTranslationPerformed=false`와 각 ID의
`UNINTERPRETED_PROPOSITION_PARAMETER`가 남는다. 그 명제를 실제 formal
정리로 사용하려면 정확한 수학 정의·타입·bridge를 별도로 작성해야 한다.
Target을 가정 목록에 넣은 패킷은 `CONDITIONAL_ON_TARGET`이다.

가정은 theorem의 매개변수이며 전역 `axiom` 선언이 아니다. 따라서 실제
`#print axioms`가 비어 있어도 가정이 사라진 것이 아니다. **Theorem type의
binder 목록과 전역 axiom 의존성은 서로 다른 자료**다. 두 자료를 서로의
대용으로 사용하지 않는다. `kernelCompilationExecutedForThisExport=false`는
API가 매 요청마다 Lean을 실행했다는 오해를 막는다.

예제 export의 실제 로컬 Lean 4.34.1 실행은
`evidence/research-export-20261012/`에 있다. 전체 binder의 conjunction은
exit 0이며 `h2`를 삭제한 원문은 exit 1이다. 실패 출력에는 `sorryAx`가
포함되어 보존된다. 이는 export 패킷의 논리적 연결 확인이며, 입력한 연구
명제의 의미 번역·참 여부나 보편 RH/BSD의 증명은 아니다. 실제 proposition과
axiom의 비교·삭제에 대한 별도 P8 검증 범위는 P8의 원래 증거로 유지한다.
