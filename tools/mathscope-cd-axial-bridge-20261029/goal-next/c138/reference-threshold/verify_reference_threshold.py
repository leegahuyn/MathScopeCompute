"""Exact reference endpoint control and proposed nearest-reference rule.

No native policy is changed.  The numerical instance is a rational control
for the stated generic source-window hypotheses, not a source-parameter run.
"""
import argparse, hashlib, json
from fractions import Fraction as Q
from pathlib import Path

PINS={
 'partition':('runtime','mathscope-m2/navier/actual-covariance-source-certificate.mjs','c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681'),
 'bump':('runtime','mathscope-m2/navier/actual-covariance-global-assembly.mjs','bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc'),
 'guard':('runtime','mathscope-m3/navier/source-global-current.mjs','b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36'),
 'chart':('runtime','mathscope-m3/navier/source-global-band.mjs','a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b'),
 'window':('runtime','mathscope-m3/navier/global-source-index.mjs','a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f'),
 'live':('work','continuation133/live-reference/partial.json','947262a5685a7cf4ce60061e4c428c590484da10b292918a4972566bcd50bf2e'),
 'registry':('work','continuation132/hosted-44682703381/active-n3-repeat-forced-source/original-source-functions.json','62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce'),
}

def power2(k):
    return Q(2**k,1) if k>=0 else Q(1,2**(-k))

def nearest(x):
    y=x+Q(1,2)
    return y.numerator//y.denominator

def verify(work,runtime):
    roots={'work':work,'runtime':runtime}; data={}
    for name,(root,rel,pin) in PINS.items():
        path=roots[root]/rel; raw=path.read_bytes(); actual=hashlib.sha256(raw).hexdigest()
        assert actual==pin,(name,actual,pin)
        data[name]=json.loads(raw) if path.suffix=='.json' else raw.decode()
    for s in ('nearestBand=floor(G.add(bandCoordinate,q(1,2)))',
              'const ell=G.add(nearestBand,q(relativeBand))',
              'G.pow(ell,6)', 'bandCoordinate=G.neg(G.div(G.log(chart.qActual),G.log(q(2))))'):
        assert s in data['partition'],s
    assert 'G.choose(abs,G.q(1,4),G.q(3,4)' in data['bump']
    assert 'radius=q(3,4)' in data['guard']
    assert 'guards=[[band.chart.X,G.parameter(\'Xa\'),band.chart.Xb],...meshOffsets.map' in data['guard']
    assert 'chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)' in data['chart']
    assert 'left:q(1,2),right:q(2)' in data['chart']
    assert "ell=G.fresh('N6_global_frozen_integer_band_N'+N)" in data['window']
    assert 'upper=G.sub(floor(G.div(next.logScale,log2)),G.one)' in data['window']
    live=data['live']['actualIndexedFieldReadback']
    assert (len(live['fields']),live['rowsPerField'],live['distinctBoxes'],live['guardsPerRow'])==(8,162,81,5)
    assert live['allEightRowMapsIdentical'] and live['localOwnLabelSlot']==3 and live['localReferenceLabelSlot']==7
    assert live['firstRow']['guards'][0]==[17732770,3617,28826]
    assert all(len(row)==3 for row in live['firstRow']['guards'])
    definitions=json.loads(data['registry']['definitions'])
    fields=definitions[1]
    selected=[fields[i] for i in (9,10,11,12,16,17,18,19)]
    central=[[row for row in field['rows'] if row['label']['key']=='0:0:0:0'] for field in selected]
    assert all(len(rows)==2 for rows in central)
    rowkey=lambda row:{k:row[k] for k in ('values','guards','derivativeMaps','coefficient','label')}
    assert all([rowkey(row) for row in rows]==[rowkey(row) for row in central[0]] for rows in central)
    assert {row['label']['sign'] for row in central[0]}=={-1,1}
    for row in central[0]:
        assert row['guards']==[[17732770,3617,28826],[17742247,17735192,120836],
          [17742249,17735192,120836],[17742251,17735192,120836],[17742182,17735192,120836]]
        assert row['values'][3]==row['label']['ell'] and row['values'][7]==live['outerReferenceLabelRoot']

    # Generic proof: for integer k >= ell0+4 in the original N-window,
    # q=2^(-k-1) < 2^(-ell0-4), while k<=floor(log2(bnext))-1
    # gives bnext*q>=1. At Z=0, F(s)=s-T, so the exact endpoints follow.
    k,ell0=20,10
    Qref=power2(-k); Qown=power2(-k-1); q=Qown
    qstar=power2(-ell0-4); bnext=power2(k+1)
    assert k>=ell0+4 and q<qstar and bnext*q>=1
    assert q/Qref==Q(1,2) and q/Qown==1
    assert Qref*Q(1,2)==Qown*1==q
    # Symbolic original shell midpoint requires only the native Xa<Xb.
    # The rational pair below checks the arithmetic; it is not a claim about
    # the original numerical endpoint constants.
    Xa,Xb=Q(1),Q(3); X=(Xa+Xb)/2
    assert Xa<X<Xb and Q(2)*X/(2*1)==X and X/(2*Q(1,2))==X
    t=Q(k+1); own=k+1; band_offset=t-own
    assert nearest(t)==own and band_offset==0 and abs(band_offset)<Q(3,4)
    # Z_own=0 and T_own=1 give exact zero offsets for those mesh axes.
    ell6=own**6; zmesh=Q(0); tmesh=Q(ell6)
    assert zmesh-nearest(zmesh)==0 and tmesh-nearest(tmesh)==0
    # For R_own=sqrt(Xa+Xb), the exact nearest integer gives its offset in
    # [-1/2,1/2); this proof requires no numerical square-root evaluation.
    for n in range(-3,4):
        for d in range(1,12):
            x=Q(n,d); offset=x-nearest(x)
            assert -Q(1,2)<=offset<Q(1,2) and abs(offset)<Q(3,4)
    assert t-k==1
    # nearest x=floor(x+1/2) gives x-nearest in [-1/2,1/2).
    # Both half-tie sides are explicitly checked, and |offset|<=1/2<1.
    for base in range(-5,6):
        assert Q(base,1)+Q(1,2)-nearest(Q(base,1)+Q(1,2)) == -Q(1,2)
        assert Q(base,1)-Q(1,2)-nearest(Q(base,1)-Q(1,2)) == -Q(1,2)
    return {'schema':'MathScope.C138.ReferenceThresholdControl/1',
      'status':'EXACT_SOURCE_BOUND_ENDPOINT_CONTROL_NEAREST_POLICY_CONDITIONAL',
      'genericHypotheses':['integer k>=ell0+4','k belongs to the original nonempty N window',
          '0<Xa<Xb and X=(Xa+Xb)/2','Z=0 and positive original source scales'],
      'physicalPoint':{'Qref':'2^(-k)','Qown':'2^(-k-1)','q':'2^(-k-1)',
          'tau':'q','z':'0','r':'sqrt(Qown)*sqrt(Xa+Xb)',
          'referenceSlow':'(sqrt((Xa+Xb)/2),0,1/2)',
          'ownSlow':'(sqrt(Xa+Xb),0,1)','X':'(Xa+Xb)/2'},
      'endpoint':{'sRef':'1/2','sOwn':'1','referenceChart':'closed [1/2,2]',
          'strictReferenceDistance':'1','strictLessThanOne':False,'ownBandOffset':'0'},
      'fiveOuterGuards':{'shell':'Xa<(Xa+Xb)/2<Xb',
          'meshR':'offset in [-1/2,1/2) by nearest-integer definition',
          'meshZ':'0','meshT':'0','ownBand':'0',
          'allFourOffsetGuardsStrictlyInside':'(-3/4,3/4)',
          'actualCentralRowGuards':central[0][0]['guards'],
          'centralRowKey':'0:0:0:0','bothSignedRowsPresent':True},
      'nearestProposedRule':{'ellRef':'floor(-log2(q)+1/2)',
          'offsetRange':'[-1/2,1/2)','bothHalfTies':'offset = -1/2',
          'sufficesForStrictAdmission':'|t-ellRef|<=1/2<1, hence 1/2<q/Qref<2',
          'otherRequirements':['source N-window membership','original q* and next-scale conditions',
              'admitted eta/shell/representative and physical guards','consistent chart choice and join across label seams'],
          'implementedInNativeSource':False},
      'scope':'Exact own-band outer guard control for a generic valid source window. No claim that the physical auxiliary torus reaches a signed rectangle or that any complete wave is nonzero. No claim of actual source policy, all-chart chart selection, or smooth global reindexing.',
      'pins':PINS,'release':'HOLD','finalJets':0}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for f in ('work','runtime','out'):p.add_argument('--'+f,required=True,type=Path)
    a=p.parse_args(); out=verify(a.work,a.runtime)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+'\n').encode())
    print(out['status'])
