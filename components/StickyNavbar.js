import React from 'react';
import DarkModeToggle from './DarkModeToggle';

export default function StickyNavbar({ isAuthenticated }) {
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">PROSAPIENS AI RESUME MATCHER</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => scrollToSection('jobs')} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium">
              Job Postings
            </button>
            <button onClick={() => scrollToSection('applications')} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium">
              Applications
            </button>
            <DarkModeToggle />
            {isAuthenticated ? (
              <a href="/api/auth/logout" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Logout
              </a>
            ) : (
              <a href="/api/auth/google" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
