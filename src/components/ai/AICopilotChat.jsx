'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Sparkles, Plus, MessageSquare, Trash2,
  ChevronRight, Radio, PanelLeftClose, PanelLeft, Clock, MapPin,
  Mic, MicOff, Volume2, VolumeX, Globe, Search, ShieldAlert, CloudRain, Zap, Sun, X
} from 'lucide-react';
import useAppStore from '../../store/appStore';
import { SUGGESTION_PROMPTS, processAICopilotQuery } from '../../lib/aiCopilot';
import { searchCities, fetchForecast } from '../../lib/weatherApi';

const INITIAL_WELCOME = {
  id: 'welcome-1',
  sender: 'ai',
  text: `Hello! I am **WeatherAction AI Assistant** 🌦️. Ask me open-ended decision questions (e.g., *"Nalaki weather enna epdi erukum entha place polama?"* or *"Can I go for a run in Kuniyamuthur?"*) and I will evaluate live weather for you!`,
  timestamp: 'Just now',
};

export function AICopilotChat() {
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const location = useAppStore((s) => s.location);
  const userType = useAppStore((s) => s.userType);
  const setSelectedActivity = useAppStore((s) => s.setSelectedActivity);
  const setLocation = useAppStore((s) => s.setLocation);
  const setForecastBlocks = useAppStore((s) => s.setForecastBlocks);
  const setRiskResult = useAppStore((s) => s.setRiskResult);
  const setScreen = useAppStore((s) => s.setScreen);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setLiveMonitoring = useAppStore((s) => s.setLiveMonitoring);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState('en'); // 'en' | 'ta'

  // Voice Speech-to-Text State
  const [isListening, setIsListening] = useState(false);

  // Text-to-Speech State
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  // Map & Location Search State
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Chat sessions state (stored in state & localStorage)
  const [sessions, setSessions] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('weather_ai_sessions');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'session-default',
        title: 'New Weather Safety Chat',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        messages: [INITIAL_WELCOME],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || 'session-default');

  // Save sessions to localStorage whenever changed
  useEffect(() => {
    if (typeof window !== 'undefined' && sessions.length > 0) {
      try {
        localStorage.setItem('weather_ai_sessions', JSON.stringify(sessions));
      } catch {}
    }
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isThinking]);

  // Create New Chat Session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Weather Safety Chat',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: language === 'ta'
            ? `புதிய உரையாடல் தொடங்கப்பட்டது 🌦️. கீழே உள்ள இடத்தைத் தேர்ந்தெடுக்கவும் அல்லது கேள்விகளைக் கேட்கவும்!`
            : `Started a new conversation session 🌦️. Select a location below or ask me any weather decision question!`,
          timestamp: 'Just now',
        },
      ],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInputQuery('');
  };

  // Delete Chat Session
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }

    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }
  };

  // Send message in current active session
  const handleSend = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isThinking) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    // Update session title if first user prompt
    const updatedMessages = [...(activeSession.messages || []), userMsg];
    let newTitle = activeSession.title;
    if (activeSession.title === 'New Weather Safety Chat') {
      newTitle = query.length > 30 ? query.substring(0, 30) + '…' : query;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: newTitle, messages: updatedMessages }
          : s
      )
    );

    setInputQuery('');
    setIsThinking(true);

    try {
      const aiResponse = await processAICopilotQuery(query, forecastBlocks, { userType, location, language });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, aiResponse] }
            : s
        )
      );
    } catch (err) {
      const errResponse = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Apologies, I encountered an issue analyzing weather parameters. Please try again or rephrase your query.`,
        timestamp: 'Just now',
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errResponse] }
            : s
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  // Speech-to-Text (Voice Input 🎙️)
  const handleMicClick = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-to-Speech (Speaker 🔊)
  const handleSpeakText = (msgId, text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Google Maps Style Location Search
  const handleMapSearchChange = async (val) => {
    setMapSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      const results = await searchCities(val);
      setSearchResults(results || []);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  // Switch Target Location from Choice Picker or Search
  const handleSelectCity = async (cityName) => {
    try {
      setShowMapModal(false);
      setMapSearchQuery('');
      setSearchResults([]);
      const geoResults = await searchCities(cityName);
      if (geoResults && geoResults.length > 0) {
        const geo = geoResults[0];
        const isHill = ['ooty', 'valparai', 'kodaikanal', 'coonoor'].some((h) => cityName.toLowerCase().includes(h));
        const isCoast = ['rameswaram', 'chennai', 'cuddalore'].some((c) => cityName.toLowerCase().includes(c));
        const cityObj = {
          name: geo.name || cityName,
          lat: geo.lat,
          lon: geo.lon,
          zone: geo.state ? `${geo.name} (${geo.state})` : `${cityName} Area`,
          terrain: isHill ? 'hills' : isCoast ? 'coastal' : 'plains',
        };
        setLocation(cityObj);

        // Fetch fresh forecast for new location
        const freshForecast = await fetchForecast(cityObj.lat, cityObj.lon);
        if (freshForecast?.blocks) setForecastBlocks(freshForecast.blocks);

        // Trigger ChatGPT decision recommendation for selected location
        const promptText = language === 'ta'
          ? `${cityObj.name} நகரத்திற்கு நாளைய வானிலை, செல்ல சிறந்த இடம் மற்றும் பாதுகாப்பு நடவடிக்கைகள் என்ன?`
          : `What is tomorrow's weather forecast, best place to visit, and safe activities for ${cityObj.name}?`;

        handleSend(promptText);
      }
    } catch {}
  };

  const handleLaunchMatrix = (msg) => {
    if (!msg.card) return;
    setSelectedActivity(msg.card.activityId);
    if (msg.cityObj) setLocation(msg.cityObj);
    if (msg.forecastBlocks) setForecastBlocks(msg.forecastBlocks);
    if (msg.riskResult) setRiskResult(msg.riskResult);
    setActiveTab('planner');
    setScreen('input');
  };

  const handleLaunchMonitor = (msg) => {
    if (!msg.card) return;
    setSelectedActivity(msg.card.activityId);
    if (msg.cityObj) setLocation(msg.cityObj);
    if (msg.forecastBlocks) setForecastBlocks(msg.forecastBlocks);
    if (msg.riskResult) setRiskResult(msg.riskResult);
    setLiveMonitoring(true);
    setActiveTab('monitor');
    setScreen('live_monitoring');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col md:flex-row h-[660px] relative">
      {/* Left Sidebar: ChatGPT Style Chat History */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-slate-900 text-white flex flex-col border-r border-slate-800 flex-shrink-0 overflow-hidden"
          >
            {/* Sidebar Header + New Chat Button */}
            <div className="p-4 space-y-3 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-black">
                    AI
                  </div>
                  <span className="font-extrabold text-sm text-white tracking-tight">Chat History</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors md:hidden"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              {/* + New Chat CTA */}
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md transition-all group"
                id="btn-new-chat"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>New AI Chat Session</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Recent Conversations
              </div>

              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare size={14} className={isActive ? 'text-sky-400' : 'text-slate-500'} />
                      <span className="truncate">{sess.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center flex-shrink-0">
              <span>Sessions: {sessions.length}</span>
              <span className="text-sky-400 font-semibold">WeatherGPT Engine</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Workspace Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-4 px-6 text-white flex items-center justify-between border-b border-sky-500/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Toggle Chat History Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>

            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md text-white font-bold">
              <Sparkles size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">WeatherGPT AI Assistant</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
                {activeSession?.title || 'New Weather Safety Chat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20"
              title="Switch Language (English / தமிழ்)"
            >
              <Globe size={14} className="text-sky-300" />
              <span>{language === 'en' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {/* Google Maps Search Modal Trigger */}
            <button
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Find Places</span>
            </button>
          </div>
        </div>

        {/* Risk Detection Alerts Bar (Matching Flow Diagram) */}
        <div className="bg-slate-950 text-white px-4 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold overflow-x-auto scrollbar-hide flex-shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px]">
            <ShieldAlert size={13} className="text-amber-400" />
            <span>Risk Detection:</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-500/30">
              <CloudRain size={12} /> Rain/Flood: Low
            </span>
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <Zap size={12} /> Storm/Wind: Mild
            </span>
            <span className="flex items-center gap-1 text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              <Sun size={12} /> Heat: Moderate
            </span>
          </div>
        </div>

        {/* Location Choice Bar with Live Searchable Input */}
        <div className="bg-slate-900/90 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-3 text-xs overflow-x-auto scrollbar-hide flex-shrink-0 relative">
          <div className="flex items-center gap-2 flex-shrink-0 flex-1 max-w-sm">
            <MapPin size={14} className="text-sky-400 animate-pulse flex-shrink-0" />
            <span className="font-extrabold text-slate-300 flex-shrink-0">Target Location:</span>

            {/* Inline Searchable Location Input */}
            <div className="relative flex-1">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 focus-within:border-sky-400 rounded-xl px-3 py-1.5 transition-all">
                <Search size={13} className="text-sky-400 flex-shrink-0" />
                <input
                  type="text"
                  value={mapSearchQuery || location?.name || 'Coimbatore'}
                  onChange={(e) => handleMapSearchChange(e.target.value)}
                  onFocus={() => {
                    if (mapSearchQuery.length >= 2) searchCities(mapSearchQuery).then(setSearchResults);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mapSearchQuery.trim()) {
                      handleSelectCity(mapSearchQuery.trim());
                    }
                  }}
                  placeholder="Type any city / location (e.g. Kuniyamuthur)..."
                  className="bg-transparent text-white text-xs font-bold w-full focus:outline-none placeholder:text-slate-500"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                  {isSearching && (
                    <div className="p-3 text-[11px] text-slate-400 font-bold">Searching locations...</div>
                  )}
                  {searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCity(res.name)}
                      className="px-3.5 py-2.5 hover:bg-sky-500/20 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-between cursor-pointer border-b border-slate-800/60 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-sky-400" />
                        <span>{res.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({res.state || 'IN'})</span>
                      </div>
                      <span className="text-[10px] text-sky-400 font-black uppercase">Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider hidden md:inline">Quick Choice:</span>
            {['Coimbatore', 'Kuniyamuthur', 'Ooty', 'Valparai', 'Madurai'].map((cityName) => (
              <button
                key={cityName}
                onClick={() => handleSelectCity(cityName)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  location?.name?.toLowerCase() === cityName.toLowerCase()
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {activeSession?.messages?.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm flex-shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-sky-500 text-white'
                    : 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Bubble */}
              <div className="space-y-3 flex-1 min-w-0">
                <div
                  className={`p-4 rounded-3xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-500 text-white rounded-tr-xs font-medium shadow-md shadow-sky-500/10'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-70">
                    <span className="font-bold">{msg.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleSpeakText(msg.id, msg.text)}
                          className={`p-1 rounded-md transition-colors ${
                            speakingMsgId === msg.id ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Read out text (Voice output 🔊)"
                        >
                          {speakingMsgId === msg.id ? <VolumeX size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>

                {/* Rich Decision Card embedded in AI message */}
                {msg.card && (
                  <motion.div
                    className="rounded-3xl p-5 border space-y-4 shadow-sm"
                    style={{
                      backgroundColor: `${msg.card.display.color}08`,
                      borderColor: `${msg.card.display.color}30`,
                    }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-white shadow-2xs border border-slate-100">
                          {msg.card.activityIcon}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-500">{msg.card.city} ({msg.card.zone})</div>
                          <h4 className="font-extrabold text-slate-900 text-base">{msg.card.activityName}</h4>
                        </div>
                      </div>

                      <div
                        className="px-4 py-1.5 rounded-full font-black text-sm text-white shadow-sm"
                        style={{ backgroundColor: msg.card.display.color }}
                      >
                        {msg.card.display.label} ({msg.card.score}/100)
                      </div>
                    </div>

                    {/* Weather vector pills */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60 font-bold text-slate-800">
                        🌧️ Rain: <span className="text-sky-600">{msg.card.rain}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60 font-bold text-slate-800">
                        💨 Wind: <span className="text-sky-600">{msg.card.wind}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60 font-bold text-slate-800">
                        💧 Hum: <span className="text-sky-600">{msg.card.humidity}</span>
                      </div>
                    </div>

                    {msg.card.optimalWindow && (
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                        <span>⏱️ Optimal Start Window:</span>
                        <span>{msg.card.optimalWindow}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        onClick={() => handleLaunchMatrix(msg)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-sky-500 text-white text-xs font-extrabold shadow-sm hover:bg-sky-400 transition-colors"
                      >
                        <span>📋 Open Full Safety Matrix</span>
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => handleLaunchMonitor(msg)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-extrabold shadow-sm hover:bg-slate-800 transition-colors"
                      >
                        <Radio size={14} className="text-emerald-400" />
                        <span>Live Radar</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Thinking State Indicator */}
          {isThinking && (
            <motion.div
              className="flex gap-3 items-center text-slate-500 text-xs font-bold bg-white p-3.5 rounded-2xl border border-slate-200/80 w-fit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Bot size={16} className="text-indigo-600 animate-bounce" />
              <span>Analyzing micro-zones & generating WeatherGPT decision…</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/60 overflow-x-auto scrollbar-hide flex gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap self-center mr-1">
            <Sparkles size={12} className="text-sky-500" /> Suggestions:
          </span>
          {SUGGESTION_PROMPTS.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSend(item.text)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:border-sky-400 hover:text-sky-600 transition-all whitespace-nowrap shadow-2xs"
            >
              <span>{item.icon}</span> <span className="ml-1">{item.text}</span>
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Mic & Send Buttons */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 flex items-center gap-2 flex-shrink-0">
          {/* Voice Microphone Input Button */}
          <button
            onClick={handleMicClick}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={isListening ? 'Listening...' : 'Voice Input (Speak question 🎙️)'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : language === 'ta'
                ? 'வானிலை கேள்விகளைக் கேட்கவும் (எ.கா. நாளைய வானிலை எப்படி இருக்கும்?)...'
                : "Ask AI Assistant about any outdoor plan or location..."
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isThinking}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all shadow-md ${
              inputQuery.trim() && !isThinking
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Google Maps Style Location Finder Modal */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs z-50 p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500 text-white font-bold">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Google Maps Location Explorer</h3>
                    <p className="text-xs text-slate-500">Search any place or micro-zone in India</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Autocomplete Search Input */}
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => handleMapSearchChange(e.target.value)}
                  placeholder="Type city or place name (e.g. Kuniyamuthur, Pollachi, Ooty, Chennai)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  autoFocus
                />
              </div>

              {/* Autocomplete Search Results */}
              {isSearching && (
                <div className="text-center py-4 text-xs font-bold text-slate-400">
                  Searching OpenWeather geocoding API...
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border-t pt-2">
                  {searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCity(res.name)}
                      className="p-2.5 rounded-xl hover:bg-sky-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-sky-200 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-sky-500" />
                        <span className="font-bold text-slate-800">{res.name}</span>
                        <span className="text-[11px] text-slate-500">({res.state || 'India'})</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md">
                        Select Place
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Safe Nearby Places Recommendations (From Diagram) */}
              <div className="pt-2 space-y-2 border-t">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldAlert size={12} className="text-emerald-500" /> Recommended Safe Nearby Zones:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { name: 'Ooty', desc: 'Pleasant 19°C • Hills', safe: true },
                    { name: 'Coimbatore', desc: '27°C • Plain Basin', safe: true },
                    { name: 'Kuniyamuthur', desc: '26°C • Clear Sky', safe: true },
                    { name: 'Rameswaram', desc: '29°C • Calm Seas', safe: true },
                  ].map((place) => (
                    <button
                      key={place.name}
                      onClick={() => handleSelectCity(place.name)}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-sky-400 hover:bg-sky-50/50 transition-all group"
                    >
                      <div className="font-bold text-slate-800 group-hover:text-sky-600 flex justify-between">
                        <span>{place.name}</span>
                        <span className="text-emerald-600 text-[10px]">SAFE</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{place.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

