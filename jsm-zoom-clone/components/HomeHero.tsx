'use client';

import { useSyncExternalStore } from 'react';

import { useGetCalls } from '@/hooks/useGetCalls';

// Ticks once per second so the clock flips over on the minute.
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
};
// Snapshot is the current minute, so React only re-renders when it changes.
const getMinute = () => Math.floor(Date.now() / 60_000);
// No clock on the server: it would render the server's timezone, not the viewer's.
const getServerMinute = () => null;

const formatMeetingTime = (date: Date) => {
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return isToday
    ? time
    : `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
};

const HomeHero = () => {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const { upcomingCalls, isLoading } = useGetCalls();

  const now = minute === null ? null : new Date(minute * 60_000);
  const time = now?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = now && new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now);

  // upcomingCalls is sorted newest first, so the soonest meeting is last.
  const nextStartsAt = upcomingCalls?.at(-1)?.state.startsAt;

  let banner = 'No upcoming meetings';
  if (isLoading || !upcomingCalls) banner = 'Loading meetings…';
  else if (nextStartsAt) banner = `Upcoming Meeting at: ${formatMeetingTime(new Date(nextStartsAt))}`;

  return (
    <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover">
      <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
        <h2 className="glassmorphism w-fit max-w-full rounded-sm px-4 py-2 text-center text-base font-normal">
          {banner}
        </h2>
        <div className="flex flex-col gap-2">
          <h1 className="min-h-10 text-4xl font-extrabold lg:min-h-[72px] lg:text-7xl">{time}</h1>
          <p className="min-h-7 text-lg font-medium text-sky-1 lg:min-h-8 lg:text-2xl">{date}</p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
