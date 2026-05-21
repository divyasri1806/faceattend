import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Monitor from './pages/Monitor';
import Register from './pages/Register';
import Records from './pages/Records';
import type { Page } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'monitor': return <Monitor />;
      case 'register': return <Register />;
      case 'records': return <Records />;
   
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}
