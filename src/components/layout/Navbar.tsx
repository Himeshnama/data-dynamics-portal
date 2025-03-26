
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, BarChart, Home, FileType, Search } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="bg-black shadow-md py-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 bg-gold-500 rounded-lg text-white">
            <Database className="w-5 h-5" />
          </div>
          <span className="text-xl font-semibold text-white">DataViz</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              className={location.pathname === '/' ? 'bg-gold-500 text-black' : 'text-white hover:text-gold-300'}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
              className={location.pathname === '/dashboard' ? 'bg-gold-500 text-black' : 'text-white hover:text-gold-300'}
            >
              <Database className="w-4 h-4 mr-2" />
              Data
            </Button>
          </Link>
          <Link to="/visualization">
            <Button
              variant={location.pathname === '/visualization' ? 'default' : 'ghost'}
              className={location.pathname === '/visualization' ? 'bg-gold-500 text-black' : 'text-white hover:text-gold-300'}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Visualize
            </Button>
          </Link>
          <Link to="/query">
            <Button
              variant={location.pathname === '/query' ? 'default' : 'ghost'}
              className={location.pathname === '/query' ? 'bg-gold-500 text-black' : 'text-white hover:text-gold-300'}
            >
              <Search className="w-4 h-4 mr-2" />
              Query
            </Button>
          </Link>
          <Link to="/converter">
            <Button
              variant={location.pathname === '/converter' ? 'default' : 'ghost'}
              className={location.pathname === '/converter' ? 'bg-gold-500 text-black' : 'text-white hover:text-gold-300'}
            >
              <FileType className="w-4 h-4 mr-2" />
              Convert
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
