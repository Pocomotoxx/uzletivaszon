import React, { useState, useEffect } from 'react';
import { INITIAL_CANVAS_STRUCTURE } from './constants';
import type { CanvasBlockData, CanvasItem } from './types';
import CanvasBlock from './components/CanvasBlock';
import SelectionsModal from './components/SelectionsModal';
import { SparklesIcon, DocumentTextIcon, XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, ArrowDownTrayIcon, QuestionMarkCircleIcon, PaperClipIcon, BookmarkIcon, ListBulletIcon, PresentationChartBarIcon, CogIcon } from './components/Icons';
import { generateSummary, extractTextFromFile } from './services/geminiService';
import ItemsModal from './components/ItemsModal';
import VisualReportModal from './components/VisualReportModal';
import HelpModal from './components/HelpModal';
import WelcomeScreen from './components/WelcomeScreen';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<CanvasBlockData[]>(INITIAL_CANVAS_STRUCTURE);
  const [businessConcept, setBusinessConcept] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; isExtracting?: boolean } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<{ blockTitle: string; suggestion: string }[]>([]);
  const [showSelectionsModal, setShowSelectionsModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  // New Visualization State
  const [showReportModal, setShowReportModal] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const apiKey = localStorage.getItem('gemini_api_key');
    setHasApiKey(!!apiKey);
    setIsCheckingKey(false);
  }, []);

  if (isCheckingKey) {
    return null; // Or a loading spinner
  }

  if (!hasApiKey) {
    return <WelcomeScreen onApiKeySet={() => setHasApiKey(true)} />;
  }


  const handleAddItem = (blockId: string, itemText: string) => {
    if (!itemText.trim()) return;
    const newItem: CanvasItem = { id: `item-${Date.now()}`, text: itemText };
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, items: [...block.items, newItem] } : block
      )
    );
  };

  const handleAddMultipleItems = (blockId: string, itemsText: string[]) => {
    const newItems: CanvasItem[] = itemsText.map((text, index) => ({
      id: `item-${Date.now()}-${index}`,
      text: text,
    }));
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, items: [...block.items, ...newItems] } : block
      )
    );
  };

  const handleDeleteItem = (blockId: string, itemId: string) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId
          ? { ...block, items: block.items.filter(item => item.id !== itemId) }
          : block
      )
    );
  };

  const handleUpdateItem = (blockId: string, itemId: string, newText: string) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId
          ? {
            ...block,
            items: block.items.map(item =>
              item.id === itemId ? { ...item, text: newText } : item
            ),
          }
          : block
      )
    );
  };

  const getFullBusinessConcept = () => {
    let fullConcept = businessConcept;
    if (uploadedFile) {
      fullConcept += `\n\n--- Csatolt dokumentum (${uploadedFile.name}) ---\n${uploadedFile.content}`;
    }
    return fullConcept.trim();
  };

  const isCanvasEmpty = () => blocks.every(block => block.items.length === 0);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setShowSummaryModal(true);
    setSummaryError(null);
    setSummary(null);

    const canvasDataString = blocks
      .filter(block => block.items.length > 0)
      .map(block =>
        `${block.title}:\n${block.items.map(item => `- ${item.text}`).join('\n')}`
      )
      .join('\n\n');

    const fullConcept = getFullBusinessConcept();

    try {
      const result = await generateSummary(fullConcept, canvasDataString);
      setSummary(result);
    } catch (error) {
      setSummaryError('Hiba történt az összefoglaló készítése közben. Kérjük, próbálja újra később.');
      console.error(error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    if (file) {
      // Fix: Check file extension as well, because some browsers don't detect markdown MIME type correctly
      const isTextFile = file.type === 'text/plain' || file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md');

      const isComplexFile = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);

      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setUploadedFile({ name: file.name, content });
        };
        reader.onerror = () => {
          setFileError("Hiba a szöveges fájl olvasása közben.");
          setUploadedFile(null);
        };
        reader.readAsText(file, 'UTF-8');
      } else if (isComplexFile) {
        setUploadedFile({ name: file.name, content: '', isExtracting: true });
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const dataUrl = e.target?.result as string;
            const base64Content = dataUrl.split(',')[1];
            const extractedText = await extractTextFromFile({ base64Content, mimeType: file.type });
            setUploadedFile({ name: file.name, content: extractedText });
          } catch (error) {
            console.error("Error extracting text from file:", error);
            setFileError("Hiba a szöveg kinyerése közben a dokumentumból.");
            setUploadedFile(null);
          }
        };
        reader.onerror = () => {
          setFileError("Hiba a fájl beolvasása közben.");
          setUploadedFile(null);
        };
        reader.readAsDataURL(file);
      } else {
        setFileError('Nem támogatott fájltípus. Támogatott: .txt, .md, .doc, .docx, .pdf');
        event.target.value = '';
        return;
      }
    }
    event.target.value = '';
  };


  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileError(null);
  };

  const handleDownload = () => {
    let content = `# Üzleti Modell Vászon\n\n`;
    content += `## Üzleti Koncepció\n\n`;
    content += `${businessConcept || 'Nincs megadva.'}\n\n`;

    if (uploadedFile) {
      content += `### Csatolt dokumentum: ${uploadedFile.name}\n\n`;
      content += "```\n";
      content += `${uploadedFile.content}\n`;
      content += "```\n\n";
    }

    blocks.forEach(block => {
      if (block.items.length > 0) {
        content += `## ${block.title}\n\n`;
        block.items.forEach(item => {
          content += `- ${item.text}\n`;
        });
        content += `\n`;
      }
    });

    if (summary) {
      content += `## MI-generált Összefoglaló\n\n`;
      content += `${summary}\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'uzleti_modell.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadItemsOnly = () => {
    let content = `# Üzleti Modell Vászon - Elemek\n\n`;

    blocks.forEach(block => {
      if (block.items.length > 0) {
        content += `## ${block.title}\n\n`;
        block.items.forEach(item => {
          content += `- ${item.text}\n`;
        });
        content += `\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'uzleti_modell_elemek.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleSuggestionSelection = (blockTitle: string, suggestion: string) => {
    setSelectedSuggestions(prev => {
      const isSelected = prev.some(s => s.blockTitle === blockTitle && s.suggestion === suggestion);
      if (isSelected) {
        return prev.filter(s => !(s.blockTitle === blockTitle && s.suggestion === suggestion));
      } else {
        return [...prev, { blockTitle, suggestion }];
      }
    });
  };

  const handleClearSelections = () => {
    setSelectedSuggestions([]);
  };

  const handleDownloadSelections = () => {
    const grouped: { [key: string]: string[] } = selectedSuggestions.reduce((acc, curr) => {
      if (!acc[curr.blockTitle]) {
        acc[curr.blockTitle] = [];
      }
      acc[curr.blockTitle].push(curr.suggestion);
      return acc;
    }, {} as { [key: string]: string[] });

    let content = `# MI-generált ötletek\n\n`;
    for (const blockTitle in grouped) {
      content += `## ${blockTitle}\n\n`;
      grouped[blockTitle].forEach(suggestion => {
        content += `- ${suggestion}\n`;
      });
      content += `\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'kivalasztott_otletek.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-indigo-500/30 selection:text-indigo-900">
      {/* Professional Header */}
      <header className="glass-dark text-white sticky top-0 z-50 shadow-2xl shadow-indigo-900/10 backdrop-saturate-150">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">Üzleti Modell Vászon</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-200 font-bold opacity-80">AI Powered</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log("Settings button clicked");
                  setShowSettingsModal(true);
                }}
                className="text-slate-300 hover:text-white hover:bg-white/10 p-2.5 rounded-full transition-all duration-300 hover:rotate-90 active:scale-95"
                title="Beállítások (API Kulcs)"
              >
                <CogIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-slate-300 hover:text-white hover:bg-white/10 p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                title="Használati útmutató"
              >
                <QuestionMarkCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar / Control Panel */}
      <div className="glass border-b border-white/40 sticky top-16 z-40 shadow-sm backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">

            {/* Left: Input Area */}
            <div className="w-full lg:w-1/2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-grow w-full">
                <input
                  id="business-concept"
                  type="text"
                  value={businessConcept}
                  onChange={(e) => setBusinessConcept(e.target.value)}
                  placeholder="Az Ön üzleti koncepciója..."
                  className="w-full pl-11 pr-4 py-3 bg-white/80 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm hover:shadow-md hover:bg-white font-medium placeholder:text-slate-400"
                />           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SparklesIcon className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept=".txt,.md,.doc,.docx,.pdf" />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold transition-all w-full sm:w-auto shadow-sm hover:shadow-md active:scale-95 ${uploadedFile
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  title={uploadedFile ? uploadedFile.name : "Dokumentum csatolása"}
                >
                  <PaperClipIcon className="h-4 w-4" />
                  <span className="truncate max-w-[100px]">{uploadedFile ? 'Csatolva' : 'Csatol'}</span>
                </label>
                {uploadedFile && (
                  <button onClick={handleRemoveFile} className="text-slate-400 hover:text-red-500 p-1">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Actions Toolbar */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end overflow-x-auto pb-1 lg:pb-0">
              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                <button
                  onClick={() => setShowItemsModal(true)}
                  disabled={isCanvasEmpty()}
                  title="Összes elem megtekintése"
                  className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-40"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>

                {/* NEW VISUAL REPORT BUTTON */}
                <button
                  onClick={() => setShowReportModal(true)}
                  disabled={isCanvasEmpty()}
                  title="Vizuális Riport Megnyitása"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-teal-600 hover:bg-white hover:text-teal-700 hover:shadow-md transition-all disabled:opacity-40 font-medium"
                >
                  <PresentationChartBarIcon className="h-5 w-5" />
                  <span className="text-sm hidden sm:inline">Riport</span>
                </button>

                <button
                  onClick={() => setShowSelectionsModal(true)}
                  disabled={selectedSuggestions.length === 0}
                  title="Kiválasztott ötletek"
                  className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-40 relative"
                >
                  <BookmarkIcon className="h-5 w-5" />
                  {selectedSuggestions.length > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-slate-100"></span>
                  )}
                </button>
              </div>

              <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

              <button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary || !!uploadedFile?.isExtracting || (!businessConcept.trim() && !uploadedFile) || isCanvasEmpty()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow disabled:opacity-50 whitespace-nowrap"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Összefoglaló</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!!uploadedFile?.isExtracting || (isCanvasEmpty() && !businessConcept.trim() && !uploadedFile)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:bg-slate-500 disabled:shadow-none disabled:translate-y-0 whitespace-nowrap"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Letöltés</span>
              </button>
            </div>
          </div>

          {fileError && <p className="text-xs text-red-500 mt-2">{fileError}</p>}
          {uploadedFile?.isExtracting && <p className="text-xs text-indigo-600 mt-2 animate-pulse">Dokumentum feldolgozása folyamatban...</p>}
        </div>
      </div>

      {/* Main Content Canvas */}
      <main className="flex-grow max-w-[1800px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blocks.map(block => (
            <CanvasBlock
              key={block.id}
              block={block}
              onAddItem={handleAddItem}
              onDelete={handleDeleteItem}
              onUpdate={handleUpdateItem}
              businessConcept={getFullBusinessConcept()}
              onAddMultipleItems={handleAddMultipleItems}
              isFileProcessing={!!uploadedFile?.isExtracting}
              selectedSuggestions={selectedSuggestions}
              onToggleSuggestionSelection={handleToggleSuggestionSelection}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/50 mt-auto">
        <div className="max-w-[1800px] mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Üzleti Modell Vászon. Minden jog fenntartva.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>Brillmann Zsolt</span>
              </div>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4" />
                <a href="mailto:brillmannzs@gmail.com" className="hover:text-indigo-600 transition">brillmannzs@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4" />
                <span>+36306916162</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {
        showSummaryModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSummaryModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold text-slate-800">Üzleti Modell Összefoglaló</h2>
                <button onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {isGeneratingSummary && (
                  <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-slate-500">MI generálja az elemzést...</p>
                  </div>
                )}
                {summaryError && <p className="text-red-500">{summaryError}</p>}
                {summary && (
                  <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                    {summary}
                  </div>
                )}
              </div>
              <div className="p-4 border-t text-right bg-slate-50 rounded-b-xl">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showSelectionsModal && (
          <SelectionsModal
            isOpen={showSelectionsModal}
            onClose={() => setShowSelectionsModal(false)}
            selectedSuggestions={selectedSuggestions}
            onToggleSelection={handleToggleSuggestionSelection}
            onClear={handleClearSelections}
            onDownload={handleDownloadSelections}
          />
        )
      }

      {
        showItemsModal && (
          <ItemsModal
            isOpen={showItemsModal}
            onClose={() => setShowItemsModal(false)}
            blocks={blocks}
            onDownload={handleDownloadItemsOnly}
          />
        )
      }

      {
        showReportModal && (
          <VisualReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            blocks={blocks}
          />
        )
      }
    </div >
  );
};

export default App;