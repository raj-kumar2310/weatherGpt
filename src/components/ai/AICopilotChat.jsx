'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Sparkles, Plus, MessageSquare, Trash2,
  ChevronRight, Radio, PanelLeftClose, PanelLeft, Clock, MapPin
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
          text: `Started a new conversation session 🌦️. Select a location below or ask me any weather decision question!`,
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
      const aiResponse = await processAICopilotQuery(query, forecastBlocks, { userType, location });
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

  // Switch Target Location from Choice Picker
  const handleSelectCity = async (cityName) => {
    try {
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
        handleSend(`What is tomorrow's weather forecast, best place to visit, and safe activities for ${cityObj.name}?`);
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
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col md:flex-row h-[640px]">
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
              <span className="text-sky-400 font-semibold">Tamil Nadu Micro-zones</span>
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
                <h3 className="font-extrabold text-base tracking-tight">WeatherAction AI Assistant</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
                {activeSession?.title || 'New Weather Safety Chat'}
              </p>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Location Choice Selector Bar */}
        <div className="bg-slate-900/90 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-3 text-xs overflow-x-auto scrollbar-hide flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <MapPin size={14} className="text-sky-400 animate-pulse" />
            <span className="font-extrabold text-slate-300">Target Location:</span>
            <select
              value={location?.name || 'Coimbatore'}
              onChange={(e) => handleSelectCity(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 font-bold px-3 py-1 rounded-xl text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="Coimbatore">🏙️ Coimbatore (Basin)</option>
              <option value="Kuniyamuthur">🏡 Kuniyamuthur (Coimbatore South)</option>
              <option value="Ooty">🏔️ Ooty (Nilgiris Belt)</option>
              <option value="Valparai">🌿 Valparai (Anamalai Range)</option>
              <option value="Chennai">🏖️ Chennai (Coastal)</option>
              <option value="Madurai">🏛️ Madurai (Vaigai Basin)</option>
              <option value="Trichy">🌾 Trichy (Kaveri Delta)</option>
              <option value="Salem">⛰️ Salem (Plateau)</option>
              <option value="Kodaikanal">🌲 Kodaikanal (Palani Hills)</option>
              <option value="Rameswaram">🎣 Rameswaram (Coastal)</option>
              <option value="Thanjavur">🚜 Thanjavur (Delta)</option>
              <option value="Pollachi">🌴 Pollachi (Foothills)</option>
            </select>
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
                    <span>{msg.timestamp}</span>
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
              <span>Analyzing Tamil Nadu micro-zones & generating safety evaluation…</span>
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

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 flex items-center gap-3 flex-shrink-0">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant about any outdoor plan (e.g., 'Can I cycle to Ooty tomorrow at 7 AM?')..."
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
    </div>
  );
}
