import {runBoss} from './bosses.js';
self.onmessage=({data})=>{try{const report=runBoss(data.index,data.params,value=>self.postMessage({type:'progress',value}));self.postMessage({type:'result',report});}catch(error){self.postMessage({type:'error',message:String(error.message)});}};
