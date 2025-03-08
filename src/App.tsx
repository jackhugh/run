/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import {
  createPlaylistWIthSongs,
  getTopTracks,
  requestSpotifyAccessToken,
  requestSpotifyAuth,
  searchTracks,
} from './lib/spotify';
import { useDebounce, useLocalStorage } from '@uidotdev/usehooks';

export const App = () => {
  const scaleDefault = 50;
  const [units, setUnits] = useState<'km' | 'mi'>('mi');
  const [length, setLength] = useState(13);
  const [timeGoal, setTimeGoal] = useState(120);
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const dropzone = useRef<HTMLDivElement>(null);
  const [selectedTracks, setSelectedTracks] = useLocalStorage<any[]>(
    'selected_tracks',
    []
  );
  const [scale, setScale] = useState(scaleDefault);
  const debouncedQuery = useDebounce(searchQuery, 200);
  useEffect(() => {
    if (!debouncedQuery) {
      getTopTracks().then((res) => setTracks(res.items));
      return;
    }
    search();
  }, [debouncedQuery]);

  const hasInit = useRef(false);
  useEffect(() => {
    if (hasInit.current) {
      return;
    }
    hasInit.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    if (typeof code === 'string') {
      requestSpotifyAccessToken(code).then(() => {
        window.location.search = '';
      });
    }

    if (!localStorage.getItem('access_token')) {
      requestSpotifyAuth();
    }
  }, []);

  const search = async () => {
    const res = await searchTracks(searchQuery);
    setTracks(res.tracks.items);
  };

  const pxPerMinute = 50 * (scale / scaleDefault);
  const minsPerUnit = timeGoal / length;

  return (
    <div className='p-4 h-screen'>
      <div className='grid grid-cols-2 relative gap-10 h-full grid-rows-[100%]'>
        <div className='flex flex-col'>
          <div className='flex justify-between items-start'>
            <div className='grid gap-y-2 grid-cols-[max-content_auto] *:grid-cols-subgrid *:col-[1/-1] *:grid **:h-full grid-rows-fr  *:gap-4 *:items-start'>
              <label>
                <span className='font-bold'>Units</span>
                <select
                  value={units}
                  onChange={(e) =>
                    setUnits(e.currentTarget.value as 'km' | 'mi')
                  }
                >
                  <option value='km'>Kilometers</option>
                  <option value='mi'>Miles</option>
                </select>
              </label>

              <label>
                <span className='font-bold'>Length</span>
                <input
                  type='number'
                  value={length}
                  onChange={(e) => setLength(e.currentTarget.valueAsNumber)}
                />
              </label>

              <label>
                <span className='font-bold'>Goal Time</span>
                <input
                  type='number'
                  value={timeGoal}
                  onChange={(e) => setTimeGoal(e.currentTarget.valueAsNumber)}
                />
              </label>

              <label>
                <span className='font-bold'>Scale</span>
                <input
                  type='range'
                  value={scale}
                  min={5}
                  max={100}
                  onChange={(e) => setScale(e.currentTarget.valueAsNumber)}
                />
              </label>
            </div>
            <button
              className='text-blue-500 font-bold flex items-center gap-2'
              onClick={() =>
                createPlaylistWIthSongs(selectedTracks).then((res: any) => {
                  window.location.href = res.external_urls.spotify;
                })
              }
            >
              Create playlist <span className='text-3xl'>🏁</span>
            </button>
          </div>

          <div className='mt-10 relative h-full overflow-y-scroll rounded-xl'>
            <div className='flex flex-col'>
              {Array.from({ length }).map((_, i) => (
                <div
                  key={i}
                  className='odd:bg-green-100 even:bg-green-50 font-bold text-xl p-2'
                  style={{ height: minsPerUnit * pxPerMinute }}
                >
                  {i + 1} {units}
                </div>
              ))}
            </div>
            <div
              className='absolute right-4 top-0 flex flex-col w-4/5'
              ref={dropzone}
            >
              {selectedTracks.map((track, i) => (
                <div
                  className='bg-white relative not-[:last-child]:border-b-2 border-gray-300 overflow-hidden'
                  key={track.ourId}
                  style={{
                    height: pxPerMinute * (track.duration_ms / 1000 / 60),
                  }}
                >
                  {/* <div
                    className='absolute inset-0 w-full h-full'
                    style={{
                      backgroundImage: `url("${track.album.images[0]?.url}")`,
                      backgroundPosition: 'center',
                      filter: 'blur(20px) grayscale(50%)',
                    }}
                  /> */}

                  <div className='flex items-center gap-2 p-2 relative h-full'>
                    <div className='flex flex-col gap-2'>
                      <button
                        className='text-blue-500'
                        onClick={() =>
                          setSelectedTracks((prev) => [
                            ...moveItem(prev, i, 'backward'),
                          ])
                        }
                      >
                        ⬆︎
                      </button>
                      <button
                        className='text-blue-500'
                        onClick={() =>
                          setSelectedTracks((prev) => [
                            ...moveItem(prev, i, 'forward'),
                          ])
                        }
                      >
                        ⬇︎
                      </button>
                    </div>

                    <img
                      src={track.album.images[0]?.url}
                      className='aspect-square rounded-[10%] max-h-20 h-full'
                    />

                    <div className='font-medium'>
                      {track.artists[0]?.name} - {track.name}
                    </div>

                    <button
                      onClick={() => {
                        const newArr = [...selectedTracks];
                        newArr.splice(i, 1);
                        setSelectedTracks(newArr);
                      }}
                      className='text-red-500 ml-auto self-start'
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex flex-col'>
          <div className='flex items-center'>
            <label className='flex gap-4 items-start w-full'>
              <span className='font-bold shrink-0'>Search for a song</span>
              <input
                className='grow'
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                placeholder='Enter song name'
              />
            </label>
          </div>

          <div className='flex flex-col gap-2 mt-4 h-full overflow-y-scroll'>
            {tracks.map((track) => (
              <button
                key={track.id}
                className='flex items-center gap-2'
                draggable
                onClick={() =>
                  setSelectedTracks((prev) => [
                    ...prev,
                    { ...track, ourId: crypto.randomUUID() },
                  ])
                }
              >
                <img
                  src={track.album.images[0]?.url}
                  width={40}
                  height={40}
                  className='rounded'
                />
                {track.artists[0]?.name} - {track.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function moveItem<T>(
  arr: T[],
  fromIndex: number,
  direction: 'forward' | 'backward'
): T[] {
  // Check if the fromIndex is valid
  if (fromIndex < 0 || fromIndex >= arr.length) {
    throw new Error('Invalid fromIndex');
  }

  // Calculate the new index
  const newIndex = direction === 'forward' ? fromIndex + 1 : fromIndex - 1;

  // Make sure the new index is within bounds
  if (newIndex < 0 || newIndex >= arr.length) {
    return arr; // No change if out of bounds
  }

  // Swap the elements
  const result = [...arr];
  [result[fromIndex], result[newIndex]] = [result[newIndex], result[fromIndex]];

  return result;
}
