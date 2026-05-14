/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Gavel, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  ChevronRight,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Plus,
  Cpu,
  Database,
  Activity,
  History
} from 'lucide-react';
import { LegalArea, SimulationResult, ReportContent, AppState, Attachment } from './types';
import { validateCausa, simulateForum, generateReport } from './lib/gemini';
import { auth, loginWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getStats, saveSimulation, getUserSimulations } from './services/dbService';


const CensoredText = ({ text, enabled }: { text: string; enabled: boolean }) => {
  if (!enabled) return <>{text}</>;
  
  // Split into chunks to simulate blocks of redacted text
  const words = text.split(' ');
  const result: React.ReactNode[] = [];
  let i = 0;
  
  while (i < words.length) {
    // Increase probability of censorship for and ensure chunks are meaningful
    const isCensored = (i % 7 === 0) || (i % 11 === 0);
    const chunkSize = isCensored ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 4) + 2;
    const chunk = words.slice(i, i + chunkSize).join(' ');
    
    if (isCensored && chunk.length > 3) {
      result.push(
        <span 
          key={i} 
          className="bg-black text-black select-none mx-0.5 rounded-none px-1 inline-block leading-none h-[1.1em] align-middle border-y border-white/5 shadow-sm"
          title="CONTEÚDO CENSURADO"
        >
          {chunk.replace(/./g, 'X')}
        </span>
      );
    } else {
      result.push(<span key={i}>{chunk} </span>);
    }
    i += chunkSize;
  }
  
  return <>{result}</>;
};


import { Logo } from './components/Logo';

const cleanJudgmentText = (text: string) => {
  if (!text) return "";
  // Remove markdown json blocks if they contain the probability
  let cleaned = text.replace(/```json\s*\{\s*"success_probability"\s*:\s*\d+\s*\}\s*```/gs, '');
  // Remove raw json if it contains the probability
  cleaned = cleaned.replace(/\{\s*"success_probability"\s*:\s*\d+\s*\}/gs, '');
  cleaned = cleaned.trim();
  
  if (cleaned.length < 5 && text.includes('success_probability')) {
    return "A análise técnica foi processada e a probabilidade de êxito calculada com base nos fundamentos apresentados pelo Magistrado.";
  }
  
  return cleaned;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [globalStats, setGlobalStats] = useState({ simulations: 14282, winRate: 74.8, precision: 98.4 });
  const [state, setState] = useState<AppState>({
    step: 'input',
    caseDescription: '',
    attachments: [],
    detectedArea: LegalArea.OTHER,
    caseSummary: null,
    specificJudge: null,
    simulation: null,
    report: null,
    isUnlocked: false,
    simStep: 'IDLE',
    currentRound: 0,
  selectedProfile: 'leigo',
  activeAgents: [],
  showForgeMonitor: false,
  regionalStats: [
    { region: "TRF1 (Norte / CO)", seeds: 412, active: 18 },
    { region: "TRF2 (RJ / ES)", seeds: 284, active: 12 },
    { region: "TRF3 (SP / MS)", seeds: 567, active: 31 },
    { region: "TRF4 (Sul)", seeds: 319, active: 22 },
    { region: "TRF5 (Nordeste)", seeds: 245, active: 9 },
    { region: "Supremos (STJ / STF)", seeds: 88, active: 41 }
  ],
  error: null
});

  // Auth & Stats listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const history = await getUserSimulations(u.uid);
        setUserHistory(history);
      } else {
        setUserHistory([]);
      }
    });
    
    const fetchInitialStats = async () => {
      const stats = await getStats();
      setGlobalStats({
        simulations: stats.totalSimulations,
        winRate: Number(stats.winRate.toFixed(1)),
        precision: 98.4 // Mocked for now
      });
    };
    
    fetchInitialStats();
    return () => unsub();
  }, []);

const [loading, setLoading] = useState(false);
const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
const scrollRef = useRef<HTMLDivElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

const handleGeminiError = (err: any) => {
  console.error("Gemini Error Context:", err);
  let errorMessage = 'Ocorreu um erro ao processar sua causa. Por favor, tente novamente.';
  let isQuota = false;

  // Try to parse error if it's a string containing JSON (sometimes happens with SDK)
  let errorObj = err;
  if (typeof err === 'string') {
    try {
      errorObj = JSON.parse(err);
    } catch {}
  }

  const code = errorObj?.error?.code || errorObj?.code || errorObj?.status;
  const message = errorObj?.error?.message || errorObj?.message || (typeof err === 'string' ? err : '');

  if (code === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('spending cap')) {
    isQuota = true;
    errorMessage = 'Limite de uso atingido (Spending Cap). O EAI? atingiu o limite mensal de processamento de AI da sua conta.';
  } else if (message) {
    const cleanMessage = message.startsWith('<!DOCTYPE') || message.startsWith('<html') 
      ? 'Erro de Gateway/Conexão. O serviço de IA está temporariamente indisponível.' 
      : message;
    errorMessage = `Erro técnico: ${cleanMessage.slice(0, 150)}${cleanMessage.length > 150 ? '...' : ''}`;
  }

  setState(prev => ({ 
    ...prev, 
    error: { 
      code: code || 500, 
      message: errorMessage,
      isQuota 
    } 
  }));
};

  // Auto-scroll simulation rounds
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.simulation?.rounds]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    const fileList: File[] = Array.from(files);
    
    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Arquivo ${file.name} é muito grande (máx 10MB)`);
        continue;
      }

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      });
    }

    setState(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index: number) => {
    setState(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleValidate = async () => {
    if (!state.caseDescription.trim()) return;
    setLoading(true);
    try {
      const data = await validateCausa(state.caseDescription, state.attachments);
      setState(prev => ({ 
        ...prev, 
        step: 'confirm', 
        detectedArea: data.area || LegalArea.OTHER, 
        specificJudge: data.specificJudge,
        caseSummary: data.summary,
        selectedProfile: data.detectedProfile || prev.selectedProfile,
        error: null
      }));
    } catch (err) {
      handleGeminiError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulation = (sim: any) => {
    setState(prev => ({
      ...prev,
      step: 'result',
      caseDescription: sim.caseDescription,
      detectedArea: sim.area || LegalArea.OTHER,
      caseSummary: sim.caseSummary,
      simulation: {
        area: sim.area,
        rounds: sim.rounds || [],
        finalSuccessProbability: sim.finalSuccessProbability,
        lawyerAgentName: sim.lawyerAgentName,
        judgeAgentName: sim.judgeAgentName
      },
      report: sim.report,
      isUnlocked: true
    }));
    setShowHistory(false);
  };

  const handleSimulate = async () => {
    setLoading(true);
    setState(prev => ({ ...prev, step: 'simulating' }));
    try {
      const data = await simulateForum(
        state.caseDescription, 
        state.detectedArea, 
        state.attachments, 
        state.specificJudge,
        (step, progressData) => {
          setState(prev => {
            let newStats = [...prev.regionalStats];
            let newActiveAgents = [...prev.activeAgents];

            if (step === 'SEED_CREATED' && progressData?.regionIndex !== undefined) {
              const idx = progressData.regionIndex;
              newStats[idx] = {
                ...newStats[idx],
                seeds: newStats[idx].seeds + 1,
                active: newStats[idx].active + 1
              };
            }

            // Update agents list when they transition to visible roles
            if (progressData?.lawyerName && !newActiveAgents.find(a => a.name === progressData.lawyerName)) {
              newActiveAgents.push({ name: progressData.lawyerName, type: 'Advogado', id: `LAW_${Date.now()}` });
            }
            if (progressData?.judgeName && !newActiveAgents.find(a => a.name === progressData.judgeName)) {
              newActiveAgents.push({ name: progressData.judgeName, type: 'Magistrado', id: `JUI_${Date.now()}` });
            }

            return {
              ...prev,
              simStep: step,
              currentRound: progressData?.round || prev.currentRound,
              regionalStats: newStats,
              activeAgents: newActiveAgents,
              error: null,
              simulation: progressData 
                ? { 
                    ...(prev.simulation || { area: state.detectedArea, rounds: [], finalSuccessProbability: 0 }), 
                    lawyerAgentName: progressData.lawyerName || prev.simulation?.lawyerAgentName,
                    judgeAgentName: progressData.judgeName || prev.simulation?.judgeAgentName,
                    rounds: progressData.rounds || prev.simulation?.rounds || []
                  } as SimulationResult
                : prev.simulation
            };
          });
        }
      );
      // Select the best round based on probability (highest, then latest if tie)
      let bestRound = data.rounds[0];
      for (const round of data.rounds) {
        if (round.successProbability >= bestRound.successProbability) {
          bestRound = round;
        }
      }

      // Update data to reflect the best round's probability as the final one
      const finalData = {
        ...data,
        finalSuccessProbability: bestRound.successProbability
      };
      
      setState(prev => ({ ...prev, simulation: finalData }));
      
      // After simulation, get report based on BEST round
      const reportData = await generateReport(
        bestRound.lawyerPetition,
        bestRound.judgeJudgment
      );
      setState(prev => ({ ...prev, step: 'result', report: reportData, error: null }));

      // Save simulation to Firebase with the optimized result
      await saveSimulation(user?.uid || null, state.caseDescription, finalData, state.caseSummary, reportData);
      
      // Refresh history if logged in
      if (user) {
        const history = await getUserSimulations(user.uid);
        setUserHistory(history);
      }
      
      // Update local stats display
      const newStatsResult = await getStats();
      setGlobalStats({
        simulations: newStatsResult.totalSimulations,
        winRate: Number(newStatsResult.winRate.toFixed(1)),
        precision: 98.4
      });
    } catch (err) {
      handleGeminiError(err);
      setState(prev => ({ ...prev, step: 'input' }));
    } finally {
      setLoading(false);
    }
  };

  const areaLabels: Record<LegalArea, string> = {
    [LegalArea.CONSUMER]: "Direito do Consumidor",
    [LegalArea.LABOR]: "Direito do Trabalho",
    [LegalArea.CIVIL]: "Direito Cível",
    [LegalArea.SOCIAL_SECURITY]: "Direito Previdenciário",
    [LegalArea.FAMILY]: "Direito de Família",
    [LegalArea.OTHER]: "Geral / Outros"
  };

  const redact = (text: string | undefined, isUnlocked: boolean) => {
    if (!text) return "";
    if (isUnlocked) return text;
    
    // Simple mock redaction: wrap some parts in black spans
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (i > 3 && i < 8) {
        return <span key={i} className="bg-black text-black select-none px-2 rounded-sm block w-full mb-1">REDACTED</span>;
      }
      return <p key={i} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E5E5] font-sans selection:bg-white/10 flex flex-col overflow-x-hidden print:bg-white print:text-black">
      <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between bg-[#111111]/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <Logo size="md" showTitle={false} />
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setState(prev => ({ ...prev, showForgeMonitor: !prev.showForgeMonitor }))}
            className={`flex items-center gap-2 px-3 py-1.5 border transition-all lg:flex hidden ${state.showForgeMonitor ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
          >
            <Cpu className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Forge Monitor</span>
          </button>
          <div className="flex flex-col items-end lg:flex hidden">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Status da Simulação</span>
            <span className={`text-xs font-mono font-bold ${state.step === 'simulating' ? 'text-amber-500' : 'text-emerald-500'}`}>
              {state.step === 'input' ? 'AGUARDANDO CAUSA' : 
               state.step === 'confirm' ? 'ANALISANDO ÁREA' :
               state.step === 'simulating' ? 'SIMULAÇÃO EM CURSO' : 'SIMULAÇÃO CONCLUÍDA'}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden lg:block"></div>
          {user ? (
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors border-r border-white/10 pr-6 mr-2 h-8"
              >
                <History className="w-3 h-3" />
                Meus Casos
              </button>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/10 rounded-full overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="" /> : <div className="w-full h-full bg-white/20" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{user.displayName?.split(' ')[0]}</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => loginWithGoogle()}
              className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Entrar
            </button>
          )}
          <button 
            className="px-4 py-2 border border-white text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors lg:block hidden"
            onClick={() => window.location.reload()}
          >
            Nova Consulta
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden min-h-[calc(100vh-64px)]">
        <div className="col-span-12 lg:col-span-8 p-8 flex flex-col gap-6 lg:border-r border-white/5 overflow-y-auto print:col-span-12 print:p-0 print:border-none">
          <AnimatePresence mode="wait">
            {state.error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-sm flex items-start gap-4 shadow-2xl shadow-red-500/5"
              >
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500">Falha na Operação</h3>
                  <p className="text-sm font-serif italic text-white/80">{state.error.message}</p>
                  {state.error.isQuota && (
                    <div className="pt-4 border-t border-red-500/10 mt-4 space-y-4">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                        Este erro ocorre quando o limite financeiro configurado no Google AI Studio é atingido. Para continuar, você deve aumentar o "Spending Cap" nas configurações do seu projeto.
                      </p>
                      <a 
                        href="https://ai.studio/spend" 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-block px-4 py-2 border border-red-500/30 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        Acessar AI Studio Spend
                      </a>
                    </div>
                  )}
                  <button 
                    onClick={() => setState(prev => ({ ...prev, error: null }))}
                    className="absolute top-4 right-4 text-white/20 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {state.step === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-12 gap-8 lg:gap-12"
              >
                <div className="col-span-12 xl:col-span-8 space-y-12">
                  <div className="space-y-4">
                    <h1 className="text-5xl font-serif italic tracking-tight leading-[1.1] text-white">
                      Descreva sua causa para iniciar a <br /><span className="text-[#F4F4F2] font-bold">simulação de fórum.</span>
                    </h1>
                    <p className="text-white/40 max-w-lg text-sm uppercase tracking-widest font-medium">
                      Tecnologia de ponta para análise estratégica de petições, processada por agentes autônomos especializados.
                    </p>
                  </div>

                  <div className="bg-[#15161A] border border-white/10 relative group shadow-2xl shadow-black/50">
                    <textarea
                      value={state.caseDescription}
                      onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                      placeholder="Descreva aqui os detalhes da causa, fatos principais e argumentos jurídicos. Nossa IA processa textos longos sem limite de caracteres..."
                      className="w-full min-h-[400px] h-auto bg-transparent p-8 outline-none transition-all text-2xl font-serif italic text-white/90 resize-y placeholder:opacity-10"
                    />
                    
                    {/* Attachments List */}
                    {state.attachments.length > 0 && (
                      <div className="px-8 pb-4 flex flex-wrap gap-3">
                        {state.attachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[#1C1C1F] px-3 py-1.5 rounded-sm border border-white/5 group/file">
                            {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-white/40" /> : <FileIcon className="w-3 h-3 text-white/40" />}
                            <span className="text-[10px] font-bold uppercase tracking-tight max-w-[120px] truncate text-white/60">{file.name}</span>
                            <button 
                              onClick={() => removeAttachment(i)}
                              className="text-white/30 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                          accept="image/*,application/pdf"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-3 px-4 py-2 border border-white/10 rounded-sm hover:bg-white/5 transition-all text-white/40 group-hover:text-white/60"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Anexar Provas</span>
                        </button>
                        <div className="w-[1px] h-4 bg-white/10 mx-2"></div>
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">PDF, JPEG ou PNG</p>
                      </div>

                      <button
                        disabled={!state.caseDescription.trim() || loading}
                        onClick={handleValidate}
                        className="px-8 py-4 bg-white text-black disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#F4F4F2] transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar Causa"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10 shadow-xl shadow-black/30">
                    {[
                      { title: "PROVA ROBUSTA", desc: "Análise multimídia de documentos e evidências anexadas." },
                      { title: "TABULA RASA", desc: "Juízes sem memória garantem imparcialidade técnica a cada round." },
                      { title: "LEGAL BRIEFS", desc: "Advogados utilizam resumos estratégicos para evolução processual." }
                    ].map((feat, i) => (
                      <div key={i} className="p-6 bg-[#15161A] space-y-2">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">{feat.title}</h4>
                        <p className="text-xs text-white/30 leading-relaxed font-medium">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                  {/* Resumo Analítico - Global Stats */}
                  <div className="bg-[#1C1C1F] text-white p-8 rounded-sm space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group border border-white/10">
                    <div className="absolute inset-0 bg-white/5 -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    <div className="flex justify-between items-center opacity-30">
                      <span className="text-[9px] uppercase tracking-widest font-bold">Performance Global EAI?</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium opacity-40 uppercase tracking-widest text-emerald-400">Ganhos de Causa via EAI?</div>
                        <div className="text-6xl font-serif italic text-white/90">
                          {globalStats.winRate}%
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-white/5 pt-6">
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-none">Simulações Concluídas</div>
                          <div className="text-2xl font-mono text-white/80">{globalStats.simulations.toLocaleString()}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-none">Precisão Média</div>
                          <div className="text-2xl font-mono text-emerald-500 font-bold">{globalStats.precision}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-white/10 font-bold border-t border-white/5 pt-4 flex justify-between">
                       <span>ALGORITMO: LEX_FRAME_V3</span>
                       <span>STATUS: OPTIMIZED</span>
                    </div>
                  </div>

                  <div className="bg-[#15161A] border border-white/10 p-8 space-y-8 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Disponibilidade de Sementes</h3>
                      <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">Status Global Agents / Judicial Regions</p>
                    </div>

                    <div className="space-y-5">
                      {state.regionalStats.map((stat, i) => (
                        <div key={i} className="space-y-2 group cursor-default">
                          <div className="flex justify-between items-end">
                            <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">{stat.region}</span>
                            <span className="text-[11px] font-mono text-emerald-500">{stat.active} online</span>
                          </div>
                          <div className="h-[2px] bg-white/5 overflow-hidden rounded-full">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(stat.seeds / 800) * 100}%` }}
                              transition={{ duration: 1.5, delay: i * 0.1 }}
                              className="h-full bg-white/20 group-hover:bg-emerald-500/50 transition-colors"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter text-white/20">
                            <motion.span
                              key={stat.seeds}
                              initial={{ opacity: 0.5, y: -2 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {stat.seeds} sementes integradas
                            </motion.span>
                            <span>{((stat.seeds / 1915) * 100).toFixed(1)}% core</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="bg-white/5 p-4 space-y-2 border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Ativos</span>
                          <span className="text-xs font-mono text-emerald-500 font-bold">
                            {state.regionalStats.reduce((acc, s) => acc + s.active, 0)} AGENTES
                          </span>
                        </div>
                        <div className="text-[9px] text-white/20 leading-relaxed font-serif italic">
                          A simulação consome sementes aleatórias de acordo com a área do conflito identificada na etapa de validação.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1C1C1F] border border-white/10 p-6 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Rede Descentralizada</span>
                      <span className="text-[9px] font-mono text-white/30 uppercase">Latency: 42ms / Node: 0xF1..2A</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {state.step === 'confirm' && (
              <motion.div 
                key="confirm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 py-16 text-center max-w-3xl mx-auto"
              >
                <div className="w-20 h-20 border border-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-white/5">
                  <Scale className="text-white w-10 h-10" />
                </div>
                <h1 className="text-4xl font-serif italic tracking-tight text-white/90">
                  Causa identificada como <br />
                  <span className="font-bold border-b border-white pb-1 text-white">
                    {areaLabels[state.detectedArea] || "Área Não Classificada"}
                  </span>
                </h1>

                {state.caseSummary && (
                  <div className="bg-[#15161A] p-8 border border-white/10 shadow-2xl shadow-black/50 mt-8 text-left">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-4 border-b border-white/5 pb-2">Núcleo Central Entendido</h4>
                    <p className="text-xl font-serif italic text-white/80 leading-relaxed">
                      "{state.caseSummary}"
                    </p>
                  </div>
                )}
                
                <p className="text-white/40 text-sm font-sans uppercase tracking-widest leading-relaxed mt-8 max-w-lg mx-auto">
                  {state.specificJudge ? `Juiz/Comarca identificado: ${state.specificJudge}. ` : ''}Agentes especializados escalados. Deseja iniciar o fórum?
                </p>
                <div className="flex justify-center gap-4 pt-6">
                  <button 
                    onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
                    className="px-10 py-4 border border-white/10 text-[11px] uppercase tracking-widest hover:bg-white/5 transition-colors font-bold text-white/60"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleSimulate}
                    className="px-10 py-4 bg-white text-black text-[11px] uppercase tracking-widest hover:bg-[#F4F4F2] transition-colors font-bold shadow-2xl shadow-black/50"
                  >
                    Iniciar Fórum
                  </button>
                </div>
              </motion.div>
            )}

            {(state.step === 'simulating' || (state.step === 'result' && !state.isUnlocked)) && (
              <motion.div 
                key="simulating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-3xl font-serif italic text-white">Arena de Simulação</h2>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/20 mt-1">Sessão Virtual #72199</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(r => (
                      <div 
                        key={r}
                        className={`w-3 h-3 rounded-full border border-white/20 ${
                          (state.simulation?.rounds.length || 0) >= r ? 'bg-emerald-500' : 'bg-white/5'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div 
                  ref={scrollRef}
                  className="space-y-12 max-h-[700px] overflow-y-auto pr-4 scrollbar-thin overflow-x-hidden"
                >
                  {state.simulation?.rounds.map((round, i) => (
                    <div key={i} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono font-bold text-white/10">RODADA {i + 1}</span>
                        <div className="h-px bg-white/5 flex-1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Agent: Lawyer */}
                        <div className="bg-[#15161A] border border-white/10 p-6 rounded-sm shadow-xl shadow-black/40 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-white/40"></div>
                           <div className="flex justify-between items-center mb-6">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-mono text-white/20">AGT_LAW_{state.detectedArea}</span>
                               <span className="text-sm font-bold uppercase tracking-tight text-white/80">Advogado Especialista</span>
                             </div>
                             <span className="px-2 py-0.5 bg-white text-black text-[9px] uppercase tracking-widest font-bold">Petição</span>
                           </div>
                           <div className="text-xs text-white/50 leading-relaxed italic font-serif mb-6 line-clamp-4">
                             "<CensoredText text={round.lawyerPetition} enabled={!state.isUnlocked} />"
                           </div>

                           {round.lawyerBrief && (
                             <div className="mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-sm">
                               <div className="flex items-center gap-2 mb-2">
                                 <TrendingUp className="w-3 h-3 text-white/20" />
                                 <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Brief Estratégico (Memória)</span>
                               </div>
                               <p className="text-[10px] text-white/40 leading-relaxed font-mono italic">
                                 <CensoredText text={round.lawyerBrief} enabled={!state.isUnlocked} />
                               </p>
                             </div>
                           )}

                           <div className="flex justify-between items-end">
                             <div className="flex-1 max-w-[120px]">
                               <div className="text-[8px] uppercase font-bold text-white/20 mb-1">Impacto Técnico</div>
                               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-white/60" style={{ width: `${60 + i * 15}%` }}></div>
                               </div>
                             </div>
                             <span className="text-[9px] font-mono font-bold text-white/20">MEMÓRIA OK</span>
                           </div>
                        </div>

                        {/* Agent: Judge */}
                        <div className="bg-[#1C1C1F] border border-white/10 p-6 rounded-sm shadow-xl shadow-black/40 relative overflow-hidden backdrop-blur-sm">
                           <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/60"></div>
                           <div className="flex justify-between items-center mb-6">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-mono text-white/20">AGT_JUDGE_{state.detectedArea}</span>
                               <span className="text-sm font-bold uppercase tracking-tight text-white/80">Magistrado Técnico</span>
                             </div>
                             <span className="px-2 py-0.5 border border-white/40 text-white text-[9px] uppercase tracking-widest font-bold">Sentença</span>
                           </div>
                           <div className="text-xs text-white/50 leading-relaxed font-sans mb-6 line-clamp-4">
                             "<CensoredText text={cleanJudgmentText(round.judgeJudgment)} enabled={!state.isUnlocked} />"
                           </div>
                           <div className="flex justify-between items-end">
                             <div className="bg-white/5 px-3 py-1.5 flex flex-col">
                               <span className="text-[8px] font-bold text-white/30 uppercase">Probabilidade de Êxito</span>
                               <span className="text-lg font-serif italic font-bold text-white/90">{round.successProbability}%</span>
                             </div>
                             <span className="text-[9px] font-mono font-bold text-white/20">ISENÇÃO 100%</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="relative">
                        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                        <div className="absolute inset-0 blur-md animate-pulse bg-white/5 rounded-full"></div>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Processando Inteligência...</div>
                    </div>
                  )}
                </div>

                {state.step === 'result' && !state.isUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 p-10 bg-[#15161A] border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <Lock className="text-white/5 w-24 h-24 -rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                      <h3 className="text-3xl font-serif italic text-white">Simulação de Rodadas Concluída.</h3>
                      <p className="text-sm text-white/40 max-w-lg leading-relaxed uppercase tracking-widest font-medium">
                        O laudo estratégico completo com fundamentos técnicos, valor estimado da causa e próximos passos processuais foi gerado.
                      </p>
                      <button 
                        onClick={() => setState(prev => ({ ...prev, isUnlocked: true }))}
                        className="bg-white text-black px-12 py-5 text-sm font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-2xl shadow-black"
                      >
                        Liberar Laudo Completo — R$ 9,90
                      </button>
                      <div className="flex gap-8 border-t border-white/5 pt-6 text-[9px] font-bold uppercase tracking-widest text-white/20">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Liberação PIX</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Acesso Vitalício</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Formato Profissional</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {state.step === 'result' && state.isUnlocked && (
              <motion.div 
                key="full-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12 pb-32"
              >
                <div className="hidden print:block mb-12 border-b-2 border-black pb-6">
                  <div className="flex justify-between items-center">
                    <Logo variant="light" size="lg" />
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">Relatório Estratégico de Performance</div>
                      <div className="text-[10px] font-mono text-black/20">EMITIDO EM: {new Date().toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-8 print:border-black/10">
                  <h2 className="text-5xl font-serif italic tracking-tight text-white/90 print:text-black">
                    Laudo <span className="text-white font-bold print:text-black">Estratégico</span>
                  </h2>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/20 print:text-black/40">Probabilidade Final</span>
                    <span className="text-4xl font-serif italic text-emerald-500 font-bold print:text-black">
                      {(state.simulation?.rounds && state.simulation.rounds.length > 0) ? `${state.simulation.finalSuccessProbability}` : "--"}
                    %</span>
                  </div>
                </div>

                {state.caseSummary && (
                  <div className="p-8 bg-white/5 border border-white/10 print:bg-gray-50 print:border-black/10 print:p-6 mb-8">
                    <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40 print:text-black/60 mb-3">Objeto da Simulação (Entendimento do Sistema)</h4>
                    <p className="text-xl font-serif italic text-white/90 leading-relaxed print:text-black">
                      "{state.caseSummary}"
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-16 print:gap-8">
                  {/* Volume 1: Orientação ao Cliente */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-emerald-500/30 pb-4 print:border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-emerald-500 text-black px-4 py-1.5 rounded-sm print:bg-black print:text-white w-fit">
                          VOLUME I: ORIENTAÇÃO AO CLIENTE
                        </span>
                        <span className="text-[8px] font-mono text-emerald-500/50 uppercase tracking-widest pl-1">Linguagem Acessível e Prática</span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex flex-col items-end print:hidden">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/60">Agente Responsável</div>
                        <div className="text-[11px] font-serif italic text-white/40">Estrategista de Acessibilidade</div>
                      </div>
                    </div>
                    <div className="prose prose-invert max-w-none font-serif text-lg leading-[1.6] text-white/90 font-light italic bg-emerald-500/[0.05] p-8 border border-emerald-500/20 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                      <ReactMarkdown>
                        {state.report?.layman || ''}
                      </ReactMarkdown>
                    </div>
                  </section>

                  {/* Volume 2: Fundamentação Técnica Estratégica */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4 print:border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-white/10 text-white px-4 py-1.5 rounded-sm print:bg-black print:text-white w-fit">
                          VOLUME II: LAUDO TÉCNICO ESTRATÉGICO
                        </span>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest pl-1">Fundamentação Jurídica e Normativa</span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex flex-col items-end print:hidden">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Agente Responsável</div>
                        <div className="text-[11px] font-serif italic text-white/40">Analista Processual Sênior</div>
                      </div>
                    </div>
                    <div className="p-10 border border-white/5 bg-[#15161A]/50 font-mono text-[13px] leading-loose text-white/60 shadow-2xl relative overflow-hidden prose prose-invert prose-sm max-w-none print:bg-white print:text-black/80 print:border-none print:shadow-none print:p-0">
                      <ReactMarkdown>
                        {state.report?.professional || ''}
                      </ReactMarkdown>
                    </div>
                  </section>

                  {/* Volume 3: Anexos Processuais (Audit Trail) */}
                  <section className="space-y-6 pt-12 border-t-2 border-white/10 print:border-black/20 print:pt-8 print:break-before-page">
                    <div className="flex flex-col gap-2 border-b border-white/5 pb-6 print:border-black/10">
                      <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-white/40 print:text-black/60">
                        ANEXO I: HISTÓRICO DE EVOLUÇÃO DAS PEÇAS E JULGAMENTOS
                      </span>
                      <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em] print:text-black/30 italic">
                        Memorial Descritivo do Ciclo de Debate Estratégico (Lawyer VS Judge Dynamics)
                      </span>
                    </div>
                    
                    <div className="space-y-12 print:space-y-10">
                      {state.simulation?.rounds.map((round, idx) => (
                        <div key={idx} className="border-l-4 border-emerald-500/30 bg-white/[0.01] p-10 space-y-8 rounded-r-md print:border-black/20 print:bg-white print:p-0 print:border-l-0 print:space-y-6">
                          <div className="flex justify-between items-center border-b border-white/5 pb-4 print:border-black/10">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center text-sm font-bold font-mono print:bg-black print:text-white">
                                {round.round}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/80 print:text-black">Ciclo de Aperfeiçoamento Processual</span>
                                <span className="text-[9px] font-mono text-white/20 print:text-black/40">ID_PROTOCOLO: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Aproveitamento</div>
                              <div className="text-xl font-serif italic text-white print:text-black">{round.successProbability}%</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:gap-8">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Scale className="w-4 h-4 text-emerald-500 print:text-black" />
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest print:text-black">Petição e Pedidos do Advogado</span>
                              </div>
                              <div className="p-6 bg-white/[0.02] border border-white/5 text-[13px] leading-relaxed text-white/50 italic font-serif print:text-black print:bg-gray-50 print:border-black/10 print:p-4">
                                "{round.lawyerPetition}"
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-white/20 print:text-black" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest print:text-black/60">Análise e Decisão do Magistrado</span>
                              </div>
                              <div className="p-6 bg-white/[0.01] border border-dashed border-white/5 text-[13px] leading-relaxed text-white/40 font-mono print:text-black print:bg-gray-50 print:border-black/10 print:p-4 whitespace-pre-wrap">
                                {cleanJudgmentText(round.judgeJudgment)}
                              </div>
                            </div>
                          </div>

                          {round.lawyerBrief && (
                            <div className="mt-4 p-6 bg-emerald-500/5 rounded-sm border border-emerald-500/10 print:border-black/5 print:bg-gray-100">
                               <div className="flex items-center gap-2 mb-3">
                                 <History className="w-4 h-4 text-emerald-500/40 print:text-black/40" />
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/40 print:text-black/60">Insight Estratégico Retido para o Próximo Ciclo</span>
                               </div>
                               <p className="text-[11px] text-white/40 leading-relaxed font-mono italic print:text-black/80">
                                 {round.lawyerBrief}
                               </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-[#0F1012] p-8 flex flex-col gap-10 overflow-y-auto border-l border-white/5 no-print">
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3 flex items-center justify-between text-white/60">
              Boardroom <span className="text-[8px] font-mono opacity-20">V.2.4</span>
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: "ÁREA IDENTIFICADA", s: areaLabels[state.detectedArea], icon: ShieldCheck },
                  { n: "FORO / COMARCA", s: state.specificJudge || "Justiça Comum / JEC", icon: Gavel },
                ].map((m, i) => (
                  <div key={i} className="bg-white/5 p-4 border border-white/5 space-y-1">
                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">{m.n}</div>
                    <div className="text-[11px] text-white font-medium italic font-serif leading-tight">{m.s}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-white/20">Sementes Ativadas na Sessão</h4>
                <div className="grid grid-cols-1 gap-3">
                  {state.activeAgents.length > 0 ? (
                    state.activeAgents.map((agent, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={agent.id} 
                        className="bg-white/5 p-3 border border-white/5 space-y-1 relative group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start">
                          <div className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-tighter">{agent.type}</div>
                          <div className="text-[7px] font-mono text-white/20">0x{(i * 133).toString(16).toUpperCase()}</div>
                        </div>
                        <div className="text-[10px] text-white font-medium italic font-serif leading-tight">{agent.name}</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-[9px] text-white/10 italic p-4 border border-dashed border-white/5 text-center">
                      Aguardando ativação de sementes...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-0">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3 text-white/20 flex justify-between items-center">
              <span>Fluxo Estratégico</span>
              {state.simStep !== 'IDLE' && state.currentRound > 0 && (
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/40">ROUND {state.currentRound}</span>
              )}
            </h3>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-10 py-4">
                <div className="flex flex-col items-center gap-6 relative">
                  {/* Vertical line connecting steps */}
                  <div className="absolute top-5 bottom-5 left-[23px] w-px bg-white/10" />

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'WRITING' ? 'bg-white/10 border-white/20 scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-white flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'WRITING' ? 'bg-white text-black' : 'bg-[#0F1012]'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white">Peticionando</span>
                      <span className="text-[9px] text-white/40 uppercase font-mono italic">Advogado Especialista</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'DELIVERING' ? 'bg-white/10 border-white/20 scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-white flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'DELIVERING' ? 'bg-white text-black' : 'bg-[#0F1012]'}`}>
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white">Protocolando</span>
                      <span className="text-[9px] text-white/40 uppercase font-mono italic">Barramento Digital</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'JUDGING' ? 'bg-white/10 border-white/20 scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-white flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'JUDGING' ? 'bg-white text-black' : 'bg-[#0F1012]'}`}>
                      <Gavel className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white">Julgando</span>
                      <span className="text-[9px] text-white/40 uppercase font-mono italic">Magistrado Técnico</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'REVIEWING' ? 'bg-white/10 border-white/20 scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-white flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'REVIEWING' ? 'bg-white text-black' : 'bg-[#0F1012]'}`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white">Revisando</span>
                      <span className="text-[9px] text-white/40 uppercase font-mono italic">Memória & Estratégia</span>
                    </div>
                  </div>
                </div>
                
                <div className={`transition-all duration-500 ${state.simStep !== 'IDLE' ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-sm">
                    <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] leading-relaxed text-center animate-pulse">
                      {state.simStep === 'WRITING' && `>> R${state.currentRound}: Redigindo tese jurídica...`}
                      {state.simStep === 'DELIVERING' && `>> R${state.currentRound}: Transmitindo dados...`}
                      {state.simStep === 'JUDGING' && `>> R${state.currentRound}: Avaliando fundamentos...`}
                      {state.simStep === 'REVIEWING' && state.currentRound > 0 && `>> R${state.currentRound}: Processando precedentes...`}
                      {state.simStep === 'REVIEWING' && state.currentRound === 0 && `>> Inicializando Agentes...`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-auto pt-8">
            {/* Contextual Summary for active process */}
            {(state.step === 'simulating' || state.step === 'result') && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1C1C1F] text-white p-6 rounded-sm space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group border border-white/10"
              >
                <div className="absolute inset-0 bg-white/5 -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                <div className="flex justify-between items-center opacity-30">
                  <span className="text-[9px] uppercase tracking-widest font-bold">Resumo do Caso Atual</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-medium opacity-40 uppercase tracking-widest text-emerald-400">Taxa de Sucesso</div>
                  <div className="text-5xl font-serif italic text-white/90">
                    { (state.simulation?.rounds && state.simulation.rounds.length > 0) 
                      ? (state.simulation.finalSuccessProbability || state.simulation.rounds[state.simulation.rounds.length - 1]?.successProbability || 0)
                      : "--"
                    }%
                  </div>
                </div>
                <div className="text-[10px] font-mono text-emerald-500/60 font-bold border-t border-white/5 pt-4 flex justify-between">
                   <span>SESSÃO: {state.simulation?.lawyerAgentName ? 'SEED_ACTIVE' : 'INITIALIZING'}</span>
                   <span>VEREDITO: {state.step === 'result' ? 'CONCLUÍDO' : 'PENDENTE'}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Forge Monitor Overlay */}
      <AnimatePresence>
        {state.showForgeMonitor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="w-full max-w-6xl h-full flex flex-col gap-8">
              <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-2xl font-serif italic text-white">Central de Monitoramento de Sementes</h2>
                  </div>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-bold">EAI? Forge Instance: 0xFD-99 / Latency: 12ms</p>
                </div>
                <button 
                  onClick={() => setState(prev => ({ ...prev, showForgeMonitor: false }))}
                  className="px-6 py-2 border border-white/20 text-[10px] uppercase font-bold tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Fechar Dashboard
                </button>
              </div>

              <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
                {/* Metrics */}
                <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="bg-white/5 border border-white/5 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Agentes em Ação</span>
                    </div>
                    <div className="text-4xl font-serif italic text-white">{state.activeAgents.length}</div>
                    <div className="text-[9px] text-white/20 leading-relaxed uppercase font-bold tracking-tighter">
                      Instâncias processando tokens judiciais em tempo real
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-white/40">
                      <Database className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Biblioteca Global</span>
                    </div>
                    <div className="text-4xl font-serif italic text-white/60">
                      {state.regionalStats.reduce((acc, s) => acc + s.seeds, 0)}
                    </div>
                    <div className="text-[9px] text-white/20 leading-relaxed uppercase font-bold tracking-tighter">
                      Sementes catalogadas por jurisdição regional
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-white/40">
                      <History className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Sessões Totais</span>
                    </div>
                    <div className="text-4xl font-serif italic text-white/60">14.282</div>
                    <div className="text-[9px] text-white/20 leading-relaxed uppercase font-bold tracking-tighter">
                      Cargas de treinamento processadas desde a v1.0
                    </div>
                  </div>
                </div>

                {/* Regional Grid */}
                <div className="col-span-12 lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit overflow-y-auto pr-2 max-h-full custom-scrollbar">
                  {state.regionalStats.map((reg, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-5 space-y-4 relative group">
                      <div className="absolute top-2 right-4 text-[8px] font-mono opacity-20 italic">REG_{i+1}</div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-white/80">{reg.region}</div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(reg.seeds / 800) * 100}%` }}
                            className="h-full bg-emerald-500/50"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <div className="flex flex-col">
                          <span className="text-white/20 uppercase tracking-tighter">Seeds</span>
                          <span className="text-white/60">{reg.seeds}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-white/20 uppercase tracking-tighter">Nodes Online</span>
                          <span className="text-emerald-500">{reg.active}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Execution Log */}
                <div className="col-span-12 lg:col-span-3 border-l border-white/10 pl-8 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Logs</span>
                    <span className="text-[8px] font-mono text-emerald-500 animate-pulse">RECORDING...</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[9px] text-white/30 custom-scrollbar pr-4">
                    {state.activeAgents.map((agent, i) => (
                      <div key={i} className="border-b border-white/5 pb-2">
                        <div className="text-emerald-500/60 mb-1">[{new Date().toLocaleTimeString()}] INSTANCE_SYNC</div>
                        <div>Target: <span className="text-white/60">{agent.name}</span></div>
                        <div>Type: <span className="text-white/40">{agent.type}</span></div>
                        <div>ID: <span className="text-white/20">{agent.id}</span></div>
                      </div>
                    ))}
                    {state.activeAgents.length === 0 && (
                      <div className="italic opacity-20">Nenhuma iteração ativa no buffer...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.step === 'result' && !state.isUnlocked && (
        <footer className="fixed bottom-0 left-0 w-full h-40 border-t border-white/20 bg-[#111111] flex items-center z-[100] shadow-[0_-20px_100px_rgba(0,0,0,0.9)] no-print">
          <div className="w-1/2 p-10 border-r border-white/5 hidden md:block overflow-hidden relative">
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-white/20">Preview do Relatório Estratégico</h4>
            <div className="space-y-3 opacity-[0.05]">
              <div className="h-3 bg-white w-full"></div>
              <div className="h-3 bg-white w-5/6"></div>
              <div className="h-3 bg-white w-1/2"></div>
              <div className="h-3 bg-white w-full"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent pointer-events-none"></div>
          </div>
          <div className="flex-1 md:w-1/2 p-10 flex items-center justify-between gap-12">
            <div className="space-y-1">
              <h4 className="text-2xl font-serif italic leading-tight text-white">Obtenha o Laudo Estratégico</h4>
              <p className="text-xs text-white/30 font-medium uppercase tracking-widest leading-relaxed">Liberação imediata via PIX. Estratégia técnica detalhada.</p>
            </div>
            <button 
               onClick={() => setState(prev => ({ ...prev, isUnlocked: true }))}
               className="px-10 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] hover:scale-[1.02] transition-transform shrink-0 shadow-2xl shadow-black flex flex-col items-center leading-none"
            >
              <span>ADQUIRIR R$ 9,90</span>
              <span className="text-[8px] opacity-40 mt-1">Sessão única</span>
            </button>
          </div>
        </footer>
      )}

      {state.step === 'result' && state.isUnlocked && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none no-print">
           <div className="pointer-events-auto bg-[#1C1C1F] text-white p-1 flex gap-px shadow-[0_0_50px_rgba(0,0,0,0.8)] scale-125 lg:scale-100 border border-white/10">
             <button 
              onClick={() => window.print()}
              className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
             >
                Exportar PDF
             </button>
             <div className="w-px bg-white/10"></div>
             <button 
              onClick={() => window.location.reload()}
              className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
             >
                Reiniciar
             </button>
           </div>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl bg-[#0D0D0E] border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif italic text-white tracking-tight">Meus Casos</h2>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Histórico de simulações processadas</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)} 
                  className="p-2 border border-white/5 hover:bg-white/5 transition-colors"
                >
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {userHistory.length === 0 ? (
                  <div className="py-20 text-center">
                    <History className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 text-sm italic">Nenhum caso simulado encontrado sob esta credencial.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {userHistory.map((sim: any) => (
                      <button 
                        key={sim.id}
                        onClick={() => loadSimulation(sim)}
                        className="w-full text-left p-6 bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="max-w-[70%]">
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-500/60 mb-2 block">
                              {sim.createdAt?.toDate ? new Date(sim.createdAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Simulação Recente'}
                            </span>
                            <h3 className="text-lg font-serif italic text-white/90 leading-tight line-clamp-1">
                              {sim.caseSummary || sim.caseDescription}
                            </h3>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-3xl font-mono font-bold text-white tracking-tighter tabular-nums">{sim.finalSuccessProbability}%</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">Probabilidade</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-white/30 text-[9px] font-bold uppercase tracking-[0.2em]">
                          <span className="px-2 py-0.5 border border-white/10 bg-white/5">
                            {areaLabels[sim.area as LegalArea] || "Direito Geral"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-emerald-500/50" />
                            {sim.rounds?.length || 0} Etapas de Julgamento
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
