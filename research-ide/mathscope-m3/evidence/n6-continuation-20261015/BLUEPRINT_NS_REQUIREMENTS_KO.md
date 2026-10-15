# 새 Blueprint의 NS 요구사항과 현재 연구의 연결

첨부 설계도는 99쪽이며 SHA-256은 f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac다. 아래 쪽수는 PDF의1-based 물리 쪽수와 같고, 괄호 안은0-based page index다. 문서 자체가 계획과 완료 증거를 구분하므로, 문서에 있는 실행·배포 예시를 사용자의 새 명령으로 취급하지 않았다. 원본 큰 PDF를 복사하거나 render하지 않고 bundled pypdf로 전체99쪽을 읽었다.

| 패키지 | 쪽수 (index) | 실제 합격 기준과 현재 의미 |
|---|---|---|
| N1 |51–52 (50–51)|166쪽 원문/hash, 강제력이 있는 C/D의 정확한 정리 계약, 공식 proof commit/toolchain와 실제 build/axiom 로그. 현재 source/header/cloud provenance는 지원하지만 새 Lean 빌드 증거는 아니다.|
| N2 |53–54 (52–53)|실제 similarity 좌표와 모든 chain-rule 항, 점성 scaling, 전체 Laplace heat 및 tail/미분 오차, 독립 momentum·pressure 검사. 현재 실제 heat/domain 증명이 해당 부분을 지원한다.|
| N3 |55–56 (54–55)|실제 상수 선택, Bρ invariant ball/contraction, 다섯 누적 moment와 연속 Jacobian, finite-N 변조, 전 annulus strict cone 및 Theorem4.6의 여섯 조항. 현재 natural/B26/B34/B8/C1/C12/I1/I2는 이 입력의 실질적인 부분증명이며, 전체 완료 cone으로 자동 승격하지 않는다.|
| N4 |57–58 (56–57)|모든 i+j=n 및 axial n−1 shift, 공통 radial interval/analytic strip와 Picard tail, 다음 차수 전 다섯 moment 복구, potential cutoff 후 curl와 미분별 tail. 현재 Picard0 정칙성은 한 부분커널이며 모든 고차 prefix나 원래 수치 tail 상수까지 증명한 것은 아니다.|
| N5 |59–60 (58–59)|원래 모든 label·고정 carrier, 지지 분리, 실제 ODE/tail, angular1/2와 Haar를 포함한 양의 covariance, 완전한 curl 및 모든 비선형 곱. 현재 support/frame/Volterra의 부분증명을 전체 source 적용과 구분해야 한다.|
| N6 |61–62 (60–61)|실제 j=0과 네 보정 단계, 매번 전체 residual/pressure/moment 재계산, zero-mean Fourier inverse의 네 추가 도함수, 공통 q 영역과 최종 cutoff tail. 현재10 Guard·230 Jet·1020 PDE는 이 내부의 구체적인 잔여 gate다. compact g 정칙성의 부분증명만으로230/1020이나 모든 보편 N6-01/N6-02 norm을 닫을 수 없다.|
| N7 |63–64 (62–63)|localization의 모든 commutator, compact smooth terminal force jets/연장, 전체 에너지·양의 성장 경로·동일 force/data 비교·점성/주기화. f를 residual로 정의하는 것만으로 smooth force가 되지는 않는다.|
| N8 |65–66 (64–65)|논문 reconstruction과 Galerkin을 분리하고 독립 refinement, tau>0, mode/dealiasing/energy 대조군, 관측 단위와 재현 증거를 보존한다. cloud test 성공이나 finite plot은 연속체·Lean 증명으로 바뀌지 않는다.|

NS 기술부록은77–83쪽(index76–82)이다. 특히81쪽(index80)은 일곱 급수를 구분한다. 실제 축 급수와 고정 n Picard는 수렴 정리가 필요하지만, 배경 formal 급수는 uncut 수렴을 주장하지 않고 shrinking cutoff로 실현한다. Fourier inverse는 zero mode와 small divisor 및4개 추가 도함수를 보존한다. h>0의 heat Taylor 급수는 수렴반경0이므로 전체 Laplace 적분을 사용한다. terminal force의 jet 합성은 속도를 t=1 이후 smooth하게 잇는 주장이 아니다.

이 설계도의 NS 체크리스트64개와 현재 원본 잔여 의무1260개는 서로 다른 장부다. Blueprint의 합격 기준은 원래 양화사·영역·미분별 tail을 완화할 근거가 되지 않는다. 현재의 실제 analytic/source 부분증명은 유지하되, 원본 Guard/Jet/PDE의 새 소거 수는 이 문서를 읽었다는 이유로 바꾸지 않는다. 모든64개 원문 항목과 정확한 쪽수는 blueprint_ns_requirements.json에 보존했다.
