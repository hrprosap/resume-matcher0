import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar({ isAuthenticated }) {
  return (
    <nav className="bg-blue-600 dark:bg-blue-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          PROSAPIENS AI
        </Link>
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              <Link href="/" className="text-white">
                Dashboard
              </Link>
              <Link href="/#jobs" className="text-white">
                Jobs
              </Link>
              <Link href="/#applications" className="text-white">
                Applications
              </Link>
            </>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}