export const SIZE=7, GOAL=48, TRAPS=[17,30,38], WALLS=[9,10,23,24,32];
export class GridAgent {
 constructor(random=Math.random){this.random=random;this.alpha=.15;this.gamma=.95;this.epsilon=.2;this.reset();}
 reset(){this.q=Array.from({length:49},()=>[0,0,0,0]);this.state=0;this.episodes=0;this.steps=0;this.total=0;this.returns=[];this.successes=0;this.path=[0];}
 transition(s,a){let x=s%SIZE,y=Math.floor(s/SIZE);x+=[0,1,0,-1][a];y+=[-1,0,1,0][a];let n=y*SIZE+x;if(x<0||x>=SIZE||y<0||y>=SIZE||WALLS.includes(n))n=s;return {next:n,reward:n===GOAL?10:TRAPS.includes(n)?-5:-.04,done:n===GOAL||TRAPS.includes(n)};}
 step(explore=true){const s=this.state;const row=this.q[s];const best=Math.max(...row);const ties=row.map((v,i)=>v===best?i:-1).filter(i=>i>=0);const a=explore&&this.random()<this.epsilon?Math.floor(this.random()*4):ties[Math.floor(this.random()*ties.length)];const t=this.transition(s,a);this.q[s][a]+=this.alpha*(t.reward+(t.done?0:this.gamma*Math.max(...this.q[t.next]))-this.q[s][a]);this.state=t.next;this.path.push(t.next);this.total+=t.reward;this.steps++;if(t.done||this.steps>=160){this.episodes++;this.returns.push(this.total);if(t.next===GOAL)this.successes++;this.state=0;this.steps=0;this.total=0;this.path=[0];}return t;}
 train(n){const target=this.episodes+n;while(this.episodes<target)this.step();}
}
