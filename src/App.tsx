/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import {
  createPlaylistWIthSongs,
  requestSpotifyAccessToken,
  searchTracks,
} from './lib/spotify';
import { useLocalStorage, useThrottle } from '@uidotdev/usehooks';

export const App = () => {
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
  const throttledQuery = useThrottle(searchQuery, 500);
  useEffect(() => {
    if (!throttledQuery) {
      return;
    }
    search();
  }, [throttledQuery]);

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
        window.location.href = '/';
      });
    }
  }, []);

  const search = async () => {
    const res = await searchTracks(searchQuery);
    setTracks(res.tracks.items);
  };

  const pxPerMinute = 50;
  const minsPerUnit = timeGoal / length;

  // const onDragEnd = (e: React.SyntheticEvent<HTMLDivElement>, track: any) => {
  //   const dropzoneElem = dropzone.current;
  //   if (!dropzoneElem) {
  //     return;
  //   }
  //   const rect = dropzoneElem.getBoundingClientRect();
  //   const top = rect.y;
  //   const clientY = e.clientY;
  //   const height = clientY - top;

  //   const selectedTime = height / pxPerMinute;

  //   let pos = 0;
  //   let totalDuration = 0;

  //   for (let i = 0; i < selectedTracks.length; i++) {
  //     const duration = track.duration_ms / 1000 / 60;
  //     totalDuration += duration;

  //     if (totalDuration > selectedTime) {
  //       pos = i - 1;
  //       break;
  //     }
  //   }
  //   // console.log(height, pos);
  //   setSelectedTracks((prev) => {
  //     const newArr = [...prev];
  //     newArr.splice(pos, 0, track);
  //     return newArr;
  //   });
  // };

  return (
    <div className='p-4'>
      <div className='grid grid-cols-2 relative gap-10'>
        <div className='flex flex-col'>
          <div className='flex justify-between items-start'>
            <div>
              <label className='flex gap-4'>
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

              <label className='flex gap-4'>
                <span className='font-bold'>Length</span>
                <input
                  type='number'
                  value={length}
                  onChange={(e) => setLength(Number(e.currentTarget.value))}
                />
              </label>

              <label className='flex gap-4'>
                <span className='font-bold'>Goal Time</span>
                <input
                  type='number'
                  value={timeGoal}
                  onChange={(e) => setTimeGoal(Number(e.currentTarget.value))}
                />
              </label>
            </div>
            <button
              className='text-blue-500 font-bold'
              onClick={() =>
                createPlaylistWIthSongs(selectedTracks).then(() =>
                  alert('Playlist created')
                )
              }
            >
              Create playlist
            </button>
          </div>

          <div className='flex flex-col mt-10 relative'>
            {Array.from({ length }).map((_, i) => (
              <div
                key={i}
                className='border-t-2 border-green-500 font-bold text-xl'
                style={{ height: minsPerUnit * pxPerMinute }}
              >
                {i + 1}
                {units}
              </div>
            ))}
            <div
              className='absolute right-0 top-0 flex flex-col w-4/5'
              ref={dropzone}
            >
              {selectedTracks.map((track, i) => (
                <div
                  key={track.ourId}
                  className='border-t-2 last:border-b-2 border-gray-300'
                  style={{
                    height: pxPerMinute * (track.duration_ms / 1000 / 60),
                  }}
                >
                  <div className='flex items-start gap-2 w-full'>
                    <img
                      src={track.album.images[0]?.url}
                      width={100}
                      height={100}
                    />
                    <div className='flex flex-col gap-2 w-full p-2'>
                      <div className='flex gap-2 text-blue-500'>
                        <button
                          onClick={() =>
                            setSelectedTracks((prev) => [
                              ...moveItem(prev, i, 'backward'),
                            ])
                          }
                        >
                          ⬆︎
                        </button>
                        <button
                          onClick={() =>
                            setSelectedTracks((prev) => [
                              ...moveItem(prev, i, 'forward'),
                            ])
                          }
                        >
                          ⬇︎
                        </button>
                        <button
                          onClick={() => {
                            const newArr = [...selectedTracks];
                            newArr.splice(i, 1);
                            setSelectedTracks(newArr);
                          }}
                          className='text-red-500 ml-auto'
                        >
                          ❌
                        </button>
                      </div>
                      <div>
                        {track.artists[0]?.name} - {track.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex flex-col sticky top-0 self-start'>
          <div className='flex items-center'>
            <label className='flex gap-4 items-center w-full'>
              <span className='font-bold shrink-0'>Search for a song</span>
              <input
                className='p-2 rounded-xl grow'
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                placeholder='Enter song name'
              />
            </label>
          </div>

          <div className='flex flex-col gap-2 mt-4'>
            {tracks.map((track) => (
              <button
                key={track.id}
                className='flex items-center gap-2'
                draggable
                // onDragEnd={(e) => onDragEnd(e, track)}
                onClick={() =>
                  setSelectedTracks((prev) => [
                    ...prev,
                    { ...track, ourId: crypto.randomUUID() },
                  ])
                }
              >
                <img src={track.album.images[0]?.url} width={40} height={40} />
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
