
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, BarChart, Home, FileType, Search, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Data', icon: Database },
    { path: '/visualization', label: 'Visualize', icon: BarChart },
    { path: '/query', label: 'Query', icon: Search },
    { path: '/converter', label: 'Convert', icon: FileType },
  ];
  
  const NavButton = ({ path, label, icon: Icon }) => (
    <Link to={path} onClick={() => setIsOpen(false)}>
      <Button
        variant={location.pathname === path ? 'default' : 'ghost'}
        className={location.pathname === path ? 'bg-gold-500 text-black' : 'text-white hover:text-gold-300'}
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </Button>
    </Link>
  );
  
  return (
    <header className="bg-black shadow-md py-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 bg-gold-500 rounded-lg text-white">
            <Database className="w-5 h-5" />
          </div>
          <span className="text-xl font-semibold text-white">DataViz</span>
        </Link>

        {isMobile ? (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] bg-black border-l border-gold-500">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center p-2 rounded-md ${
                      location.pathname === item.path 
                        ? 'bg-gold-500 text-black' 
                        : 'text-white hover:bg-gold-700/20'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <NavButton key={item.path} {...item} />
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
