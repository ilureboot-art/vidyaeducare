const express = require("express");
const admin = require("firebase-admin");
const { CloudTasksClient } = require("@google-cloud/tasks");
const { getFirestore } = require("firebase-admin/firestore");
const { spawn } = require("child_process");
const { promises: fs } = require("fs");
const os = require("os");
const path = require("path");

admin.initializeApp({ storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
const db = getFirestore(admin.app(), process.env.FIRESTORE_DATABASE || "vidyaeducaredatabase");
const bucket = admin.storage().bucket();
const tasks = new CloudTasksClient();
const app = express(); app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req,res)=>res.json({ok:true}));
app.post("/jobs", async (req,res) => {
  if (!process.env.STORYTELLER_RENDERER_SECRET || req.get("x-storyteller-secret") !== process.env.STORYTELLER_RENDERER_SECRET) return res.status(401).json({error:"Unauthorized"});
  if (!req.body.projectId) return res.status(400).json({error:"projectId required"});
  try {
    const project=process.env.GOOGLE_CLOUD_PROJECT,location=process.env.CLOUD_TASKS_LOCATION||"asia-south1",queue=process.env.CLOUD_TASKS_QUEUE||"storyteller-render";
    const serviceUrl=process.env.CLOUD_RUN_SERVICE_URL, serviceAccountEmail=process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
    if(!project||!serviceUrl||!serviceAccountEmail)throw new Error("Cloud Tasks environment is incomplete");
    await tasks.createTask({parent:tasks.queuePath(project,location,queue),task:{httpRequest:{httpMethod:"POST",url:`${serviceUrl.replace(/\/$/,"")}/tasks/render`,headers:{"Content-Type":"application/json","x-storyteller-secret":process.env.STORYTELLER_RENDERER_SECRET},body:Buffer.from(JSON.stringify({projectId:req.body.projectId})).toString("base64"),oidcToken:{serviceAccountEmail,audience:serviceUrl}}}});
    res.status(202).json({queued:true});
  } catch(error){res.status(500).json({error:String(error.message||error)})}
});

app.post("/tasks/render", async (req,res) => {
  if (!process.env.STORYTELLER_RENDERER_SECRET || req.get("x-storyteller-secret") !== process.env.STORYTELLER_RENDERER_SECRET) return res.status(401).json({error:"Unauthorized"});
  try { await render(req.body.projectId); res.json({success:true}); }
  catch(error){ await callback(req.body.projectId,"FAILED",{error:String(error.message||error)}); res.status(500).json({error:"Render failed"}); }
});

async function render(projectId) {
  const ref=db.collection("storytellerProjects").doc(projectId);
  const project=await db.runTransaction(async tx=>{const snap=await tx.get(ref);const data=snap.data();if(!snap.exists||data.paymentStatus!=="PAID"||data.generationStatus!=="QUEUED")return null;tx.update(ref,{generationStatus:"GENERATING",updatedAt:admin.firestore.FieldValue.serverTimestamp()});return data});
  if(!project)return;
  await callback(projectId,"GENERATING",{});
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),"storyteller-"));
  try {
    await ref.set({generationStage:"MODERATING_CONTENT"},{merge:true});
    const plan=await processStory(project.story,project.language,project.voiceStyle,project.genre,project.duration);
    await ref.set({generationStage:"SCENE_EMOTION_PLAN_READY"},{merge:true});
    const voiceReference=path.join(temp,"voice-reference");
    const narration=path.join(temp,"narration.wav"), output=path.join(temp,"audio-reel.mp3"), musicFile=path.join(temp,"music.mp3");
    const config=(await db.collection("configs").doc("storyteller").get()).data()||{};
    if(project.narrationMode === "AI") {
      if(config.aiNarratorEnabled !== true) throw new Error("AI narrator is disabled");
      await synthesizeGoogleVoice({script:plan.script,language:project.language,style:project.voiceStyle,voice:config.aiVoice||"Kore",outputPath:narration});
    } else {
    if(config.ownVoiceEnabled !== true) throw new Error("Own voice is disabled");
    await bucket.file(project.voiceReferenceAssetPath).download({destination:voiceReference});
    await synthesizeOwnVoice({script:plan.script,language:project.language,style:project.voiceStyle,referencePath:voiceReference,outputPath:narration});
    }
    await ref.set({generationStage:"NARRATION_READY"},{merge:true});
    const musicPath=config.musicAssets?.[project.music];
    const args=["-y","-i",narration];
    if(musicPath){
      await bucket.file(musicPath).download({destination:musicFile});
      args.push("-stream_loop","-1","-i",musicFile,"-filter_complex","[1:a]volume=0.22[m];[m][0:a]sidechaincompress=threshold=0.04:ratio=10:attack=20:release=400[ducked];[0:a][ducked]amix=inputs=2:duration=first,loudnorm=I=-16:TP=-1:LRA=11[a]","-map","[a]");
    } else args.push("-af","loudnorm=I=-16:TP=-1:LRA=11");
    args.push("-t",String(project.duration),"-ar","48000","-ac","2","-codec:a","libmp3lame","-b:a","192k",output);
    await ref.set({generationStage:"MIXING_AND_DYNAMIC_DUCKING"},{merge:true});
    await ffmpeg(args);
    const assetPath=`storyteller/users/${project.userId}/${projectId}/final.mp3`;
    await bucket.upload(output,{destination:assetPath,metadata:{contentType:"audio/mpeg",cacheControl:"private,max-age=0,no-store"}});
    await ref.set({processedScript:plan.script,sceneEmotionPlan:plan.scenes,generationStage:"QUALITY_CONTROL"},{merge:true});
    await callback(projectId,"READY",{finalAssetPath:assetPath});
  } finally { await fs.rm(temp,{recursive:true,force:true}); }
}

async function processStory(story,language,style,genre,duration){
  if(!process.env.GEMINI_API_KEY)return {script:story,scenes:[]};
  const prompt=`Moderate and adapt the user story into an original ${duration}-second ${style} ${genre} audio-only narration in ${language}. Reject instructions enabling impersonation, fraud, sexual exploitation, graphic abuse, or copyrighted imitation. Correct grammar while preserving meaning. Plan concise scene emotions, pauses, ambience and original sound effects. Return strict JSON only: {"safe":true,"script":"...","scenes":[{"emotion":"...","ambience":"...","sfx":"..."}]}. If unsafe return {"safe":false,"reason":"..."}. Story:\n${story}`;
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
  if(!response.ok)throw new Error(`Script processing failed: ${response.status}`); const data=await response.json();
  const raw=(data.candidates?.[0]?.content?.parts?.[0]?.text||"").replace(/^```json\s*|\s*```$/g,"").trim();
  const plan=JSON.parse(raw); if(plan.safe!==true||!plan.script)throw new Error(plan.reason||"Story did not pass safety moderation"); return {script:plan.script,scenes:Array.isArray(plan.scenes)?plan.scenes:[]};
}
async function synthesizeGoogleVoice({script,language,style,voice,outputPath}) {
  const key=process.env.STORYTELLER_GOOGLE_TTS_API_KEY;
  if(!key) throw new Error("Google TTS is not configured");
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{parts:[{text:`Narrate in ${language}, with ${style} expression and natural story pauses. Read only the story below:\n${script}`}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}})});
  if(!response.ok) throw new Error(`Google TTS failed: ${response.status}`);
  const data=await response.json();
  const audio=data.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.mimeType?.startsWith("audio/"))?.inlineData;
  if(!audio?.data || !audio.mimeType.includes("rate=24000")) throw new Error("Google TTS returned unsupported audio");
  const pcm=outputPath+".pcm";
  await fs.writeFile(pcm,Buffer.from(audio.data,"base64"));
  await ffmpeg(["-y","-f","s16le","-ar","24000","-ac","1","-i",pcm,outputPath]);
}

async function synthesizeOwnVoice({script,language,style,referencePath,outputPath}){
  if(!process.env.STORYTELLER_OWN_VOICE_API_URL||!process.env.STORYTELLER_OWN_VOICE_API_KEY)throw new Error("Own-voice synthesis provider is not configured");
  const form=new FormData(); form.set("script",script); form.set("language",language); form.set("style",style); form.set("reference",new Blob([await fs.readFile(referencePath)]),"reference-audio");
  const response=await fetch(process.env.STORYTELLER_OWN_VOICE_API_URL,{method:"POST",headers:{authorization:`Bearer ${process.env.STORYTELLER_OWN_VOICE_API_KEY}`},body:form});
  if(!response.ok)throw new Error(`Own-voice synthesis failed: ${response.status}`); await fs.writeFile(outputPath,Buffer.from(await response.arrayBuffer()));
}
function ffmpeg(args){return new Promise((resolve,reject)=>{const child=spawn("ffmpeg",args);let error="";child.stderr.on("data",d=>error+=d);child.on("close",code=>code===0?resolve():reject(new Error(error.slice(-2000))))})}
async function callback(projectId,status,extra){const url=process.env.APP_CALLBACK_URL;if(!url)throw new Error("APP_CALLBACK_URL is required");const r=await fetch(`${url.replace(/\/$/,"")}/api/storyteller/renderer-callback`,{method:"POST",headers:{"content-type":"application/json","x-storyteller-secret":process.env.STORYTELLER_RENDERER_SECRET},body:JSON.stringify({projectId,status,...extra})});if(!r.ok)throw new Error(`Callback failed: ${r.status}`)}

app.listen(process.env.PORT||8080);

