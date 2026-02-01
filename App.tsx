import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Info, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  FileText,
  Menu,
  X,
  ScanFace
} from 'lucide-react';
import { AbstractModel } from './components/AbstractModel';
import { PrivacyOverlay } from './components/PrivacyOverlay';
import { CameraView } from './components/CameraView';
import { AppMode, CheckStep, NoteEntry, PoseData } from './types';
import { CHECK_STEPS_INFO, EDUCATIONAL_CONTENT } from './constants';
import { getNotes, saveNote, getSettings, markCheckComplete, saveSettings } from './services/storageService';

const App = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.ONBOARDING);
  const [step, setStep] = useState<CheckStep>(CheckStep.PREPARE);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [handPosition, setHandPosition] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    // Load initial data
    setNotes(getNotes());
  }, []);

  const handleNextStep = () => {
    if (step < CheckStep.FINISH) {
      setStep(step + 1);
    } else {
      markCheckComplete();
      setMode(AppMode.HOME);
      setStep(CheckStep.PREPARE);
    }
  };

  const handlePrevStep = () => {
    if (step > CheckStep.PREPARE) {
      setStep(step - 1);
    }
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote: NoteEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      content: noteInput
    };
    saveNote(newNote);
    setNotes([newNote, ...notes]);
    setNoteInput("");
  };

  const handlePoseInteract = (data: PoseData) => {
    // Update hand position for the Abstract Model "Digital Twin" cursor
    // data.indexTip contains {x, y, z} normalized coordinates (0 to 1)
    setHandPosition({ x: data.indexTip.x, y: data.indexTip.y });
  };

  // --- Render Views ---

  const renderOnboarding = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-md mx-auto animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mb-8">
        <Heart className="text-teal-400" size={40} />
      </div>
      <h1 className="text-3xl font-light text-white mb-4">Gentle Check</h1>
      <p className="text-slate-400 mb-8 leading-relaxed">
        {EDUCATIONAL_CONTENT.intro}
      </p>
      <button 
        onClick={() => setMode(AppMode.HOME)}
        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold py-4 rounded-xl transition-all active:scale-95"
      >
        Start
      </button>
      <button 
        onClick={() => setShowPrivacy(true)}
        className="mt-4 text-slate-500 text-sm hover:text-slate-300 underline"
      >
        Privacy & Safety Information
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="p-6 max-w-lg mx-auto pt-20">
      <h2 className="text-2xl font-light text-white mb-6">Hello.</h2>
      
      <div className="grid gap-4">
        <button 
          onClick={() => {
            setStep(CheckStep.PREPARE);
            setMode(AppMode.GUIDED_CHECK);
          }}
          className="group relative overflow-hidden bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl text-left transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-medium text-teal-400 mb-2">Guided Self-Check</h3>
              <p className="text-slate-400 text-sm">5-7 minutes • Step-by-step visual guide</p>
            </div>
            <div className="p-2 bg-slate-900 rounded-full group-hover:bg-teal-500/20 transition-colors">
               <ChevronRight className="text-teal-500" />
            </div>
          </div>
        </button>

        <button 
          onClick={() => setMode(AppMode.LEARN)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl text-left transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Learn the Basics</h3>
            <p className="text-slate-400 text-sm">What to look for & anatomy</p>
          </div>
        </button>

        <button 
          onClick={() => setMode(AppMode.NOTES)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl text-left transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-rose-500/10 rounded-full text-rose-400">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Notes & Reminders</h3>
            <p className="text-slate-400 text-sm">Track changes & questions</p>
          </div>
        </button>

        {/* 4th Tab: Digital Twin */}
        <button 
          onClick={() => {
              setCameraEnabled(true); // Auto-enable camera for this mode
              setMode(AppMode.DIGITAL_TWIN);
          }}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl text-left transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-teal-500/10 rounded-full text-teal-400">
            <ScanFace size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Digital Twin</h3>
            <p className="text-slate-400 text-sm">Explore with MediaPipe gestures</p>
          </div>
        </button>
      </div>

      <div className="mt-12 p-4 rounded-xl bg-slate-800/50 border border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          {EDUCATIONAL_CONTENT.disclaimer}
        </p>
      </div>
    </div>
  );

  const renderGuidedCheck = () => {
    const currentInfo = CHECK_STEPS_INFO[step];
    const progress = ((step + 1) / CHECK_STEPS_INFO.length) * 100;

    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-slate-900 relative">
        <CameraView enabled={cameraEnabled} onPoseDetected={handlePoseInteract} />

        {/* Header */}
        <div className="p-6 flex items-center justify-between z-10">
          <button onClick={() => setMode(AppMode.HOME)} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
          <div className="flex items-center gap-2">
            <button 
               onClick={() => setCameraEnabled(!cameraEnabled)}
               className={`p-2 rounded-full transition-colors ${cameraEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'}`}
               title="Toggle Gesture Tracking"
            >
               <Settings size={20} />
            </button>
            <span className="text-sm font-medium text-slate-300">Step {step + 1}/{CHECK_STEPS_INFO.length}</span>
          </div>
        </div>

        {/* 3D Visualizer Area */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-800">
           <AbstractModel 
              step={step} 
              onInteract={() => {}} 
              handPosition={cameraEnabled ? handPosition : null}
              variant="soft"
           />
        </div>

        {/* Controls & Instructions */}
        <div className="bg-slate-900 p-6 rounded-t-3xl shadow-2xl border-t border-slate-800 z-10">
          <div className="h-1 w-full bg-slate-800 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-2">{currentInfo.title}</h2>
          <p className="text-slate-400 mb-8 min-h-[80px]">{currentInfo.instruction}</p>

          <div className="flex gap-4">
            <button 
              onClick={handlePrevStep}
              disabled={step === 0}
              className={`flex-1 py-4 rounded-xl font-medium transition-colors ${step === 0 ? 'text-slate-600 bg-slate-800 cursor-not-allowed' : 'text-slate-300 bg-slate-800 hover:bg-slate-700'}`}
            >
              Back
            </button>
            <button 
              onClick={handleNextStep}
              className="flex-1 py-4 rounded-xl font-semibold bg-teal-500 hover:bg-teal-400 text-slate-900 transition-colors shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {step === CheckStep.FINISH ? 'Finish' : 'Next Step'}
              {step < CheckStep.FINISH && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDigitalTwin = () => (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-slate-900 relative">
        <CameraView enabled={cameraEnabled} onPoseDetected={handlePoseInteract} />

        {/* Header */}
        <div className="p-6 flex items-center justify-between z-10 bg-slate-900/50 backdrop-blur-sm">
          <button onClick={() => {
              setCameraEnabled(false);
              setMode(AppMode.HOME);
          }} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-teal-900/30 rounded-full border border-teal-500/30">
               <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
               <h2 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Digital Twin Active</h2>
            </div>
          </div>
        </div>

        {/* 3D Visualizer Area */}
        <div className="flex-1 relative bg-slate-950">
           {/* Enable freeRoam and Medical Variant */}
           <AbstractModel 
              step={CheckStep.PREPARE} 
              onInteract={() => {}} 
              handPosition={cameraEnabled ? handPosition : null}
              freeRoam={true}
              variant="medical"
           />
           
           {/* Center instruction if camera is off */}
           {!cameraEnabled && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-slate-900/90 backdrop-blur text-slate-300 px-6 py-4 rounded-xl max-w-xs text-center border border-slate-700 shadow-2xl">
                       <p>Enable camera permissions to initialize Digital Twin tracking.</p>
                   </div>
               </div>
           )}
        </div>

        {/* Footer Info */}
        <div className="bg-slate-900 p-6 z-10 border-t border-slate-800 text-center relative">
            {/* Tech Decoration Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
            
            <p className="text-slate-400 text-sm mb-2 font-medium">
                Real-time Anatomical Mapping
            </p>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
                Interact with the medical-grade wireframe model using hand gestures to understand anatomical structure.
            </p>
        </div>
    </div>
  );

  const renderNotes = () => (
    <div className="p-6 max-w-lg mx-auto pt-20 min-h-screen flex flex-col">
       <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setMode(AppMode.HOME)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-light text-white">Notes & Helper</h2>
      </div>

      <div className="space-y-6">
        {/* Doctor Helper Section */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3 text-indigo-400">
             <Info size={20} />
             <h3 className="font-medium">When calling a doctor</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">You can use these phrases if you're unsure what to say:</p>
          <ul className="space-y-2">
            {EDUCATIONAL_CONTENT.doctorHelper.map((phrase, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-indigo-500">•</span> {phrase}
              </li>
            ))}
          </ul>
        </div>

        {/* Add Note */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">My Notes</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="E.g., Felt a small bump on the left side..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button 
              onClick={handleAddNote}
              className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium px-4 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
           {notes.length === 0 && (
             <p className="text-center text-slate-600 py-8">No notes yet.</p>
           )}
           {notes.map(note => (
             <div key={note.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
               <span className="text-xs text-slate-500 block mb-1">{note.date}</span>
               <p className="text-slate-200">{note.content}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderLearn = () => (
     <div className="p-6 max-w-lg mx-auto pt-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setMode(AppMode.HOME)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-light text-white">Learn the Basics</h2>
      </div>

      <div className="space-y-6">
         <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 relative overflow-hidden">
             {/* Simplified static visual for learning mode */}
             <div className="absolute inset-0 flex items-center justify-center opacity-30">
               <div className="w-32 h-32 bg-teal-500 rounded-full blur-3xl"></div>
             </div>
             <p className="relative z-10 text-slate-400">Anatomy Visualization</p>
         </div>

         <div className="prose prose-invert">
            <h3 className="text-white font-medium text-lg">What is normal?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Testicles should feel smooth and firm, but not hard. One testicle may be slightly larger or hang lower than the other. This is completely normal.
            </p>

            <h3 className="text-white font-medium text-lg mt-6">What is the Epididymis?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              This is a soft, coiled tube located at the back of each testicle. It collects and transports sperm. It can feel lumpy, and that is normal. Beginners often mistake this for a problem, but it's a healthy part of your anatomy.
            </p>
            
            <h3 className="text-rose-400 font-medium text-lg mt-6">Signs to check</h3>
            <ul className="text-slate-400 text-sm space-y-2 mt-2">
              <li className="flex gap-2"><span className="text-rose-500">•</span> A hard lump or nodule (often painless).</li>
              <li className="flex gap-2"><span className="text-rose-500">•</span> Swelling or enlargement of a testicle.</li>
              <li className="flex gap-2"><span className="text-rose-500">•</span> A dull ache in the lower abdomen or groin.</li>
            </ul>
         </div>
      </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* Navbar for persistent access if not in guided flow */}
      {mode !== AppMode.GUIDED_CHECK && mode !== AppMode.ONBOARDING && mode !== AppMode.DIGITAL_TWIN && (
        <nav className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-md z-30 border-b border-white/5">
           <div className="flex items-center gap-2" onClick={() => setMode(AppMode.HOME)}>
             <Heart className="text-teal-500" size={24} />
             <span className="font-semibold tracking-wide">Gentle Check</span>
           </div>
           <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-400 hover:text-white">
             <Menu size={24} />
           </button>
        </nav>
      )}

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/95 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-200">
           <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
             <X size={32} />
           </button>
           <button onClick={() => { setMode(AppMode.HOME); setMenuOpen(false); }} className="text-2xl font-light hover:text-teal-400">Home</button>
           <button onClick={() => { setMode(AppMode.LEARN); setMenuOpen(false); }} className="text-2xl font-light hover:text-teal-400">Learn</button>
           <button onClick={() => { setMode(AppMode.DIGITAL_TWIN); setMenuOpen(false); }} className="text-2xl font-light hover:text-teal-400">Digital Twin</button>
           <button onClick={() => { setShowPrivacy(true); setMenuOpen(false); }} className="text-2xl font-light hover:text-teal-400">Privacy</button>
           <button onClick={() => { setMode(AppMode.ONBOARDING); setMenuOpen(false); }} className="text-sm text-slate-500 mt-8">Reset App</button>
        </div>
      )}

      {/* Main Content Router */}
      <main>
        {mode === AppMode.ONBOARDING && renderOnboarding()}
        {mode === AppMode.HOME && renderHome()}
        {mode === AppMode.GUIDED_CHECK && renderGuidedCheck()}
        {mode === AppMode.DIGITAL_TWIN && renderDigitalTwin()}
        {mode === AppMode.LEARN && renderLearn()}
        {mode === AppMode.NOTES && renderNotes()}
      </main>

      {/* Global Overlays */}
      {showPrivacy && <PrivacyOverlay onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default App;