import { auth } from '@clerk/nextjs/server';
import { ReactNode } from 'react';

import StreamVideoProvider from '@/providers/StreamClientProvider';

// Every route in the (root) group requires a signed-in user.
// Signed-out visitors are redirected to the Clerk sign-in page.
const RootLayout = async ({ children }: { children: ReactNode }) => {
  await auth.protect();

  return (
    <main>
      <StreamVideoProvider>{children}</StreamVideoProvider>
    </main>
  );
};

export default RootLayout;
