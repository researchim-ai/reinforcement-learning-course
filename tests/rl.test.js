import {test} from 'node:test';import assert from 'node:assert/strict';import {GridAgent,GOAL} from '../src/rl.js';import {modules,topicContent} from '../src/curriculum.js';
function seeded(){let s=42;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
test('walls and boundaries preserve state',()=>{const a=new GridAgent();assert.equal(a.transition(0,0).next,0);assert.equal(a.transition(8,1).next,8);});
test('terminal rewards do not bootstrap',()=>{const a=new GridAgent();a.state=47;a.epsilon=0;a.q[47]=[0,1,0,0];a.q[GOAL]=[100,100,100,100];a.step();assert.equal(a.q[47][1],1+a.alpha*9);assert.equal(a.episodes,1);assert.equal(a.successes,1);});
test('Q-learning discovers a successful greedy policy',()=>{const a=new GridAgent(seeded());a.train(2000);let s=0;for(let i=0;i<30&&s!==GOAL;i++){const q=a.q[s];s=a.transition(s,q.indexOf(Math.max(...q))).next;}assert.equal(s,GOAL);assert.equal(a.returns.length,2000);assert.ok(a.successes>1200);});
test('all lessons have Russian and English content',()=>{let count=0;modules.forEach((m,i)=>m[6].forEach((_,j)=>{for(const en of [true,false]){const c=topicContent(i,j,en);assert.ok(c.title&&c.body&&c.formula&&c.example);}count++;}));assert.equal(count,38);});

test('all bilingual equations and inline math render without TeX errors',async()=>{
 const {renderMath,renderMathText}=await import('../src/math.js');
 modules.forEach((m,i)=>m[6].forEach((_,j)=>{
  for(const en of [false,true]){
   const c=topicContent(i,j,en);
   const html=renderMath(c.formula,true);
   assert.ok(html.includes('<math'),'accessible MathML is included');
   assert.ok(html.includes('katex-html'),'typeset math is included');
   assert.ok(!html.includes('katex-error'));
   for(const text of [c.body,c.example])assert.ok(!renderMathText(text).includes('katex-error'));
  }
 }));
 assert.ok(renderMathText('<script> $x^2$').startsWith('&lt;script&gt;'));
 assert.ok(renderMath('\\frac{1}{2}').includes('mfrac'));
});
