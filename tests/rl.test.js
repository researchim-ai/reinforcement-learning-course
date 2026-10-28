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

test('quest gates require reading, correct tasks and a separate successful experiment',async()=>{
 const {initialProgress,canClear,canEnter,clearStation,submitAnswer,recordBossVictory,stations}=await import('../src/quest.js');
 const p=initialProgress();assert.equal(canEnter(p,1),false);assert.equal(submitAnswer(p,1,0,3),false);assert.equal(clearStation(p,0,4),false);
 p.read=['0-0','0-1','0-2','0-3'];assert.equal(submitAnswer(p,0,0,'2,75'),true);assert.equal(submitAnswer(p,0,0,''),false);assert.equal(submitAnswer(p,0,1,0),false);assert.equal(submitAnswer(p,0,1,1),true);
 assert.equal(canClear(p,0,4),false);p.experiment=true;assert.equal(clearStation(p,0,4),false);const {runBoss,bosses}=await import('../src/bosses.js');assert.equal(recordBossVictory(p,0,runBoss(0,bosses[0].good)),true);assert.equal(clearStation(p,0,4),true);assert.equal(canEnter(p,1),true);assert.equal(canEnter(p,2),false);
 for(let s=1;s<9;s++){modules[s][6].forEach((_,j)=>p.read.push(`${s}-${j}`));stations[s].questions.forEach((q,j)=>assert.equal(submitAnswer(p,s,j,q.answer),true));assert.equal(clearStation(p,s,modules[s][6].length),false);assert.equal(recordBossVictory(p,s,runBoss(s,bosses[s].good)),true);assert.equal(clearStation(p,s,modules[s][6].length),true);}
 assert.deepEqual(p.cleared,[0,1,2,3,4,5,6,7,8]);
});
test('quest persistence rejects invalid shapes and nonconsecutive unlocks',async()=>{
 const {sanitizeProgress}=await import('../src/quest.js');
 assert.deepEqual(sanitizeProgress(null).cleared,[]);
 assert.deepEqual(sanitizeProgress({version:1,cleared:[0,2,4],read:['bad','0-0','0-0'],answers:[]}).cleared,[0]);
 assert.deepEqual(sanitizeProgress({version:1,read:['bad','0-0','0-0']}).read,['0-0']);
});
test('greedy evaluation never mutates learned Q values or training metrics',async()=>{
 const {evaluateGreedy}=await import('../src/rl.js');const a=new GridAgent(seeded());a.train(2000);const before=JSON.stringify(a);const result=evaluateGreedy(a);assert.ok(result.success);assert.ok(result.steps<=100);assert.equal(JSON.stringify(a),before);
});
test('bandit exploration tries every arm and UCB identifies the better receiver',async()=>{
 const {BanditAgent}=await import('../src/rl.js');const a=new BanditAgent(seeded());for(let i=0;i<3000;i++)a.step('ucb');assert.equal(a.round,3000);assert.ok(a.counts.every(n=>n>0));assert.ok(a.counts[2]>a.counts[0]+a.counts[1]);assert.ok(a.regret>=0);assert.equal(a.pull(10),null);
});
test('advanced chapters have distinct, bilingual records and caveats',async()=>{
 const {notes}=await import('../src/lesson-notes.js');assert.equal(Object.keys(notes).length,34);assert.equal(new Set(Object.values(notes).map(n=>n.formula)).size,34);for(const note of Object.values(notes))for(const field of ['body','example','pitfall'])assert.ok(note[field][0]&&note[field][1]);
});

test('city story preserves old course progress and validates district access',async()=>{
 const {initialStory,sanitizeStory,recordConversation,collectEvidence}=await import('../src/narrative.js');
 const s=initialStory();assert.equal(recordConversation(s,1,0,0),false);assert.equal(collectEvidence(s,2,1),false);assert.equal(recordConversation(s,0,2,0),false);assert.equal(recordConversation(s,0,1,0),true);assert.equal(collectEvidence(s,0,0),true);assert.equal(collectEvidence(s,0,0),true);assert.deepEqual(s.evidence,[0]);assert.equal(s.choices[0],1);
 const reloaded=sanitizeStory(JSON.parse(JSON.stringify(s)));assert.deepEqual(reloaded,s);assert.deepEqual(sanitizeStory({version:1,evidence:[-1,0,0,11,'1'],heard:{bad:true},choices:{0:5}}).evidence,[0]);
});
test('story endings require the completed course, and preserving memory also requires evidence',async()=>{
 const {initialStory,finishStory}=await import('../src/narrative.js');const s=initialStory();assert.equal(finishStory(s,'restart',8),false);assert.equal(finishStory(s,'memory',9),false);assert.equal(finishStory(s,'unknown',9),false);assert.equal(finishStory(s,'restart',9),true);s.evidence=[0,2,4,7];assert.equal(finishStory(s,'memory',9),true);assert.equal(s.ending,'memory');
});
test('all nine story chapters have bilingual conversations, choices, and distinct evidence',async()=>{
 const {chapters,cityObjects}=await import('../src/narrative.js');assert.equal(chapters.length,9);assert.equal(cityObjects.length,5);for(const ch of chapters){assert.equal(ch.dialogue.length,4);assert.equal(ch.choices.length,2);for(const en of [0,1]){assert.ok(ch.name[en]&&ch.place[en]&&ch.log[en]);assert.ok(ch.evidence[0][en]&&ch.evidence[1][en]);for(const l of ch.dialogue)assert.ok(l.who&&l.text[en]);}}
 assert.equal(new Set(chapters.map(c=>c.evidence[0][0])).size,9);
});

test('all nine bosses have attainable multi-seed victories and real failed configurations',async()=>{
 const {bosses,runBoss,bossDefaults}=await import('../src/bosses.js');
 for(let i=0;i<9;i++){
  for(const param of bosses[i].params){const v=bosses[i].good[param.key];assert.ok(v>=param.min&&v<=param.max);assert.ok(Math.abs((v-param.min)/param.step-Math.round((v-param.min)/param.step))<1e-6,'winning configuration is reachable with the UI slider');}
  const good=runBoss(i,bosses[i].good);assert.equal(good.passed,true,`boss ${i} should be attainable`);assert.equal(good.runs.length,3);assert.deepEqual(good.seeds,[127,733,2027]);assert.ok(good.curve.length>0);assert.ok(good.arena);
  const bad=runBoss(i,bossDefaults(i));assert.equal(bad.passed,false,`boss ${i} should reject the unadjusted configuration`);
  assert.equal(runBoss(i,bosses[i].good).metrics.success,good.metrics.success,'seeds make outcomes repeatable');
 }
});
test('boss reports cannot unlock future sectors and old completion is preserved',async()=>{
 const {initialProgress,sanitizeProgress,recordBossVictory}=await import('../src/quest.js');const {runBoss,bosses}=await import('../src/bosses.js');const p=initialProgress();
 assert.equal(recordBossVictory(p,1,runBoss(1,bosses[1].good)),false);assert.equal(recordBossVictory(p,0,{index:0,passed:true}),false);
 const old=sanitizeProgress({version:1,cleared:[0,1],experiment:true,read:[],answers:[]});assert.deepEqual(old.cleared,[0,1]);assert.deepEqual(old.bosses,[0,1]);
 const invalid=runBoss(0,bosses[0].good);invalid.metrics.success=0;assert.equal(recordBossVictory(p,0,invalid),false);
});
