import { GoogleAuth } from "google-auth-library";

export async function dispatchStorytellerRenderer(projectId: string) {
  const url = process.env.STORYTELLER_RENDERER_URL;
  if (!url) throw new Error("StoryTeller renderer is not configured.");
  const serviceUrl = url.replace(/\/$/, "");
  const client = await new GoogleAuth().getIdTokenClient(serviceUrl);
  const response = await client.request({
    url: `${serviceUrl}/jobs`, method: "POST",
    headers: { "content-type": "application/json", "x-storyteller-secret": process.env.STORYTELLER_RENDERER_SECRET || "" },
    data: { projectId }, validateStatus: () => true,
  });
  if (response.status < 200 || response.status >= 300) throw new Error(`Renderer returned ${response.status}`);
}
