#!/usr/bin/env python3
"""Construct bounded compact matrix algebras over Q(i), without numeric libraries.
All bracket, Jacobi, metric and embedding certificates are exact rational tests.
Classification/global integration uses explicitly cited theorems, not these tests.
"""
from fractions import Fraction as F
from dataclasses import dataclass
from itertools import combinations, product
from pathlib import Path
import json, hashlib, time

@dataclass(frozen=True,slots=True)
class Q:
    r:F=F(0)
    i:F=F(0)
    def __add__(self,b):
        b=q(b);return Q(self.r+b.r,self.i+b.i)
    __radd__=__add__
    def __neg__(self):return Q(-self.r,-self.i)
    def __sub__(self,b):return self+-q(b)
    def __rsub__(self,b):return q(b)+-self
    def __mul__(self,b):
        b=q(b)
        if not self or not b:return Z
        return Q(self.r*b.r-self.i*b.i,self.r*b.i+self.i*b.r)
    __rmul__=__mul__
    def __truediv__(self,b):
        b=q(b);d=b.r*b.r+b.i*b.i
        return Q((self.r*b.r+self.i*b.i)/d,(self.i*b.r-self.r*b.i)/d)
    def __bool__(self):return bool(self.r or self.i)
    def conj(self):return Q(self.r,-self.i)
def q(a):return a if isinstance(a,Q) else Q(F(a))
Z=Q();ONE=q(1);I=Q(F(0),F(1))
def zeros(n):return [[Z for _ in range(n)] for _ in range(n)]
def entry(n,i,j,v=ONE):
    a=zeros(n);a[i][j]=q(v);return a
def add(a,b):return [[x+y for x,y in zip(ar,br)] for ar,br in zip(a,b)]
def scale(a,s):return [[x*s for x in row] for row in a]
def sub(a,b):return add(a,scale(b,-1))
def mul(a,b):
    n=len(a);out=zeros(n)
    for i,row in enumerate(a):
        for k,x in enumerate(row):
            if x:
                for j,y in enumerate(b[k]):
                    if y:out[i][j]=out[i][j]+x*y
    return out
def comm(a,b):return sub(mul(a,b),mul(b,a))
def dagger(a):return [[a[j][i].conj() for j in range(len(a))] for i in range(len(a))]
def transpose(a):return [[a[j][i] for j in range(len(a))] for i in range(len(a))]
def trprod(a,b):return sum((a[i][j]*b[j][i] for i in range(len(a)) for j in range(len(a)) if a[i][j] and b[j][i]),Z)
def lincomb(b,c):
    out=zeros(len(b[0]))
    for mat,v in zip(b,c):
        if v:out=add(out,scale(mat,v))
    return out

def rref(a):
    a=[row[:] for row in a];p=[];r=0
    if not a:return a,p
    for col in range(len(a[0])):
        k=next((i for i in range(r,len(a)) if a[i][col]),None)
        if k is None:continue
        a[r],a[k]=a[k],a[r];pivot=a[r][col]
        a[r]=[v/pivot for v in a[r]]
        for i in range(len(a)):
            if i!=r and a[i][col]:
                f=a[i][col];a[i]=[x-f*y for x,y in zip(a[i],a[r])]
        p.append(col);r+=1
        if r==len(a):break
    return a,p

def nullspace(a):
    rr,p=rref(a);nc=len(a[0]);free=[j for j in range(nc) if j not in p];out=[]
    for k in free:
        v=[F(0)]*nc;v[k]=F(1)
        for i,j in enumerate(p):v[j]=-rr[i][k]
        out.append(v)
    return out

def inv(a):
    n=len(a);isq=isinstance(a[0][0],Q);zero=Z if isq else F(0);one=ONE if isq else F(1)
    rr,p=rref([row[:]+[one if i==j else zero for j in range(n)] for i,row in enumerate(a)])
    assert p[:n]==list(range(n)),('singular',p,n)
    return [row[n:] for row in rr]

def matvec(a,b):return [sum((x*y for x,y in zip(row,b)), Z if any(isinstance(x,Q) for x in row+b) else F(0)) for row in a]
def positive_ldl(a):
    n=len(a);l=[[F(int(i==j)) for j in range(n)] for i in range(n)];d=[]
    for j in range(n):
        dj=a[j][j]-sum(l[j][k]**2*d[k] for k in range(j));assert dj>0;d.append(dj)
        for i in range(j+1,n):l[i][j]=(a[i][j]-sum(l[i][k]*l[j][k]*d[k] for k in range(j)))/dj
    return d

def A(n,i,j):return sub(entry(n,i,j),entry(n,j,i))
def B(n,i,j):return scale(add(entry(n,i,j),entry(n,j,i)),I)
def block(a,idx,n):
    out=zeros(n)
    for i,x in enumerate(idx):
        for j,y in enumerate(idx):out[x][y]=a[i][j]
    return out

def quaternion_left(k):
    arrays=[[[0,-1,0,0],[1,0,0,0],[0,0,0,-1],[0,0,1,0]],
            [[0,0,-1,0],[0,0,0,1],[1,0,0,0],[0,-1,0,0]],
            [[0,0,0,-1],[0,0,-1,0],[0,1,0,0],[1,0,0,0]]]
    return [[q(x) for x in row] for row in arrays[k]]
def qmul(a,b):
    w,x,y,z=a;v,p,q_,r=b
    return [w*v-x*p-y*q_-z*r,w*p+x*v+y*r-z*q_,w*q_-x*r+y*v+z*p,w*r+x*q_-y*p+z*v]
def qcon(a):return [a[0],-a[1],-a[2],-a[3]]
def omul(x,y):
    a,b=x[:4],x[4:];c,d=y[:4],y[4:]
    return [u-v for u,v in zip(qmul(a,c),qmul(qcon(d),b))]+[u+v for u,v in zip(qmul(d,a),qmul(b,qcon(c)))]
def octonion_phi():
    ee=[[int(i==j) for j in range(8)] for i in range(8)]
    return [[[omul(ee[i+1],ee[j+1])[k+1] for k in range(7)] for j in range(7)] for i in range(7)]
def phi_action(x,phi,i,j,k):
    return sum((x[l][i].r*phi[l][j][k]+x[l][j].r*phi[i][l][k]+x[l][k].r*phi[i][j][l] for l in range(7)),F(0))

def roots_from_cartan(cartan):
    r=len(cartan);rootpairs={}
    pending=[]
    for i in range(r):
        for s in [-1,1]:
            v=tuple(s if i==j else 0 for j in range(r));pending.append((v,v))
    while pending:
        v,w=pending.pop()
        if v in rootpairs:
            assert rootpairs[v]==w;continue
        rootpairs[v]=w
        for i in range(r):
            vv=list(v);ww=list(w)
            vv[i]-=sum(cartan[i][j]*v[j] for j in range(r))
            ww[i]-=sum(cartan[j][i]*w[j] for j in range(r))
            pending.append((tuple(vv),tuple(ww)))
    positives=sorted([v for v in rootpairs if all(x>=0 for x in v)],key=lambda v:(sum(v),v))
    return rootpairs,positives

def rootdata(family,n):
    if family=='SU':
        r=n-1;typ='A';c=[[2 if i==j else -1 if abs(i-j)==1 else 0 for j in range(r)] for i in range(r)]
    elif family=='Sp':
        r=n;typ='C';c=[[2 if i==j else -1 if abs(i-j)==1 else 0 for j in range(r)] for i in range(r)]
        if r>1:c[r-2][r-1]=-2
    elif family=='SO':
        r=n//2;typ='A' if n==3 else 'B' if n%2 else 'D'
        simple=[[int(j==i)-int(j==i+1) for j in range(r)] for i in range(r-1)]
        if n%2:simple.append([int(j==r-1) for j in range(r)])
        else:simple.append([int(j==r-2 or j==r-1) for j in range(r)])
        coroots=[[F(2*x,sum(y*y for y in v)) for x in v] for v in simple]
        c=[[int(sum(x*y for x,y in zip(co,rt))) for rt in simple] for co in coroots]
    else:r=2;typ='G';c=[[2,-3],[-1,2]]
    pairs,pos=roots_from_cartan(c)
    if family=='SO':
        sc=[list(map(int,v)) for v in simple];yc=[list(map(int,v)) for v in coroots]
        xb='integer rotation characters e_i';yb='integer 2pi rotations e_i'
    else:
        sc=[[c[i][j] for i in range(r)] for j in range(r)]
        yc=[[int(i==j) for i in range(r)] for j in range(r)]
        xb='fundamental weights omega_i';yb='simple coroots alpha_i^vee'
    def combine(v,b):return [sum(v[i]*b[i][j] for i in range(r)) for j in range(r)]
    rows=[{'simple':list(v),'corootSimple':list(pairs[v]),'character':combine(v,sc),'cocharacter':combine(pairs[v],yc)} for v in sorted(pairs)]
    assert len(rows)+r=={'SU':n*n-1,'SO':n*(n-1)//2,'Sp':n*(2*n+1),'G2':14}[family]
    return {'type':typ,'rank':r,'cartan':c,'cartanConvention':'A_ij=<alpha_j,alpha_i^vee>; row=coroot','characterBasis':xb,'cocharacterBasis':yb,'pairing':[[int(i==j) for j in range(r)] for i in range(r)],'simpleRootCharacters':sc,'simpleCorootCocharacters':yc,'roots':rows},pairs,pos

def construct(family,n):
    phi=None
    if family=='SU':
        size=n;basis=[];names=[]
        for i,j in combinations(range(n),2):basis.extend([A(n,i,j),B(n,i,j)]);names.extend([f'A{i}{j}',f'B{i}{j}'])
        for i in range(n-1):basis.append(scale(sub(entry(n,i,i),entry(n,i+1,i+1)),I));names.append(f'H{i}')
        su=[scale(B(n,0,1),F(-1,2)),scale(A(n,0,1),F(-1,2)),scale(sub(entry(n,0,0),entry(n,1,1)),-I/2)]
        metric=F(1);es=[entry(n,i,i+1) for i in range(n-1)];fs=[transpose(e) for e in es]
        glob={'form':'SIMPLY_CONNECTED','cover':f'SU({n})','kernel':['1'],'description':f'Actual defining SU({n}); center mu_{n}. No quotient identification.'}
        center={'order':n,'generators':[f'exp(2 pi i/{n}) I'],'representationDescendsToAdjoint':False};embkernel=['1']
    elif family=='SO':
        size=n;basis=[A(n,i,j) for i,j in combinations(range(n),2)];names=[f'A{i}{j}' for i,j in combinations(range(n),2)]
        if n==3:su=[scale(A(3,1,2),-1),A(3,0,2),scale(A(3,0,1),-1)];metric=F(1,4);embkernel=['+1','-1']
        else:su=[block(scale(quaternion_left(k),F(1,2)),list(range(4)),n) for k in range(3)];metric=F(1,2);embkernel=['1']
        r=n//2;s=zeros(n)
        for i in range(r):
            s[2*i][i]=ONE;s[2*i+1][i]=I;s[2*i][r+i]=q(F(1,2));s[2*i+1][r+i]=-I/2
        if n%2:s[-1][-1]=ONE
        sinv=inv(s);es=[];fs=[]
        for i in range(r-1):
            e=sub(entry(n,i,i+1),entry(n,r+i+1,r+i));es.append(mul(mul(s,e),sinv));fs.append(mul(mul(s,transpose(e)),sinv))
        if n%2:
            e=sub(entry(n,r-1,2*r),entry(n,2*r,2*r-1));f=scale(transpose(e),2)
            es.append(mul(mul(s,e),sinv));fs.append(mul(mul(s,f),sinv))
        else:
            e=sub(entry(n,r-2,r+r-1),entry(n,r-1,r+r-2));f=transpose(e)
            es.append(scale(mul(mul(s,e),sinv),F(1,2)));fs.append(scale(mul(mul(s,f),sinv),2))
        glob={'form':'ADJOINT' if n%2 else 'QUOTIENT','cover':f'Spin({n}) (not the stored matrix group)','kernel':['+1','-1'],'description':f'Actual faithful SO({n}) vector group. Spin({n}) is only the specified universal cover.'}
        center={'order':1 if n%2 else 2,'generators':[] if n%2 else ['-I'],'representationDescendsToAdjoint':bool(n%2)}
    elif family=='Sp':
        size=2*n;basis=[];names=[]
        def embed_a(a):
            out=zeros(size)
            for i in range(n):
                for j in range(n):out[i][j]=a[i][j];out[n+i][n+j]=a[i][j].conj()
            return out
        def embed_b(b):
            out=zeros(size)
            for i in range(n):
                for j in range(n):out[i][n+j]=b[i][j];out[n+i][j]=-b[i][j].conj()
            return out
        for i,j in combinations(range(n),2):basis.extend([embed_a(A(n,i,j)),embed_a(B(n,i,j))]);names.extend([f'aA{i}{j}',f'aB{i}{j}'])
        for i in range(n):basis.append(embed_a(entry(n,i,i,I)));names.append(f'aH{i}')
        for i in range(n):
            for j in range(i,n):
                b=entry(n,i,j) if i==j else add(entry(n,i,j),entry(n,j,i))
                basis.extend([embed_b(b),embed_b(scale(b,I))]);names.extend([f'bR{i}{j}',f'bI{i}{j}'])
        su=[scale(B(size,0,n),F(-1,2)),scale(A(size,0,n),F(-1,2)),scale(sub(entry(size,0,0),entry(size,n,n)),-I/2)]
        metric=F(1);es=[]
        for i in range(n-1):es.append(sub(entry(size,i,i+1),entry(size,n+i+1,n+i)))
        es.append(entry(size,n-1,2*n-1));fs=[transpose(e) for e in es]
        glob={'form':'SIMPLY_CONNECTED','cover':f'Sp({n})','kernel':['1'],'description':f'Actual compact USp({2*n}), not split Sp({2*n}, R); center +/-I.'}
        center={'order':2,'generators':['-I'],'representationDescendsToAdjoint':False};embkernel=['1']
    else:
        size=7;phi=octonion_phi();ambient=[A(7,i,j) for i,j in combinations(range(7),2)]
        constraints=[[phi_action(x,phi,i,j,k) for x in ambient] for i,j,k in combinations(range(7),3)]
        ns=nullspace(constraints);assert len(ns)==14
        basis=[lincomb(ambient,v) for v in ns];names=[f'D{i}' for i in range(14)]
        su=[block(scale(quaternion_left(k),F(1,2)),list(range(3,7)),7) for k in range(3)];metric=F(1,2)
        glob={'form':'ADJOINT','cover':'compact G2 = Aut(O), simply connected and adjoint','kernel':['1'],'description':'Actual stabilizer of the positive octonion 3-form in SO(7); center is trivial.'}
        center={'order':1,'generators':[],'representationDescendsToAdjoint':True};embkernel=['1'];es=None;fs=None
    for x in basis:assert add(x,dagger(x))==zeros(size)
    if family in ['SO','G2']:assert all(not z.i for x in basis for row in x for z in row)
    assert all(sum((x[i][i] for i in range(size)),Z)==Z for x in basis)
    if family=='Sp':
        jmat=zeros(size)
        for i in range(n):jmat[i][n+i]=ONE;jmat[n+i][i]=-ONE
        for x in basis:assert add(mul(transpose(x),jmat),mul(jmat,x))==zeros(size)
    if phi:
        assert all(phi_action(x,phi,i,j,k)==0 for x in basis+su for i,j,k in combinations(range(7),3))
    gram=[[-trprod(a,b).r*metric for b in basis] for a in basis];diagonal=positive_ldl(gram);gi=inv(gram)
    def coords(x):
        rhs=[-trprod(b,x)*metric for b in basis]
        c=[sum((v*z for v,z in zip(row,rhs)),Z) for row in gi]
        assert lincomb(basis,c)==x
        return c
    d=len(basis);brackets={};sparse=[]
    for a in range(d):
        for b in range(a+1,d):
            cc=coords(comm(basis[a],basis[b]));assert all(not v.i for v in cc)
            terms={k:v.r for k,v in enumerate(cc) if v}
            brackets[a,b]=terms;brackets[b,a]={k:-v for k,v in terms.items()}
            for k,v in terms.items():sparse.append([a,b,k,frac(v)])
    # Exhaustive trilinear Jacobi: basis triples with repeated index vanish by antisymmetry.
    jacobi_count=0
    for a,b,c in combinations(range(d),3):
        s={}
        for aa,bb,cc in [(a,b,c),(b,c,a),(c,a,b)]:
            for k,v in brackets.get((bb,cc),{}).items():
                for l,w in brackets.get((aa,k),{}).items():s[l]=s.get(l,F(0))+v*w
        assert not any(s.values()),('Jacobi',family,n,a,b,c,s)
        jacobi_count+=1
    # All ordered basis triples in the invariant metric identity.
    for a,b,c in product(range(d),repeat=3):
        left=sum(v*gram[k][c] for k,v in brackets.get((a,b),{}).items())
        right=sum(v*gram[a][k] for k,v in brackets.get((b,c),{}).items())
        assert left==right
    sucoords=[coords(x) for x in su]
    for i in range(3):assert comm(su[i],su[(i+1)%3])==su[(i+2)%3]
    eg=[[-trprod(x,y).r*metric for y in su] for x in su]
    index=2*eg[0][0];assert eg==[[index/2 if i==j else F(0) for j in range(3)] for i in range(3)]
    rd,pairs,pos=rootdata(family,n);r=rd['rank'];cartan=rd['cartan']
    if family=='G2':
        # Commuting exact compact torus: left quaternion action and right SO(4) factor.
        hr=block(scale(A(3,0,1),-1),[0,1,2],7)
        rk=[[0,0,0,-1],[0,0,1,0],[0,-1,0,0],[1,0,0,0]]
        hr=add(hr,block([[q(-F(v,2)) for v in row] for row in rk],list(range(3,7)),7))
        hl=su[2];assert comm(hl,hr)==zeros(7)
        ad=[]
        for h in [hl,hr]:ad.append([[coords(comm(h,b))[i].r for b in basis] for i in range(d)])
        es=[];fs=[];desired=[scale(hr,-2*I),scale(sub(hl,hr),-I)]
        for vals,hi in zip([(F(0),F(1)),(F(1,2),F(-3,2))],desired):
            constraints=[]
            for admat,lam in zip(ad,vals):
                for k in range(d):
                    constraints.append(admat[k]+[lam if j==k else F(0) for j in range(d)])
                    constraints.append([-lam if j==k else F(0) for j in range(d)]+admat[k])
            ns=nullspace(constraints);assert len(ns)==2
            v=ns[0];e=lincomb(basis,[Q(v[i],v[d+i]) for i in range(d)]);f0=dagger(e);br=comm(e,f0)
            ii,jj=next((i,j) for i in range(7) for j in range(7) if hi[i][j]);ratio=br[ii][jj]/hi[ii][jj]
            assert not ratio.i and ratio.r>0 and br==scale(hi,ratio)
            es.append(e);fs.append(scale(f0,1/ratio.r))
    hs=[comm(e,f) for e,f in zip(es,fs)]
    for i,j in product(range(r),repeat=2):
        assert comm(hs[i],hs[j])==zeros(size)
        assert comm(hs[i],es[j])==scale(es[j],cartan[i][j]),('Cartan e',family,n,i,j)
        assert comm(hs[i],fs[j])==scale(fs[j],-cartan[i][j]),('Cartan f',family,n,i,j)
        if i!=j:
            assert comm(es[i],fs[j])==zeros(size)
            for init,generators in [(es[j],es),(fs[j],fs)]:
                t=init
                for _ in range(1-cartan[i][j]):t=comm(generators[i],t)
                assert t==zeros(size),('Serre',family,n,i,j)
    # Basic-form normalization is computed from actual compact coroot matrices.
    root_lengths={}
    for v,w in pairs.items():
        kh=scale(lincomb(hs,list(w)),I)
        length=F(4)/(-trprod(kh,kh).r*metric)
        root_lengths[v]=length
    assert max(root_lengths.values())==2,('basic normalization',family,n,root_lengths)
    for row in rd['roots']:row['lengthSquared']=frac(root_lengths[tuple(row['simple'])])
    eroot={};froot={}
    for v in pos:
        if sum(v)==1:
            i=v.index(1);eroot[v]=es[i];froot[v]=fs[i]
        else:
            for i in range(r):
                beta=list(v);beta[i]-=1;beta=tuple(beta)
                if beta not in eroot:continue
                p=0
                while True:
                    w=list(beta);w[i]-=p+1
                    if tuple(w) not in pairs:break
                    p+=1
                ee=scale(comm(es[i],eroot[beta]),F(1,p+1))
                if ee!=zeros(size):
                    ff=scale(comm(froot[beta],fs[i]),F(1,p+1));eroot[v]=ee;froot[v]=ff;break
            assert v in eroot,('missing root',family,n,v)
        assert comm(eroot[v],froot[v])==lincomb(hs,list(pairs[v])),('root normalization',family,n,v)
    cb=hs+[eroot[v] for v in pos]+[froot[v] for v in pos]
    cbnames=[f'h{i+1}' for i in range(r)]+[f'e{v}' for v in pos]+[f'f{v}' for v in pos]
    columns=[coords(x) for x in cb];change=[[columns[j][i] for j in range(d)] for i in range(d)];changeinv=inv(change)
    chevsparse=[]
    for a in range(d):
        for b in range(a+1,d):
            cc=matvec(changeinv,coords(comm(cb[a],cb[b])))
            assert all(not v.i and v.r.denominator==1 for v in cc),('nonintegral Chevalley',family,n,a,b,cc)
            for k,v in enumerate(cc):
                if v:chevsparse.append([a,b,k,int(v.r)])
    data={'id':f'{family}{n}' if family!='G2' else 'G2','family':family,'parameter':n,'name':f'{family}({n})' if family!='G2' else 'G2','rank':r,'dimension':d,'matrixDimension':size,
          'globalForm':glob,'center':center,'representation':{'kind':'MATRIX','name':'compact defining complex matrices' if family in ['SU','Sp'] else 'defining real matrices','dimension':size,'faithful':True,'convention':'anti-Hermitian Lie algebra; D=d+A; compact real form'},
          'metricTraceFactor':frac(metric),'invariantInnerProduct':{'normalization':'basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)','formula':f'-({frac(metric)}) Re Tr(XY)'},
          'rootDatum':rd,'basis':{'names':names,'matrices':[encode_matrix(x) for x in basis],'compactRealForm':True},'structureConstants':sparse,'gram':[[frac(x) for x in row] for row in gram],
          'chevalley':{'names':cbnames,'matrices':[encode_matrix(x) for x in cb],'structureConstants':chevsparse,'compactToChevalley':[[encq(v) for v in row] for row in changeinv],'simpleGeneratorCount':r,'fullBasisCount':d,'verified':'exact integral Chevalley bracket table, Cartan and Serre relations'},
          'embedding':{'id':'canonical-su2','domain':'SU(2)','matrixGenerators':[encode_matrix(x) for x in su],'compactCoordinates':[[frac(v.r) for v in row] for row in sucoords],'index':frac(index),'globalKernel':embkernel,'integration':'Adjoint SU(2) double cover' if family=='SO' and n==3 else 'Injective quaternion or fundamental block SU(2) homomorphism'},
          'certificate':{'arithmetic':'Python fractions.Fraction over Q(i)','compactBasisRank':d,'gramPositiveLDL':[frac(x) for x in diagonal],'bracketPairs':d*(d-1)//2,'jacobiDistinctTriples':jacobi_count,'jacobiFullOrderedTriples':d**3,'adInvariantMetricOrderedTriples':d**3,'chevalleyIntegralBracketPairs':d*(d-1)//2,'embeddingBracketRelations':3,'embeddingGramIdentity':True,'longRootLengthSquared':'2','customAxioms':[],'classificationStatus':'THEOREM_REFERENCE','kernelStatus':'EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED'}}
    data['embeddings']=[data['embedding']]
    if family=='G2':
        right_arrays=[[[0,-1,0,0],[1,0,0,0],[0,0,0,1],[0,0,-1,0]],
                      [[0,0,-1,0],[0,0,0,-1],[1,0,0,0],[0,1,0,0]],
                      [[0,0,0,-1],[0,0,1,0],[0,-1,0,0],[1,0,0,0]]]
        rotations=[scale(A(3,1,2),-1),A(3,0,2),scale(A(3,0,1),-1)]
        short=[add(block(rotations[k],[0,1,2],7),block([[q(-F(v,2)) for v in row] for row in right_arrays[k]],list(range(3,7)),7)) for k in range(3)]
        for k in range(3):assert comm(short[k],short[(k+1)%3])==short[(k+2)%3]
        for x in short:assert all(phi_action(x,phi,i,j,k)==0 for i,j,k in combinations(range(7),3))
        sg=[[-trprod(x,y).r*metric for y in short] for x in short]
        assert sg==[[F(3,2) if i==j else F(0) for j in range(3)] for i in range(3)]
        data['embeddings'].append({'id':'short-root-su2','domain':'SU(2)','matrixGenerators':[encode_matrix(x) for x in short],'compactCoordinates':[[frac(v.r) for v in coords(x)] for x in short],'index':'3','globalKernel':['1'],'integration':'Injective (a,b)->(u a u^-1,b u^-1), u in unit quaternions; short-root SU2 index 3'})
        data['certificate']['additionalExactEmbedding']={'id':'short-root-su2','index':'3','bracketRelations':3,'phiPreservation':True,'gramPullback':True}
    if phi:data['octonions']={'convention':'(a,b)(c,d)=(ac-conj(d)b, da+b conj(c)); basis (i,0),(j,0),(k,0),(0,1),(0,i),(0,j),(0,k)','phi':[[i,j,k,phi[i][j][k]] for i,j,k in combinations(range(7),3) if phi[i][j][k]],'stabilizerConstraintRank':7,'stabilizerDimension':14}
    payload=json.dumps(data,sort_keys=True,separators=(',',':')).encode();data['dataSha256']=hashlib.sha256(payload).hexdigest()
    return data

def frac(x):return str(F(x))
def encq(x):return [frac(x.r),frac(x.i)]
def encode_matrix(x):return {'n':len(x),'entries':[[i,j,frac(v.r),frac(v.i)] for i,row in enumerate(x) for j,v in enumerate(row) if v]}

def main():
    root=Path(__file__).resolve().parent;all_data=[]
    specs=[('SU',n) for n in range(2,7)]+[('SO',n) for n in [3,5,6,7,8]]+[('Sp',n) for n in range(1,4)]+[('G2',2)]
    for family,n in specs:
        start=time.monotonic();data=construct(family,n);all_data.append(data)
        (root/'evidence'/f'exact-{data["id"]}.json').write_text(json.dumps(data['certificate'],indent=2)+'\n')
        print(data['id'],data['dimension'],'Chevalley',len(data['chevalley']['structureConstants']),'seconds',round(time.monotonic()-start,3),flush=True)
    blob=json.dumps(all_data,separators=(',',':'),ensure_ascii=False)
    (root/'group-data.mjs').write_text('// Generated by generate_groups.py; exact rational entries, not a classification proof.\nexport const GROUP_DATA = '+blob+';\n')
    (root/'evidence'/'exact-groups-summary.json').write_text(json.dumps({'groups':[{k:d[k] for k in ['id','dimension','matrixDimension','dataSha256','certificate']} for d in all_data],'generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},indent=2)+'\n')
    print('Wrote',len(all_data),'actual compact matrix algebras; data bytes',len(blob),flush=True)
if __name__=='__main__':main()
