"use client"

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';
import { useUser } from '@clerk/nextjs';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { ReactNode, useEffect, useState } from 'react';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({children}: {children: ReactNode}) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const {user, isLoaded} = useUser();

  // Depend on the primitive fields rather than the Clerk `user` object, whose
  // identity changes on every session refresh and would force a reconnect.
  const userId = user?.id;
  const userName = user?.username || user?.id;
  const userImage = user?.imageUrl;

  useEffect(() => {
    if(!isLoaded || !userId){return};
    if(!apiKey) throw new Error("Stream API KEY Missing");

    const client = new StreamVideoClient({
        apiKey,
        user: {
            id: userId,
            name: userName,
            image: userImage,
        },
        tokenProvider,
    })
    // The client is an external connection, so creating it is a genuine effect
    // (this is the pattern Stream documents for React).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVideoClient(client)

    return () => {
      client.disconnectUser().catch(console.error);
      setVideoClient(undefined);
    };
  }, [isLoaded, userId, userName, userImage])
  
  if(!videoClient){
    return <Loader />
  }
  return (
    <StreamVideo client={videoClient}>
        {children}
    </StreamVideo>
  );
};
export default StreamVideoProvider;
