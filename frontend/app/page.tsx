"use client";
import { useState, useEffect, useRef } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase"; 
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  ShieldCheck, Sparkles, Plus, Trash2, ArrowLeft, TrendingUp, 
  PieChart as PieIcon, CheckCircle2, AlertTriangle, FileText, 
  Upload, FileSpreadsheet, Newspaper, Send, CornerDownLeft
} from 'lucide-react';

interface ChatMessage {
  id: string;
  query: string;
  aiData: any;
  timestamp: string;
}

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<"welcome" | "input" | "analytics" | "query_response">("welcome");
  
  const [userId, setUserId] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [holdings, setHoldings] = useState([
    { symbol: "RELIANCE", sector: "Energy", quantity: "20", average_price: "2400" },
    { symbol: "INFY", sector: "Technology", quantity: "50", average_price: "1450" }
  ]);
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentView === "query_response") {
      scrollToBottom();
    }
  }, [chatHistory, currentView]);

  const addHoldingRow = () => setHoldings([...holdings, { symbol: "", sector: "", quantity: "", average_price: "" }]);
  const removeHoldingRow = (index: number) => setHoldings(holdings.filter((_, i) => i !== index));
  const updateHolding = (index: number, field: string, value: string) => {
    const newHoldings = [...holdings];
    newHoldings[index] = { ...newHoldings[index], [field]: value };
    setHoldings(newHoldings);
  };

  // CSV Parsing Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        
        const firstRow = rows[0].toLowerCase();
        const hasHeader = firstRow.includes('symbol') || firstRow.includes('ticker');
        const dataRows = hasHeader ? rows.slice(1) : rows;

        const parsedHoldings = dataRows.map(row => {
          const cols = row.split(',').map(c => c.trim());
          return {
            symbol: cols[0] || "",
            sector: cols[1] || "General",
            quantity: cols[2] || "0",
            average_price: cols[3] || "0"
          };
        }).filter(h => h.symbol !== ""); 

        if (parsedHoldings.length > 0) {
          setHoldings(parsedHoldings);
          setErrorMsg("");
        } else {
          setErrorMsg("Could not parse any valid stock symbols from the CSV.");
        }
      } catch (err) {
        setErrorMsg("Error reading CSV file. Ensure it is a standard comma-separated file.");
      }
    };
    reader.readAsText(file);
  };

  const fetchInsights = async (isNewPortfolio: boolean = false, uidOverride?: string, customQuery?: string) => {
    const activeUserId = uidOverride || userId;
    const currentUser = auth.currentUser;
    const queryToSend = customQuery !== undefined ? customQuery : userQuery;

    if (!currentUser) {
      setErrorMsg("Secure session expired. Please sign in again.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    
    const formattedHoldings = isNewPortfolio 
      ? holdings.map(h => ({
          symbol: h.symbol.toUpperCase().trim(),
          sector: h.sector.trim() || "General",
          quantity: parseFloat(h.quantity) || 0,
          average_price: parseFloat(h.average_price) || 0
        })).filter(h => h.symbol && h.quantity > 0)
      : null;

    try {
      const idToken = await currentUser.getIdToken(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const response = await fetch(`${backendUrl}/api/portfolio-analysis`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}` 
        },
        body: JSON.stringify({ 
          user_id: activeUserId, 
          query: queryToSend,
          custom_holdings: formattedHoldings,
          save_for_future: saveForFuture
        }),
      });

      const data = await response.json();
      
      if (response.status === 401) {
         setErrorMsg("Authentication Failed: Invalid Firebase Token.");
         setLoading(false);
         return;
      }

      if (data.error) {
        if (data.error.includes("No portfolio found")) {
           setCurrentView("input");
        } else {
           setErrorMsg(data.error);
        }
        setLoading(false);
        return;
      }

      setAnalyticsData(data.analytics_metrics);
      setAiData(data.ai_intelligence_card);

      if (queryToSend.trim() !== "") {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          query: queryToSend,
          aiData: data.ai_intelligence_card,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, newMessage]);
        setUserQuery("");
        setCurrentView("query_response");
      } else {
        setCurrentView("analytics");
      }
      
    } catch (error) {
      setErrorMsg("Unable to connect to backend server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchInsights(false, user.uid);
      } else {
        setUserId("");
        setCurrentView("welcome");
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const result = await signInWithPopup(auth, googleProvider);
      setUserId(result.user.uid);
      await fetchInsights(false, result.user.uid);
    } catch (error: any) {
      console.error(error);
      setErrorMsg("Failed to sign in. " + error.message);
      setLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium tracking-wide">Restoring secure session...</p>
      </div>
    );
  }

  // --- SCREEN 1: WELCOME SCREEN ---
  if (currentView === "welcome") {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.95)), url('https://i.pinimg.com/736x/79/68/74/7968740973b0b6dd1b4668fdae827ad7.jpg')` }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 mb-2">
              <Sparkles size={28} />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">
              Zerodha AI Platform
            </h1>
            <p className="text-slate-400 text-sm">PowerBI Financial Intelligence & Forecasting</p>
          </div>
          <div className="space-y-4 pt-4">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-400"/> Secure Authentication
              </label>
              
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? "Accessing Terminal..." : "Continue with Google"}
              </button>
            </div>
          </div>
          {errorMsg && <p className="text-red-400 text-xs text-center font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{errorMsg}</p>}
        </div>
      </div>
    );
  }

  // --- SCREEN 2: PORTFOLIO CREATION (WITH CSV) ---
  if (currentView === "input") {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative p-6 md:p-12 overflow-x-hidden bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.98)), url('https://i.pinimg.com/736x/79/68/74/7968740973b0b6dd1b4668fdae827ad7.jpg')` }}>
        <div className="absolute top-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Create Portfolio Profile</h2>
              <p className="text-slate-400 text-sm">Define your initial market holdings for {auth.currentUser?.email}</p>
            </div>
            <button onClick={() => { setErrorMsg(""); setCurrentView("welcome"); auth.signOut(); }} className="text-slate-300 hover:text-white flex items-center gap-1 text-sm bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-lg backdrop-blur-md">
              <ArrowLeft size={16}/> Sign Out
            </button>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
            
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-teal-400"/> Bulk Import (CSV)
                </label>
                <a href="data:text/csv;charset=utf-8,Symbol,Sector,Quantity,Average_Price%0ARELIANCE,Energy,20,2400%0AINFY,Technology,50,1450" download="template.csv" className="text-xs text-blue-400 hover:text-blue-300 underline font-medium">Download Template</a>
              </div>
              <div className="relative">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex items-center justify-center gap-3 bg-slate-900/80 border border-dashed border-slate-600 rounded-xl py-5 hover:border-teal-500 transition-colors">
                  <Upload size={22} className="text-slate-400" />
                  <span className="text-sm text-slate-300 font-medium">Click or drag here to upload CSV file</span>
                </div>
              </div>
            </div>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-wider">or Manual Entry</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <div className="space-y-4">
              {holdings.map((h, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center bg-slate-950/60 p-3 rounded-xl border border-slate-700/50">
                  <input type="text" placeholder="Symbol" value={h.symbol} onChange={(e) => updateHolding(i, "symbol", e.target.value)} className="col-span-3 bg-slate-900/80 border border-slate-700 p-2 rounded-lg text-sm text-white placeholder-slate-500" />
                  <input type="text" placeholder="Sector" value={h.sector} onChange={(e) => updateHolding(i, "sector", e.target.value)} className="col-span-3 bg-slate-900/80 border border-slate-700 p-2 rounded-lg text-sm text-white placeholder-slate-500" />
                  <input type="number" placeholder="Qty" value={h.quantity} onChange={(e) => updateHolding(i, "quantity", e.target.value)} className="col-span-2 bg-slate-900/80 border border-slate-700 p-2 rounded-lg text-sm text-white placeholder-slate-500" />
                  <input type="number" placeholder="Buy Price ₹" value={h.average_price} onChange={(e) => updateHolding(i, "average_price", e.target.value)} className="col-span-3 bg-slate-900/80 border border-slate-700 p-2 rounded-lg text-sm text-white placeholder-slate-500" />
                  <button onClick={() => removeHoldingRow(i)} className="col-span-1 text-slate-500 hover:text-red-400 flex justify-center"><Trash2 size={18}/></button>
                </div>
              ))}
              <button onClick={addHoldingRow} className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 pt-1">
                <Plus size={16}/> Add Another Holding
              </button>
            </div>
            
            {errorMsg && <p className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center mt-6">{errorMsg}</p>}
            
            <button onClick={() => { setUserQuery(""); fetchInsights(true); }} disabled={loading} className="w-full mt-6 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-teal-500/20 disabled:opacity-50 border border-teal-400/30">
              {loading ? "Running Financial Analytics..." : "Generate PowerBI Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract variables with fallbacks
  const { summary, sector_data, historical_chart = [], predictive_chart, live_news = [], automated_alerts = [] } = analyticsData || {};

  // --- SCREEN 3: CONTINUOUS GEMINI AI CHAT & REPORT VIEW ---
  if (currentView === "query_response") {
    return (
      <div className="min-h-screen text-slate-100 p-4 md:p-8 space-y-6 font-sans bg-cover bg-center bg-fixed flex flex-col justify-between" style={{ backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.88), rgba(2, 6, 23, 0.96)), url('https://i.pinimg.com/736x/79/68/74/7968740973b0b6dd1b4668fdae827ad7.jpg')` }}>
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between bg-slate-900/70 backdrop-blur-xl p-4 md:p-5 rounded-2xl border border-slate-700/50 shadow-xl sticky top-4 z-20">
          <button onClick={() => { setUserQuery(""); setCurrentView("analytics"); }} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-semibold bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 transition backdrop-blur-md">
            <ArrowLeft size={16}/> Back to Main Terminal
          </button>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest hidden sm:inline">Zerodha Gemini Assistant</span>
            <span className="font-mono text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">{auth.currentUser?.email}</span>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="space-y-8 flex-1 max-w-6xl w-full mx-auto pb-24">
          {chatHistory.map((item, idx) => (
            <div key={item.id || idx} className="space-y-6 animate-fadeIn">
              
              {/* User Query Bubble */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-5 rounded-2xl rounded-tr-none shadow-lg max-w-2xl border border-blue-400/30">
                  <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1 flex items-center justify-between gap-4">
                    <span>Your Query</span>
                    <span className="text-[10px] opacity-75">{item.timestamp}</span>
                  </p>
                  <p className="text-base md:text-lg font-semibold">{item.query}</p>
                </div>
              </div>

              {/* AI Report Card / Response */}
              <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-10 rounded-2xl border border-slate-700/60 shadow-2xl space-y-8">
                {item.aiData?.type === "detailed" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                      <section>
                        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-2"><Sparkles size={20}/> Executive Summary</h3>
                        <p className="text-slate-200 leading-relaxed text-sm md:text-base font-medium">{item.aiData.executive_summary}</p>
                      </section>
                      
                      <section>
                        <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2 mb-3"><AlertTriangle size={20}/> Key Findings & Anomalies</h3>
                        <div className="space-y-3">
                          {item.aiData.key_findings?.map((point: string, pIdx: number) => (
                            <div key={pIdx} className="flex items-start gap-3 bg-rose-950/40 p-4 rounded-xl border-l-4 border-l-rose-500 border-y border-r border-rose-900/50 shadow-md">
                              <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18}/>
                              <p className="text-slate-200 text-sm leading-relaxed">{point}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle2 size={20}/> Strategic Recommendations</h3>
                        <div className="space-y-3">
                          {item.aiData.recommendations?.map((point: string, rIdx: number) => (
                            <div key={rIdx} className="flex items-start gap-3 bg-emerald-950/40 p-4 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-emerald-900/50 shadow-md">
                              <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18}/>
                              <p className="text-slate-200 text-sm leading-relaxed">{point}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-slate-950/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Predictive Trajectory Simulation</h3>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={predictive_chart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                              <XAxis dataKey="month" stroke="#94A3B8" tick={{fontSize: 11}}/>
                              <YAxis stroke="#94A3B8" tick={{fontSize: 11}} domain={['auto', 'auto']}/>
                              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}/>
                              <Line type="monotone" dataKey="baseline" stroke="#F59E0B" strokeWidth={3} dot={false} name="Baseline" />
                              <Line type="monotone" dataKey="optimistic" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Optimistic" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="bg-blue-500/10 p-3 rounded-full border border-blue-500/20 mb-4">
                      <Sparkles size={28} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Standard AI Insight</h3>
                    <p className="text-base text-slate-300 leading-relaxed max-w-2xl">{item.aiData?.insight}</p>
                  </div>
                )}
              </div>

            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-700/40 w-fit backdrop-blur-md animate-pulse">
              <Sparkles size={18} className="text-teal-400 animate-spin" />
              <span className="text-sm text-slate-300 font-medium">Gemini is synthesizing quantitative intelligence...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Floating Interactive Input Bar (Chatbot Style) */}
        <div className="fixed bottom-4 left-0 right-0 max-w-4xl mx-auto px-4 z-30">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (userQuery.trim() && !loading) {
                fetchInsights(false, undefined, userQuery);
              }
            }}
            className="bg-slate-900/90 backdrop-blur-xl p-2 md:p-3 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-2 ring-1 ring-white/10"
          >
            <input 
              type="text" 
              placeholder="Ask a follow-up (e.g. 'what are my risks?', 'how to optimize sector weights?')..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !userQuery.trim()} 
              className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-40 shadow-lg"
            >
              {loading ? <Sparkles size={16} className="animate-spin" /> : <><Send size={15}/> <span>Send</span></>}
            </button>
          </form>
        </div>

      </div>
    );
  }

  // --- SCREEN 4: STANDARD DASHBOARD ---
  return (
    <div className="min-h-screen text-slate-100 p-6 md:p-10 space-y-6 bg-cover bg-center bg-fixed" style={{ backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.85), rgba(2, 6, 23, 0.95)), url('https://i.pinimg.com/736x/79/68/74/7968740973b0b6dd1b4668fdae827ad7.jpg')` }}>
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">PowerBI Analytics Terminal</h1>
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/30 font-semibold backdrop-blur-sm">Live Feed</span>
          </div>
          <p className="text-slate-300 text-xs mt-1">Authenticated as: <span className="text-white font-mono">{auth.currentUser?.email}</span></p>
        </div>
        <button onClick={() => { setCurrentView("welcome"); auth.signOut(); }} className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-600 transition backdrop-blur-md">
          Sign Out
        </button>
      </div>

      {/* Automated Alert Banner */}
      {automated_alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {automated_alerts.map((alert: any, index: number) => (
            <div 
              key={index} 
              className={`flex items-center p-4 rounded-xl border shadow-md backdrop-blur-md ${
                alert.type === 'danger' 
                  ? 'bg-red-950/40 border-red-500/50 text-red-200' 
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              }`}
            >
              {alert.type === 'danger' ? (
                <AlertTriangle className="w-5 h-5 mr-3 text-red-400 shrink-0" />
              ) : (
                <TrendingUp className="w-5 h-5 mr-3 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium tracking-wide text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Query Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-lg flex gap-3">
        <input 
          type="text" 
          placeholder="Enter prompt for risk breakdown, projections, or anomalies..." 
          className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 backdrop-blur-sm" 
          value={userQuery} 
          onChange={(e) => setUserQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && userQuery.trim() && !loading) {
              fetchInsights(false, undefined, userQuery);
            }
          }}
        />
        <button onClick={() => fetchInsights(false, undefined, userQuery)} disabled={loading || !userQuery.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap border border-blue-500 shadow-lg disabled:opacity-50">
          {loading ? "Processing..." : <><Sparkles size={16}/> Execute Deep Analysis</>}
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-lg">
          <p className="text-slate-300 text-xs font-medium">Current Market Value</p>
          <p className="text-2xl font-black text-white mt-1">₹{summary?.total_current_value?.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-lg">
          <p className="text-slate-300 text-xs font-medium">Total Invested Cost</p>
          <p className="text-2xl font-black text-slate-200 mt-1">₹{summary?.total_invested_value?.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-lg">
          <p className="text-slate-300 text-xs font-medium">Unrealized P&L</p>
          <p className={`text-2xl font-black mt-1 ${summary?.total_unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{summary?.total_unrealized_pnl?.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-lg">
          <p className="text-slate-300 text-xs font-medium">Total Return Rate</p>
          <p className={`text-2xl font-black mt-1 ${summary?.return_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{summary?.return_percentage?.toFixed(2)}%</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><TrendingUp size={18} className="text-blue-400"/> Chart 1: 30-Day Portfolio Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historical_chart}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                <XAxis 
                  dataKey="date" 
                  stroke="#94A3B8" 
                  tick={{fontSize: 11}}
                  tickFormatter={(str) => {
                    if (!str) return '';
                    const date = new Date(str);
                    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                  }}
                />
                <YAxis stroke="#94A3B8" tick={{fontSize: 11}} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} domain={['auto', 'auto']}/>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}/>
                <Area type="monotone" dataKey="portfolio_value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" name="Market Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><PieIcon size={18} className="text-teal-400"/> Chart 2: Sector Concentration</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sector_data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}>
                  {sector_data?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}/>
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px', color: '#F8FAFC'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live News Feed Section */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-lg">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-6"><Newspaper size={18} className="text-purple-400"/> Live Market Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {live_news.length > 0 ? (
            live_news.map((news: any, index: number) => (
              <a 
                key={index} 
                href={news.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-slate-950/50 hover:bg-slate-800/80 transition-colors rounded-xl border border-slate-700/50 group h-full shadow-inner"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold px-2 py-1 bg-blue-900/40 text-blue-300 rounded border border-blue-700/30 uppercase tracking-wider">
                    {news.symbol}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide truncate max-w-[50%] text-right">{news.publisher}</span>
                </div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-3 leading-snug">
                  {news.title}
                </p>
              </a>
            ))
          ) : (
            <p className="text-sm text-slate-500 col-span-full">No recent market news available for your currently tracked holdings.</p>
          )}
        </div>
      </div>

    </div>
  );
}