
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Database, BarChart, Upload, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="mb-4 inline-block bg-gold-500/10 px-4 py-1.5 rounded-full">
            <span className="text-gold-500 font-medium">Simple Data Tools</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 text-white">
            Data <span className="text-gold-500">Management</span> & <span className="text-gold-500">Visualization</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10">
            A simple tool to upload, edit, and visualize your corporate data.
            Import CSV files, manage your data, and create beautiful visualizations in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gold-500 text-black hover:bg-gold-600">
              <Link to="/dashboard">
                <Database className="mr-2 h-5 w-5" />
                Manage Data
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-white border-gold-500 hover:bg-gold-500/10">
              <Link to="/visualization">
                <BarChart className="mr-2 h-5 w-5" />
                Visualize Data
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-gray-800 shadow-lg">
          <img 
            src="/lovable-uploads/fe4e735c-ea31-4939-b592-39c2f0329b33.png" 
            alt="Data visualization example" 
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-2">Beautiful Visualizations</h3>
              <p className="text-gray-300">
                Turn your data into insightful charts and graphs with just a few clicks
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-gold-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">CSV Import</h3>
              <p className="text-gray-400">
                Easily upload and manage your CSV datasets with our intuitive interface.
              </p>
            </div>
            
            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-gold-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Data Management</h3>
              <p className="text-gray-400">
                Add, edit, delete, and search through your data with powerful table functionality.
              </p>
            </div>
            
            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-gold-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Visualization</h3>
              <p className="text-gray-400">
                Create beautiful charts and graphs to gain insights from your data.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-20 px-4">
        <div className="bg-gradient-to-r from-gold-500/20 to-gold-700/20 p-10 rounded-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to analyze your data?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start managing and visualizing your corporate data today with our simple yet powerful platform.
          </p>
          <Button asChild size="lg" className="bg-gold-500 text-black hover:bg-gold-600">
            <Link to="/dashboard">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
