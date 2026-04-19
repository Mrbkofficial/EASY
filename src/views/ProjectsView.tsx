import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectStatus, User, UserTier } from '../types';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface ProjectsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const useSpeechRecognition = (onResult: (result: string) => void, onStop: () => void) => {
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let t = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) t += event.results[i][0].transcript;
      onResult(t);
    };
    recognition.onend = onStop;
    return () => recognitionRef.current?.abort();
  }, [onResult, onStop]);
  return recognitionRef;
};

const ProjectsView: React.FC<ProjectsViewProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<ProjectStatus>(ProjectStatus.Open);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});
  const [listeningField, setListeningField] = useState<string | null>(null);

  const handleEditResult = (result: string) => {
    if (listeningField) setEditedSections(prev => ({ ...prev, [listeningField]: (prev[listeningField] || '') + result }));
  };
  const stopListening = () => setListeningField(null);
  const recognitionRef = useSpeechRecognition(handleEditResult, stopListening);

  const toggleListening = (fieldName: string) => {
    if (listeningField === fieldName) { recognitionRef.current?.stop(); stopListening(); }
    else { if (listeningField) recognitionRef.current?.stop(); setListeningField(fieldName); recognitionRef.current?.start(); }
  };

  const filteredProjects = user.projects
    .filter(p => p.status === activeTab)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const parseContentToSections = (content: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    let currentTitle = 'Summary';
    sections[currentTitle] = '';
    for (const line of content.split('\n')) {
      const match = line.match(/^#+\s(.+)/);
      if (match) { currentTitle = match[1].trim(); if (!sections[currentTitle]) sections[currentTitle] = ''; }
      else if (line.trim()) sections[currentTitle] = (sections[currentTitle] ? sections[currentTitle] + '\n' : '') + line;
    }
    return sections;
  };

  const handleEdit = (project: Project) => {
    if (user.tier === UserTier.Free) { alert('Please upgrade to Pro or Premium to edit projects.'); return; }
    setEditingProject(project);
    setEditedSections(parseContentToSections(project.content));
  };

  const handleSaveEdit = () => {
    if (!editingProject) return;
    const newContent = Object.entries(editedSections).map(([title, content]) => {
      const level = title.match(/^\d/) ? '##' : '#';
      return `${level} ${title}\n${content}`;
    }).join('\n\n');
    const updatedProject: Project = { ...editingProject, content: newContent };
    onUpdateUser({ ...user, projects: user.projects.map(p => p.id === editingProject.id ? updatedProject : p) });
    setEditingProject(null);
    setEditedSections({});
  };

  const handleMarkAsCompleted = (projectId: string) => {
    onUpdateUser({ ...user, projects: user.projects.map(p => p.id === projectId ? { ...p, status: ProjectStatus.Completed } : p) });
  };

  const downloadPDF = (project: Project) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 15, pageHeight = doc.internal.pageSize.getHeight(), pageWidth = doc.internal.pageSize.getWidth(), maxLineWidth = pageWidth - margin * 2;
    let cursorY = margin;
    if (user.companyLogo) {
      try {
        const imgProps = doc.getImageProperties(user.companyLogo);
        const logoH = 15, logoW = (imgProps.width * logoH) / imgProps.height;
        doc.addImage(user.companyLogo, 'JPEG', pageWidth - margin - logoW, margin, logoW, logoH);
        cursorY = margin + logoH + 10;
      } catch { /* skip logo on error */ }
    }
    const addText = (text: string, size: number, style: 'bold' | 'normal') => {
      doc.setFontSize(size); doc.setFont('helvetica', style);
      doc.splitTextToSize(text, maxLineWidth).forEach((line: string) => {
        if (cursorY + size / 2.8 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
        doc.text(line, margin, cursorY); cursorY += size / 2.8 + 2;
      });
    };
    Object.entries(parseContentToSections(project.content)).forEach(([title, content]) => {
      if ((title === 'Summary' || title === 'Title') && !content.trim()) return;
      addText(title, !title.match(/^\d/) ? 18 : 14, 'bold'); cursorY += 2;
      addText(content, 12, 'normal'); cursorY += 6;
    });
    doc.save(`${project.title.replace(/\s/g, '_')}.pdf`);
  };

  const downloadWord = (project: Project) => {
    saveAs(new Blob([project.content], { type: 'text/plain;charset=utf-8' }), `${project.title.replace(/\s/g, '_')}.docx`);
  };

  if (editingProject) {
    return (
      <div className="p-4 md:p-6 text-white h-full flex flex-col pt-24 pb-20 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit: {editingProject.title}</h2>
        <div className="space-y-6 flex-grow">
          {Object.entries(editedSections).map(([title, content]) => (
            <div key={title}>
              <label className="block text-lg font-semibold text-gray-300 mb-2">{title}</label>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={e => setEditedSections(prev => ({ ...prev, [title]: e.target.value }))}
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={title === 'Summary' ? 3 : 6}
                />
                <button onClick={() => toggleListening(title)} className={`absolute bottom-2 right-2 p-2 rounded-full ${listeningField === title ? 'bg-red-500 animate-pulse' : 'bg-green-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 shrink-0">
          <button onClick={handleSaveEdit} className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold">Save Changes</button>
          <button onClick={() => setEditingProject(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 p-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 text-white h-full pt-24 pb-20 overflow-y-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">My Projects</h2>
      <div className="flex justify-center mb-6 bg-gray-900 rounded-lg p-1 max-w-sm mx-auto">
        <button onClick={() => setActiveTab(ProjectStatus.Open)} className={`w-1/2 py-2 rounded-md transition-colors font-semibold ${activeTab === ProjectStatus.Open ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Open</button>
        <button onClick={() => setActiveTab(ProjectStatus.Completed)} className={`w-1/2 py-2 rounded-md transition-colors font-semibold ${activeTab === ProjectStatus.Completed ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Completed</button>
      </div>
      {filteredProjects.length === 0 ? (
        <div className="text-center text-gray-400 p-8">No {activeTab.toLowerCase()} projects found.</div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-gray-800 p-4 rounded-lg shadow-md transition-transform hover:scale-[1.02]">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-white">{project.title}</h3>
                  <p className="text-sm text-gray-400">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3 items-center flex-wrap justify-end shrink-0">
                  {activeTab === ProjectStatus.Open && <button onClick={() => handleMarkAsCompleted(project.id)} className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold">Mark Completed</button>}
                  <button onClick={() => handleEdit(project)} disabled={user.tier === UserTier.Free} className="text-blue-400 hover:text-blue-300 text-sm disabled:text-gray-500 disabled:cursor-not-allowed">Edit</button>
                  <button onClick={() => downloadPDF(project)} className="text-green-400 hover:text-green-300 text-sm">PDF</button>
                  <button onClick={() => downloadWord(project)} className="text-purple-400 hover:text-purple-300 text-sm">Word</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
