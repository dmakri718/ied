import React, { useState, useEffect } from 'react';
import { Search, BookOpen, GraduationCap, Users, AlertCircle } from 'lucide-react';
import { ProjectAnalyzer } from './services/projectAnalyzer';
import type { Project } from './types';
import ReactMarkdown from 'react-markdown';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<'all' | 'school' | 'adult' | 'both'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const scrapedProjects = await ProjectAnalyzer.scrapeProjects();
    setProjects(scrapedProjects);
    setLoading(false);
  };

  const analyzeProject = async (project: Project) => {
    setAnalyzing(true);
    setError(null);
    try {
      const officialWebsite = await ProjectAnalyzer.findOfficialWebsite(project.name);
      const analysis = await ProjectAnalyzer.analyzeProject(project);
      
      const updatedProject = {
        ...project,
        officialWebsite,
        suitabilityScore: analysis.suitabilityScore,
        category: analysis.category,
        educationalPlan: analysis.educationalPlan
      };

      setProjects(prev => 
        prev.map(p => p.id === project.id ? updatedProject : p)
      );
      setSelectedProject(updatedProject);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during analysis');
      console.error('Error analyzing project:', error);
    }
    setAnalyzing(false);
  };

  const filteredProjects = projects.filter(project => 
    filter === 'all' || project.category === filter
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'school':
        return <GraduationCap className="w-5 h-5" />;
      case 'adult':
        return <Users className="w-5 h-5" />;
      case 'both':
        return <BookOpen className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">EU Project Educational Analyzer</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {!import.meta.env.VITE_OPENAI_API_KEY && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  OpenAI API key is not configured. Please add your API key to the .env file as VITE_OPENAI_API_KEY.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('school')}
            className={`px-4 py-2 rounded-md ${
              filter === 'school' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            School
          </button>
          <button
            onClick={() => setFilter('adult')}
            className={`px-4 py-2 rounded-md ${
              filter === 'adult' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Adult
          </button>
          <button
            onClick={() => setFilter('both')}
            className={`px-4 py-2 rounded-md ${
              filter === 'both' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Both
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 w-full border rounded-md"
                />
              </div>
              
              <div className="mt-4 space-y-4">
                {loading ? (
                  <p className="text-center text-gray-500">Loading projects...</p>
                ) : (
                  filteredProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedProject?.id === project.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      } border`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        {project.category && getCategoryIcon(project.category)}
                      </div>
                      {project.suitabilityScore && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${project.suitabilityScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {project.suitabilityScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            {selectedProject ? (
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                  {!selectedProject.suitabilityScore && (
                    <button
                      onClick={() => analyzeProject(selectedProject)}
                      disabled={analyzing || !import.meta.env.VITE_OPENAI_API_KEY}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze Project'}
                    </button>
                  )}
                </div>

                {selectedProject.officialWebsite && (
                  <a
                    href={selectedProject.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline block mt-2"
                  >
                    Official Website
                  </a>
                )}

                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900">Description</h3>
                  <p className="mt-2 text-gray-600">{selectedProject.description}</p>
                </div>

                {selectedProject.educationalPlan && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900">Educational Plan</h3>
                    <div className="mt-2 prose">
                      <ReactMarkdown>{selectedProject.educationalPlan}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <BookOpen className="mx-auto h-12 w-12" />
                <p className="mt-2">Select a project to view details and analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;