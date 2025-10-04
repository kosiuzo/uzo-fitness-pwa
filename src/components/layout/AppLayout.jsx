/**
 * AppLayout Component
 *
 * Main app shell with bottom navigation
 * Mobile-first layout with header and nav
 */

import { Outlet } from 'react-router-dom';
import { NavigationBar } from './NavigationBar';

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto pb-20" style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        <Outlet />
      </main>

      {/* Bottom navigation - fixed */}
      <NavigationBar />
    </div>
  );
}
