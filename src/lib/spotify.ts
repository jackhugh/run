/* eslint-disable @typescript-eslint/no-explicit-any */
const CLIENT_ID = '53e1f4e1efd445baa97318152d948ed0';
const REDIRECT_URI =
  window.location.protocol === 'http:'
    ? 'http://localhost:3000/run/'
    : 'https://jackhugh.github.io/run/';

const generateRandomString = (length: number) => {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const requestSpotifyAuth = async () => {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const scope =
    'user-read-private user-read-email user-top-read playlist-modify-private';
  const authUrl = new URL('https://accounts.spotify.com/authorize');

  window.localStorage.setItem('code_verifier', codeVerifier);

  const params = {
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
};

export const requestSpotifyAccessToken = async (code: string) => {
  const codeVerifier = localStorage.getItem('code_verifier') as string;

  const url = 'https://accounts.spotify.com/api/token';
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  localStorage.setItem('access_token', response.access_token);
};

export const searchTracks = async (query: string) => {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track&market=GB&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }
  );
  if (res.status < 200 || res.status >= 400) {
    await requestSpotifyAuth();
    return;
  }
  const json = await res.json();
  return json;
};

export const getUser = async () => {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  if (res.status < 200 || res.status >= 400) {
    await requestSpotifyAuth();
    return;
  }
  const json = await res.json();
  return json;
};

export const createPlaylist = async () => {
  const user = await getUser();

  const res = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      method: 'POST',
      body: JSON.stringify({
        name: 'Generated Playlist',
        public: false,
      }),
    }
  );
  if (res.status < 200 || res.status >= 400) {
    await requestSpotifyAuth();
    return;
  }
  const json = await res.json();
  return json;
};

export const createPlaylistWIthSongs = async (tracks: any[]) => {
  const playlist = await createPlaylist();
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?uris=${tracks
      .map((track) => track.uri)
      .join(',')}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      method: 'PUT',
      body: JSON.stringify({
        range_start: 1,
        insert_before: 1,
      }),
    }
  );
  if (res.status < 200 || res.status >= 400) {
    await requestSpotifyAuth();
    return;
  }
  return playlist;
};

export const getTopTracks = async () => {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }
  );
  if (res.status < 200 || res.status >= 400) {
    await requestSpotifyAuth();
    return;
  }
  const json = await res.json();
  return json;
};
