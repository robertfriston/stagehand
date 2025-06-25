import { google, youtube_v3 } from "googleapis";
import fs from "fs/promises";
import readline from "readline";
import { OAuth2Client, Credentials } from "google-auth-library";

const KEYFILE =
  "/Users/jobenvy/Documents/UTOPIA/keys/client_secret_781983992732-r28nrr8k9enm1cv22ekc26c89bm4ghpt.apps.googleusercontent.com.json";
const TOKEN_PATH = "./tokens.json";
const SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"];

async function loadTokens(): Promise<Credentials | null> {
  try {
    const data = await fs.readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveTokens(tokens: Credentials): Promise<void> {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("🔐 Tokens saved to tokens.json");
}

async function authorize(): Promise<OAuth2Client> {
  const creds = JSON.parse(await fs.readFile(KEYFILE, "utf-8"));
  const { client_id, client_secret, redirect_uris } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  const cachedTokens = await loadTokens();
  if (cachedTokens) {
    oAuth2Client.setCredentials(cachedTokens);
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("👉 Open this URL to authorize:\n", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = await new Promise<string>((resolve) =>
    rl.question("\n🔐 Paste the auth code here: ", resolve),
  );
  rl.close();

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  await saveTokens(tokens);
  return oAuth2Client;
}

let youtube: youtube_v3.Youtube;

async function getYouTubeClient(): Promise<youtube_v3.Youtube> {
  if (youtube) {
    return youtube;
  }
  const auth = await authorize();
  youtube = google.youtube({
    version: "v3",
    auth,
  });
  return youtube;
}

export interface YouTubeSearchResult {
  url: string;
  channel: string;
  title: string;
  duration?: number; // in seconds
}

export async function searchYouTube(
  query: string,
): Promise<YouTubeSearchResult | null> {
  try {
    const client = await getYouTubeClient();
    const response = await client.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults: 1,
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      console.log(`No YouTube results found for "${query}"`);
      return null;
    }

    const video = items[0];
    const videoId = video.id?.videoId;
    const title = video.snippet?.title;
    const channel = video.snippet?.channelTitle;

    if (!videoId || !title || !channel) {
      return null;
    }

    // Fetch video details for duration
    let durationSeconds: number | undefined = undefined;
    try {
      const detailsResp = await client.videos.list({
        part: ["contentDetails"],
        id: [videoId],
      });
      const details = detailsResp.data.items?.[0]?.contentDetails;
      if (details && details.duration) {
        // Parse ISO 8601 duration to seconds
        durationSeconds = parseISO8601Duration(details.duration);
      }
    } catch (err) {
      console.warn("Could not fetch video duration:", err);
    }

    return {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      channel,
      title,
      duration: durationSeconds,
    };
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return null;
  }
}

// Helper to parse ISO 8601 duration (e.g., PT1H2M30S) to seconds
function parseISO8601Duration(iso: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, h, m, s] = regex.exec(iso) || [];
  return (parseInt(h || "0") * 3600) + (parseInt(m || "0") * 60) + (parseInt(s || "0") || 0);
}
