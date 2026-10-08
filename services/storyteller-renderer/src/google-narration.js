const fs=require('node:fs/promises');
const {ffmpeg}=require('./audio-pipeline');
const TTS_MODEL='gemini-2.5-flash-preview-tts';
const SCRIPT_MODEL='gemini-2.5-flash';
async function googleCall({model,body,config={},reservePaid,fetchImpl=fetch,env=process.env}) {
  const free=env.STORYTELLER_GOOGLE_FREE_API_KEY;
  const paid=env.STORYTELLER_GOOGLE_PAID_API_KEY;
  if(!free && !(config.paidFallbackEnabled===true&&paid))throw new Error('Google free-tier access is not configured');
  const send=async key=>{
    const response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
    if(!response.ok){const error=new Error(`Google ${model} request failed (${response.status})`);error.status=response.status;throw error;}
    return response.json();
  };
  if(free){try{return {data:await send(free),tier:'FREE'};}catch(error){if(error.status!==429)throw error;}}
  if(config.paidFallbackEnabled!==true||!paid)throw new Error('Free quota exhausted; paid fallback is disabled');
  if(typeof reservePaid!=='function')throw new Error('Paid budget controls are not configured');
  await reservePaid({model,inputChars:JSON.stringify(body).length,maxOutputTokens:body.generationConfig.maxOutputTokens});
  return {data:await send(paid),tier:'PAID'};
}
async function synthesizeScene({scene,language,style,voice='Charon',outputPath,config,reservePaid,fetchImpl,env}){
  const maxOutputTokens=Math.ceil(scene.duration*40+128);
  const result=await googleCall({model:TTS_MODEL,config,reservePaid,fetchImpl,env,body:{contents:[{parts:[{text:`Read only the story text in ${language}. ${style}, ${scene.emotion}. Aim for ${Math.max(1,scene.duration-.5)} seconds, clear diction and natural pauses. Do not speak these instructions. Story:\n${scene.text}`}]}],generationConfig:{responseModalities:['AUDIO'],maxOutputTokens,speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}}});
  const candidate=result.data.candidates?.[0];
  if(candidate?.finishReason && candidate.finishReason!=='STOP')throw new Error('Narration was incomplete; refusing clipped speech');
  const audio=candidate?.content?.parts?.find(p=>p.inlineData?.mimeType?.startsWith('audio/'))?.inlineData;
  if(!audio?.data || !/audio\/L16\s*;.*rate=24000/i.test(audio.mimeType))throw new Error('Google returned unsupported narration audio');
  const pcm=Buffer.from(audio.data,'base64');if(pcm.length<4800||pcm.length%2||pcm.length>scene.duration*48000*1.5)throw new Error('Invalid narration length');
  const raw=outputPath+'.pcm';await fs.writeFile(raw,pcm);await ffmpeg(['-y','-f','s16le','-ar','24000','-ac','1','-i',raw,outputPath]);
  return {tier:result.tier,usage:result.data.usageMetadata||null};
}
module.exports={googleCall,synthesizeScene,TTS_MODEL,SCRIPT_MODEL};
