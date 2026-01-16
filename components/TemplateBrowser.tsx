import React, { useState, useEffect } from 'react';
import { StoryTemplate } from '../types';
import { loadAllTemplates, TemplateFile } from '../services/templateLoader';
import {
  getTemplatesFromStorage,
  deleteTemplateFromStorage,
  exportTemplateFromStorage,
  SavedTemplate,
  saveTemplateToFile
} from '../utils/templateService';

interface TemplateBrowserProps {
  onSelectTemplate: (template: StoryTemplate) => void;
  onClose: () => void;
}

type TemplateItem = TemplateFile | SavedTemplate;

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({ onSelectTemplate, onClose }) => {
  const [folderTemplates, setFolderTemplates] = useState<TemplateFile[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      // Load templates from folder
      const folder = await loadAllTemplates();
      setFolderTemplates(folder);

      // Load saved templates from localStorage
      const stored = getTemplatesFromStorage();
      setSavedTemplates(stored);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showMessage('error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateFromStorage(id);
      loadTemplates();
      showMessage('success', 'Template deleted successfully');
    }
  };



  const handleExport = async (item: TemplateItem) => {
    try {
      if ('savedAt' in item) {
        // SavedTemplate from localStorage
        await exportTemplateFromStorage(item);
      } else {
        // TemplateFile from folder
        await saveTemplateToFile(item.template, item.filename);
      }
      showMessage('success', 'Template exported successfully');
    } catch (error) {
      showMessage('error', `Failed to export: ${(error as Error).message}`);
    }
  };

  const handleUseTemplate = (item: TemplateItem) => {
    if ('savedAt' in item) {
      // SavedTemplate from localStorage
      const { id, savedAt, ...storyTemplate } = item;
      onSelectTemplate(storyTemplate);
    } else {
      // TemplateFile from folder
      onSelectTemplate(item.template);
    }
    onClose();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemplateData = (item: TemplateItem) => {
    if ('savedAt' in item) {
      return {
        id: item.id,
        title: item.title,
        genre: item.genre,
        numChapters: item.numChapters,
        plotOutline: item.plotOutline,
        savedAt: item.savedAt,
        isFromFolder: false
      };
    } else {
      return {
        id: item.id,
        title: item.template.title,
        genre: item.template.genre,
        numChapters: item.template.numChapters,
        plotOutline: item.template.plotOutline,
        savedAt: null,
        isFromFolder: true
      };
    }
  };

  const allTemplates = [...folderTemplates, ...savedTemplates];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Template Library</h2>
            <p className="text-slate-500 text-sm mt-1">Browse and manage your story templates</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Message notification */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500">Loading templates...</p>
            </div>
          ) : allTemplates.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No templates available</h3>
              <p className="text-slate-500">Save a template from the story form to see it here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Folder Templates Section */}
              {folderTemplates.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    Built-in Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folderTemplates.map((item) => {
                      const data = getTemplateData(item);
                      return (
                        <div
                          key={data.id}
                          className="bg-slate-50 rounded-xl p-5 border-2 border-transparent hover:border-indigo-200 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{data.title}</h3>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium">{data.genre}</span>
                              <span className="text-slate-500">{data.numChapters} chapters</span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{data.plotOutline}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUseTemplate(item)}
                              className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all"
                            >
                              Use Template
                            </button>
                            <button
                              onClick={() => handleExport(item)}
                              className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-all"
                              title="Export to file"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved Templates Section */}
              {savedTemplates.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    My Saved Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedTemplates.map((item) => {
                      const data = getTemplateData(item);
                      return (
                        <div
                          key={data.id}
                          className="bg-green-50 rounded-xl p-5 border-2 border-transparent hover:border-green-200 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{data.title}</h3>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">{data.genre}</span>
                              <span className="text-slate-500">{data.numChapters} chapters</span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{data.plotOutline}</p>
                          </div>
                          {data.savedAt && (
                            <div className="text-xs text-slate-400 mb-3">
                              Saved {formatDate(data.savedAt)}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUseTemplate(item)}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
                            >
                              Use Template
                            </button>
                            <button
                              onClick={() => handleExport(item)}
                              className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-all"
                              title="Export to file"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(data.id)}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                              title="Delete template"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

