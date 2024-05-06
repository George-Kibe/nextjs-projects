'use client'

import Alert from '@/components/Alert'
import MeetingRoom from '@/components/MeetingRoom'
import MeetingSetup from '@/components/MeetingSetup'
import { useGetCallById } from '@/hooks/useGetCallById'
import { useUser } from '@clerk/nextjs'
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk'
import { Loader } from 'lucide-react'
import React, { useState } from 'react'

const Meeting = ({params}: { params: {id: string}}) => {
  const {id} = params;
  // console.log("id: ", id)
  const {user, isLoaded} = useUser();
  const [setupComplete, setSetupComplete] = useState(false);
  const { call, isCallLoading } = useGetCallById(id);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call) return (
    <p className="text-center text-3xl font-bold text-white">
      Call Not Found
    </p>
  );

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed = call.type === 'invited' && (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {
            !setupComplete? (<MeetingSetup setIsSetupComplete={setSetupComplete}/>):
            (<MeetingRoom />)
          }
        </StreamTheme>
      </StreamCall>
    </main>
  )
}

export default Meeting