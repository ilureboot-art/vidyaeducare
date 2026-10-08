const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const SAMPLE_RATE = 24000;
const EFFECTS = new Set(['NONE','OCEAN','WIND','HORN','FOOTSTEPS','CLOCK','HEARTBEAT','SPLASH','IMPACT','ALARM']);

function validatePlan(plan, duration) {
  if (plan?.safe !== true || !Array.isArray(plan.scenes) || !plan.scenes.length || plan.scenes.length > 6) throw new Error('Invalid scene plan');
  if (!Number.isInteger(duration) || duration < 15 || duration > 300) throw new Error('Invalid duration');
  const scenes = plan.scenes.map(s => {
    if (typeof s.text !== 'string' || !s.text.trim() || s.text.length > 4000 || !Number.isFinite(s.duration) || s.duration < 2) throw new Error('Invalid scene narration');
    const effects = Array.isArray(s.effects) ? s.effects : [];
    if (effects.length > 3 || effects.some(e => !EFFECTS.has(e))) throw new Error('Unsupported scene effect');
    return {text:s.text.trim(),duration:s.duration,emotion:String(s.emotion || 'Natural').slice(0,120),effects};
  });
  const total = scenes.reduce((n,s) => n+s.duration,0);
  if (Math.abs(total-duration) > 1) throw new Error('Scene durations do not match requested duration');
  return {script:scenes.map(s=>s.text).join('\n'),scenes:scenes.map(s=>({...s,duration:s.duration*duration/total}))};
}

function run(program,args,timeout=120000) {
  return new Promise((resolve,reject)=>{
    const child=spawn(program,args,{stdio:['ignore','pipe','pipe']}); let stdout='',stderr='';
    const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error(`${program} timed out`));},timeout);
    child.stdout.on('data',d=>{stdout=(stdout+d).slice(-100000);});child.stderr.on('data',d=>{stderr=(stderr+d).slice(-10000);});
    child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(new Error(`${program} failed: ${stderr.slice(-1500)}`));});
  });
}
const ffmpeg=args=>run('ffmpeg',['-nostdin',...args]);
async function audioDuration(file){const seconds=Number(await run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file]));if(!Number.isFinite(seconds)||seconds<=0)throw new Error('Empty or invalid audio');return seconds;}
async function fitScene(input,output,duration){
  const source=await audioDuration(input);const speechBudget=duration-.25;const speed=Math.max(1,source/speechBudget);
  if(speed>1.25)throw new Error('Narration exceeds scene duration; shorten script instead of clipping speech');
  await ffmpeg(['-y','-i',input,'-af',`atempo=${speed},apad,atrim=duration=${duration},afade=t=out:st=${duration-.03}:d=0.03`,'-ar',String(SAMPLE_RATE),'-ac','1',output]);
}
function wav(samples){const pcm=Buffer.alloc(samples.length*2);samples.forEach((v,i)=>pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),i*2));const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(SAMPLE_RATE,24);h.writeUInt32LE(SAMPLE_RATE*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
// Original procedural score/foley; no remote URLs or unlicensed assets from model output.
function sceneBed(scene,{music=true,effects=true}={}) {
  const n=Math.ceil(scene.duration*SAMPLE_RATE),out=new Float32Array(n);let seed=1910,low=0;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  const emotional=/emotional|triumph|hope|hero/i.test(scene.emotion);const notes=emotional?[130.81,164.81,196]:[110,130.81,155.56];
  for(let i=0;i<n;i++){
    const t=i/SAMPLE_RATE,fade=Math.min(1,t/.3,(scene.duration-t)/.4);let v=0;
    if(music)for(const f of notes)v+=.012*Math.sin(2*Math.PI*f*t)+.004*Math.sin(2*Math.PI*2*f*t);
    low=.96*low+.04*noise();
    if(effects)for(const effect of scene.effects){
      const pulse=t%(.8),tail=Math.exp(-pulse*26);
      if(effect==='OCEAN')v+=low*.18*(.6+.4*Math.sin(t*1.1));
      if(effect==='WIND')v+=low*.08;
      if(effect==='HORN'&&t<2.2)v+=.06*Math.sin(2*Math.PI*138*t)*Math.sin(Math.PI*t/2.2)**2;
      if(effect==='HEARTBEAT')v+=.07*Math.sin(2*Math.PI*48*pulse)*tail;
      if(effect==='FOOTSTEPS')v+=noise()*.09*tail;
      if(effect==='CLOCK')v+=noise()*.05*Math.exp(-(t%1)*130);
      if(effect==='SPLASH'&&t<1.5)v+=low*.6*Math.exp(-t*2);
      if(effect==='IMPACT'&&t<2)v+=.14*Math.sin(2*Math.PI*(60*t-9*t*t))*Math.exp(-t*4);
      if(effect==='ALARM'&&t<3)v+=.025*Math.sin(2*Math.PI*(550*t-20*Math.cos(2*Math.PI*t)));
    }
    out[i]=v*Math.max(0,fade);
  }
  return wav(out);
}
async function mixReel({narration,bed,output,duration,duck=true}) {
  const duckFilter=duck?'[bed][sc]sidechaincompress=threshold=0.025:ratio=8:attack=15:release=350[d];':'[sc]anullsink;[bed]anull[d];';
  const filter=`[0:a]apad,atrim=duration=${duration},asplit=2[n][sc];[1:a]apad,atrim=duration=${duration},volume=0.65[bed];${duckFilter}[n][d]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.84:level=false[a]`;
  await ffmpeg(['-y','-i',narration,'-i',bed,'-filter_complex',filter,'-map','[a]','-ar','48000','-ac','2','-c:a','libmp3lame','-b:a','192k',output]);
  const actual=await audioDuration(output);if(Math.abs(actual-duration)>.15)throw new Error('Final duration failed quality check');
  if((await fs.stat(output)).size<duration*1000)throw new Error('Final audio is incomplete');
  // Full decode catches corrupt/truncated output before READY.
  await ffmpeg(['-v','error','-i',output,'-f','null','-']);return {duration:actual};
}
async function concatenate(files,output,temp){
  // All paths originate from our own temporary directory, never from model text.
  const list=path.join(temp,`${path.basename(output)}.txt`);await fs.writeFile(list,files.map(f=>`file '${f.replace(/'/g,"'\\''")}'`).join('\n'));
  await ffmpeg(['-y','-f','concat','-safe','0','-i',list,'-c','copy',output]);
}
module.exports={validatePlan,run,ffmpeg,audioDuration,fitScene,sceneBed,mixReel,concatenate};
