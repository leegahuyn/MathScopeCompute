# 원본 공통 첫 cutoff의 정확한 비교

원래 성공 실행의 닫힌 selector 구간과 실제 FTC 상계를 검증했다. 원본 최대값의 역사적 cutoff와 여덟 required-log 상계의 지수 중첩 높이는 4, 원본 ellMinimum 하계의 높이는 6이다. 유리수 \(1048592\)와 \(1048593\) 사이의 입력과 exp의 단조성을 써서 모든 경쟁 항이 ellMinimum/2보다 작음을 얻었다. 실제 최대값은 작은 대역 항 #617464이며 b1*qBig=1이다. 원본 trace 40,114개와 N0/N1의 처음 617,521개 레코드를 읽어 정확히 결속했다.

따라서 이 N0 원본 current·pressure 그래프가 요구하는 b1*q>=1은 q<qBig/16인 whole K에서 성립하지 않는다. N2에서 재배치된 첫 FTC 조건 8개와 실제 최대값도 원본 typed binder 비교로 일치했다. b2 이후의 실제 최대값 승자는 OPEN이다. 일반 성장 상계로는 세 번째 차트면 충분한 대부분의 구간과 맨 아래 좁은 대표점 구간을 구분할 수 있다.

    python check_common_b_scales.py --repo <repo> --n0 <original-whole-k-n0> \
      --n1 <corrected-first-forced> --n2 <original-axial-n2> --out common-b-scales.json

repo에는 f8cb4034e86d7b669d52a6f2248aebba156b51b5 원본 Git 객체가 필요하다. 검증한 원본 성공 기록, scale 구간, FTC 상계와 trace를 증거 ZIP에도 넣었다. RELEASE HOLD.
