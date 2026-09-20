const express = require("express");
const admin = require("firebase-admin");
const textToSpeech = require("@google-cloud/text-to-speech");
const { CloudTasksClient } = require("@google-cloud/tasks");
const { getFirestore } = require("firebase-admin/firestore");
const { spawn } = require("child_process");
const { promises: fs } = require("fs");
const os = require("os");
const path = require("path");

admin.initializeApp({ storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
const db = getFirestore(admin.app(), process.env.FIRESTORE_DATABASE || "vidyaeducaredatabase");
const bucket = admin.storage().bucket();
const tts = new textToSpeech.TextToSpeechClient();
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
    await ref.set({generationStage:"PREPARING_STORY"},{merge:true});
    const script=await processStory(project.story,project.language,project.voiceStyle,project.duration);
    await ref.set({generationStage:"SCRIPT_READY"},{merge:true});
    const audio=path.join(temp,"voice.mp3"), subtitles=path.join(temp,"subtitles.srt"), output=path.join(temp,"reel.mp4"), musicFile=path.join(temp,"music.mp3");
    const languageCode={Marathi:"mr-IN",Hindi:"hi-IN",English:"en-IN"}[project.language]||"en-IN";
    const [voice]=await tts.synthesizeSpeech({input:{text:script},voice:{languageCode,name:project.voice||undefined},audioConfig:{audioEncoding:"MP3",speakingRate:1}});
    await fs.writeFile(audio,voice.audioContent);
    await ref.set({generationStage:"VOICE_READY"},{merge:true});
    await fs.writeFile(subtitles,buildSrt(script,project.duration));
    await ref.set({generationStage:"SUBTITLES_READY"},{merge:true});
    const config=(await db.collection("configs").doc("storyteller").get()).data()||{}; const musicPath=config.musicAssets?.[project.music];
    const base=["-y","-f","lavfi","-i",`color=c=0x101827:s=1080x1920:r=30:d=${project.duration}`,"-i",audio];
    if(musicPath){await bucket.file(musicPath).download({destination:musicFile});base.push("-stream_loop","-1","-i",musicFile,"-filter_complex",`[1:a]volume=1[voice];[2:a]volume=0.15[music];[voice][music]amix=inputs=2:duration=first[a]`,`-map`,`0:v`,`-map`,`[a]`)}
    base.push("-vf",`subtitles=${escapeFilter(subtitles)}:force_style='FontName=Noto Sans,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Alignment=2,MarginV=180'`,"-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p","-c:a","aac","-shortest",output);
    await ref.set({generationStage:"RENDERING_REEL"},{merge:true});
    await ffmpeg(base);
    const assetPath=`storyteller/users/${project.userId}/${projectId}/final.mp4`;
    await bucket.upload(output,{destination:assetPath,metadata:{contentType:"video/mp4",cacheControl:"private,max-age=0,no-store"}});
    await ref.set({processedScript:script,generationStage:"FINALIZING"},{merge:true});
    await callback(projectId,"READY",{finalAssetPath:assetPath});
  } finally { await fs.rm(temp,{recursive:true,force:true}); }
}

async function processStory(story,language,style,duration){
  if(!process.env.GEMINI_API_KEY)return story;
  const prompt=`Rewrite this story for a ${duration}-second ${style} voice narration in ${language}. Preserve meaning. Return only the narration, no markdown:\n${story}`;
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
  if(!response.ok)throw new Error(`Script processing failed: ${response.status}`); const data=await response.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()||story;
}
function buildSrt(script,duration){const words=script.split(/\s+/);const chunks=[];for(let i=0;i<words.length;i+=8)chunks.push(words.slice(i,i+8).join(" "));return chunks.map((c,i)=>`${i+1}\n${clock(i*duration/chunks.length)} --> ${clock((i+1)*duration/chunks.length)}\n${c}\n`).join("\n")}
function clock(seconds){const ms=Math.floor((seconds%1)*1000),s=Math.floor(seconds)%60,m=Math.floor(seconds/60)%60,h=Math.floor(seconds/3600);return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`}
function escapeFilter(p){return p.replace(/\\/g,"/").replace(/:/g,"\\:").replace(/'/g,"\\'")}
function ffmpeg(args){return new Promise((resolve,reject)=>{const child=spawn("ffmpeg",args);let error="";child.stderr.on("data",d=>error+=d);child.on("close",code=>code===0?resolve():reject(new Error(error.slice(-2000))))})}
async function callback(projectId,status,extra){const url=process.env.APP_CALLBACK_URL;if(!url)throw new Error("APP_CALLBACK_URL is required");const r=await fetch(`${url.replace(/\/$/,"")}/api/storyteller/renderer-callback`,{method:"POST",headers:{"content-type":"application/json","x-storyteller-secret":process.env.STORYTELLER_RENDERER_SECRET},body:JSON.stringify({projectId,status,...extra})});if(!r.ok)throw new Error(`Callback failed: ${r.status}`)}

app.listen(process.env.PORT||8080);
