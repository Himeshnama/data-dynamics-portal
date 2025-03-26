
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Visualization from '@/pages/Visualization';
import DataConverter from '@/pages/DataConverter';
import QueryData from '@/pages/QueryData';
import NotFound from '@/pages/NotFound';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="/converter" element={<DataConverter />} />
          <Route path="/query" element={<QueryData />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
    </Router>
  );
};

export default App;
