import fs from "fs";
import fetch from "node-fetch";
import "dotenv/config";

const POLL_INTERVAL = 1000; // every 1s
const ZONE = "America/New_York";

let currentDay = getTodayString();
let todayTracks: { id: string; name: string; artist: string, url: string, imgsrc: string}[] = [];

function getTodayString() {
  return new Date().toLocaleDateString("en-US", { timeZone: ZONE });
}
interface CurrentlyPlaying {
  item: {
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    }
    album: {images : {url:string}[]}
    artists: { name: string }[];
  };
  progress_ms: number;
  is_playing: boolean;
}
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}


async function fetchToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
    }),
  });

  const data = (await res.json()) as SpotifyTokenResponse;
  return data.access_token;
}

async function pollTrack() {
  try {
    const accessToken = await fetchToken();

    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204) return; // nothing playing
    const data = (await res.json()) as CurrentlyPlaying;
    const song = data.item;
    if (!song) return;
    const id = song.id;
    const name = song.name;
    const url = song.external_urls.spotify
    const imgsrc = song.album.images[0].url
    
    const artist = song.artists.map((a: {name: string}) => a.name).join(", ");
    if (data.is_playing == false) return;
    // Reset at midnight EST
    const newDay = getTodayString();
    if (newDay !== currentDay) {
      currentDay = newDay;
      todayTracks = [];
    }

    const exists = todayTracks.some((t) => t.id === id);
    if (!exists && data.progress_ms > 10000) {
      todayTracks.push({ id, name, artist, url, imgsrc });
      console.log("Added song:", name, "by", artist);
      fs.writeFileSync("./today.json", JSON.stringify(todayTracks, null, 2));
    }
  } catch (e) {
    console.error("Error polling:", e);
  }
}

// Start polling loop
setInterval(pollTrack, POLL_INTERVAL);
