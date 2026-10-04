import HomeHero from '@/components/HomeHero';
import MeetingTypeList from '@/components/MeetingTypeList';

const HomePage = () => {
  return (
    <section className='flex size-full flex-col gap-10 text-white'>
      <HomeHero />
      <MeetingTypeList />
    </section>
  )
}

export default HomePage
