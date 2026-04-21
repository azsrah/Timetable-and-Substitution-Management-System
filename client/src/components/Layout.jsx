// ─────────────────────────────────────────────────────────
// Layout.jsx — Main App Shell
// Wraps all authenticated pages with the Sidebar and Topbar.
// The page content (children) is rendered in the scrollable main area.
//
// Structure:
//   [Sidebar | Topbar ]
//   [Sidebar | Main content (children) ]
// ─────────────────────────────────────────────────────────

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  return (
    // Full viewport container — sidebar fixed on the left, content on the right
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar /> {/* Fixed left navigation panel */}

      {/* Right side: topbar on top, scrollable content below */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar /> {/* Fixed header with user info and notifications */}

        {/* Scrollable main content area — page components render here */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children} {/* The actual page content passed from App.jsx routes */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
