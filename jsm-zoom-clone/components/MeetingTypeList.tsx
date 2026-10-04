'use client';
import React, { useState } from 'react'
import HomeCard from './HomeCard';
import { useRouter } from 'next/navigation';
import MeetingModal from './MeetingModal';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';
import { useToast } from './ui/use-toast';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Input } from './ui/input';

type MeetingState = 'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined;

// A factory, not a constant, so each form starts from the current time.
const getInitialValues = () => ({
  dateTime: new Date(),
  description: '',
  link: '',
});

// Accepts a full meeting link (from any host) or a bare meeting ID and
// returns the in-app path to open, or null if nothing usable was entered.
const getMeetingPath = (input: string) => {
  const value = input.trim();
  if (!value) return null;

  const match = value.match(/\/meeting\/([^/?#\s]+)(\?[^#\s]*)?/);
  if (match) return `/meeting/${match[1]}${match[2] ?? ''}`;

  if (/^[\w-]+$/.test(value)) return `/meeting/${value}`;

  return null;
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<MeetingState>(undefined);
  const [values, setValues] = useState(getInitialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const [isCreating, setIsCreating] = useState(false);
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();

  const openModal = (state: MeetingState) => {
    setValues(getInitialValues());
    setCallDetail(undefined);
    setMeetingState(state);
  };

  const createMeeting = async () => {
    if (isCreating) return;
    if (!client || !user) {
      toast({ title: 'Video service is not ready yet, please try again' });
      return;
    }

    const isInstant = meetingState === 'isInstantMeeting';
    const startsAt = isInstant ? new Date() : values.dateTime;

    if (!isInstant && startsAt.getTime() < Date.now() - 60_000) {
      toast({ title: 'Please select a date and time in the future' });
      return;
    }

    setIsCreating(true);
    try {
      const call = client.call('default', crypto.randomUUID());
      const description =
        values.description.trim() || (isInstant ? 'Instant Meeting' : 'Scheduled Meeting');

      await call.getOrCreate({
        data: {
          starts_at: startsAt.toISOString(),
          custom: {
            description,
          },
        },
      });

      if (isInstant) {
        router.push(`/meeting/${call.id}`);
      } else {
        setCallDetail(call);
      }
      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.error(error)
      toast({ title: 'Failed to create Meeting' });
    } finally {
      setIsCreating(false);
    }
  };

  const joinMeeting = () => {
    const meetingPath = getMeetingPath(values.link);
    if (!meetingPath) {
      toast({ title: 'Please enter a meeting link or meeting ID' });
      return;
    }
    router.push(meetingPath);
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <HomeCard
            img="/icons/add-meeting.svg"
            title="New Meeting"
            description="Start an instant meeting"
            handleClick={() => openModal('isInstantMeeting')}
        />
        <HomeCard
            img="/icons/join-meeting.svg"
            title="Join Meeting"
            description="via invitation link"
            className="bg-blue-1"
            handleClick={() => openModal('isJoiningMeeting')}
        />
        <HomeCard
            img="/icons/schedule.svg"
            title="Schedule Meeting"
            description="Plan your meeting"
            className="bg-purple-1"
            handleClick={() => openModal('isScheduleMeeting')}
        />
        <HomeCard
            img="/icons/recordings.svg"
            title="View Recordings"
            description="Meeting Recordings"
            className="bg-yellow-1"
            handleClick={() => router.push('/recordings')}
        />

        {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
          buttonText={isCreating ? 'Scheduling…' : undefined}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={values.description}
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date: Date | null) => date && setValues({ ...values, dateTime: date })}
              minDate={new Date()}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded-sm bg-dark-3 p-2 focus:outline-hidden"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image={'/icons/checked.svg'}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={joinMeeting}
      >
        <Input
          placeholder="Meeting link or ID"
          value={values.link}
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText={isCreating ? 'Starting…' : 'Start Meeting'}
        handleClick={createMeeting}
      />

    </section>
  )
}

export default MeetingTypeList
