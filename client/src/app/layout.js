import Navbar from '@/components/Navbar'
import './globals.css'
import { Poppins } from 'next/font/google'
import Footer from '@/components/Footer'

const poppins = Poppins({ subsets: ['latin'], weight: "400" })

export const metadata = {
  title: 'Fiverr clone',
  description: 'Freelancer Web Application Powered by Nextjs and Nodejs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <div className={`flex bg-light dark:bg-black dark:text-white flex-col justify-between p-4 text-dark w-full min-h-screen `}>
          <Navbar />
            {children}
          <Footer />
        </div>
      </body>
    </html>
  )
}
