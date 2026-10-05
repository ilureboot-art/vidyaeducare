const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {validatePlan,sceneBed,fitScene,mixReel,ffmpeg,audioDuration}=require('../src/audio-pipeline');
const {googleCall}=require('../src/google-narration');
test('rejects scene hallucinated paths and invalid duration',()=>{
 assert.throws(()=>validatePlan({safe:true,scenes:[{text:'Story',duration:30,effects:['https://evil.test/audio']}]},30));
 assert.throws(()=>validatePlan({safe:true,scenes:[{text:'Story',duration:20,effects:[]}]},30));
 assert.throws(()=>validatePlan({safe:false,scenes:[]},30));
 assert.equal(validatePlan({safe:true,scenes:[{text:'Story',duration:30,effects:['OCEAN']}]},30).scenes.length,1);
});
test('free quota never silently spends paid money',async()=>{
 let calls=0;await assert.rejects(()=>googleCall({model:'gemini-2.5-flash',body:{generationConfig:{maxOutputTokens:10}},env:{STORYTELLER_GOOGLE_FREE_API_KEY:'free',STORYTELLER_GOOGLE_PAID_API_KEY:'paid'},fetchImpl:async()=>{calls++;return {ok:false,status:429};}}),/disabled/);assert.equal(calls,1);
});
test('paid fallback reserves before its single bounded call',async()=>{
 const events=[];const r=await googleCall({model:'gemini-2.5-flash',body:{generationConfig:{maxOutputTokens:10}},config:{paidFallbackEnabled:true},env:{STORYTELLER_GOOGLE_FREE_API_KEY:'free',STORYTELLER_GOOGLE_PAID_API_KEY:'paid'},reservePaid:async()=>events.push('reserve'),fetchImpl:async(_,o)=>{const key=o.headers['x-goog-api-key'];events.push(key);return key==='free'?{ok:false,status:429}:{ok:true,json:async()=>({})};}});assert.equal(r.tier,'PAID');assert.deepEqual(events,['free','reserve','paid']);
});
test('authentication failure does not switch to paid key',async()=>{
 let calls=0;await assert.rejects(()=>googleCall({model:'gemini-2.5-flash',body:{generationConfig:{maxOutputTokens:10}},config:{paidFallbackEnabled:true},env:{STORYTELLER_GOOGLE_FREE_API_KEY:'free',STORYTELLER_GOOGLE_PAID_API_KEY:'paid'},reservePaid:async()=>assert.fail('must not reserve'),fetchImpl:async()=>{calls++;return {ok:false,status:403};}}),/403/);assert.equal(calls,1);
});
test('real FFmpeg mix keeps exact requested duration, both ducking modes decode',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'story-audio-test-'));
 try{
  const voice=path.join(temp,'voice.wav'),fitted=path.join(temp,'fit.wav'),bed=path.join(temp,'bed.wav');
  await ffmpeg(['-y','-f','lavfi','-i','sine=frequency=180:duration=2','-ar','24000','-ac','1',voice]);
  await fitScene(voice,fitted,3);await fs.writeFile(bed,sceneBed({duration:3,emotion:'suspense',effects:['OCEAN','HORN']}));
  for(const duck of [true,false]){const output=path.join(temp,`reel-${duck}.mp3`);await mixReel({narration:fitted,bed,output,duration:3,duck});assert.ok(Math.abs(await audioDuration(output)-3)<.15);}
  await assert.rejects(()=>fitScene(voice,fitted,1),/clipping/);
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
