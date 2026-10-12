J(v)={my(t=type(v));if(t=="t_VEC"||t=="t_COL",return(Str("[",strjoin(vector(#v,i,J(v[i])),","),"]")));if(t=="t_INT"||t=="t_FRAC",return(Str("\"",v,"\"")));error("unsupported_json_type");};
Rows(A)=vector(matsize(A)[1],i,vector(matsize(A)[2],j,A[i,j]));
Aug(v)={if(type(v)=="t_INT",return(v));if(type(v)=="t_MAT",return(sum(k=1,matsize(v)[1],v[k,2])));error("unsupported_relation_coefficient");};
setrand(1);M=msinit(37,2,1);H=msnew(M);S=msfromhecke(M,[[2,-2]],H);s=H[1]*S[,1];s=-s;G=mspathgens(M)[1];V=vector(#G,i,mseval(M,s,G[i]));print("MATHSCOPE_MODSYM_GENERATOR_DIAGNOSTIC=",J([V,msissymbol(M,V),#mspathgens(M)[1]]));quit(0);
