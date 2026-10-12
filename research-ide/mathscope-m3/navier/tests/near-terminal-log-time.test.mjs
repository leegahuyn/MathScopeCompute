import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../../../mathscope-m2/navier/actual-global-source-expressions.mjs';
import {retainSourceLogTime} from '../source-near-terminal.mjs';

test('exact positive decimal survives a log-time chart even when double negation has another node ID',()=>{
  const G=new ActualSourceExpressions();
  for(const [coefficient,exponent]of [[1,-2],[1,-1000],[123,-6]]){
    const logTau=G.add(G.log(G.q(coefficient)),G.mul(G.q(exponent),G.log(G.q(10)))),tau=G.exp(logTau),
      result=retainSourceLogTime(G,logTau,tau);
    assert.notEqual(G.exp(G.neg(result.s)),tau,'the recovered failure was syntactic equality of different graphs');
    assert.equal(result.tau,tau);assert.equal(result.positiveTauNodeRetained,true);
    assert.equal(result.signIdentity.pass,true);assert.equal(result.signIdentity.numeratorMonomials,0);
    assert.equal(result.signIdentity.denominatorOperands.length,0);
    assert.equal(result.signIdentity.analyticOperandsReplacedByNumericalValues,false);
  }
});

test('a different exponent, a literal zero, and a missing source node cannot become the original positive tau',()=>{
  const G=new ActualSourceExpressions(),logTau=G.mul(G.q(-1000),G.log(G.q(10))),tau=G.exp(logTau);
  for(const [log,value]of [[logTau,G.exp(G.add(logTau,G.one))],[logTau,G.zero],[-1,tau],[logTau,-1]])
    assert.throws(()=>retainSourceLogTime(G,log,value),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
