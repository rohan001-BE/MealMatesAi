"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-toastify";
import { marked } from "marked";
import { motion, AnimatePresence } from "framer-motion";

marked.setOptions({
  gfm: true,
  breaks: true,
});
import useAuthStore from "../../store/authStore";
import {
  FaPaperPlane,
  FaPlus,
  FaTrash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaLightbulb,
  FaFire,
  FaDumbbell,
  FaHistory,
  FaComments,
  FaTimes,
  FaCheckCircle,
  FaRegCircle,
  FaUtensils,
  FaSyncAlt,
  FaChartBar,
} from "react-icons/fa";

const samplePrompts = [
  "Replace my dinner with high-protein desi food",
  "What should I eat tonight for weight loss?",
  "Suggest healthy Pakistani snacks under 200 kcal",
  "Analyze my macros and calorie balance",
  "What is a high-protein Pakistani breakfast?",
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold pl-2 animate-pulse">
    <span className="animate-bounce">●</span>
    <span className="animate-bounce [animation-delay:0.2s]">●</span>
    <span className="animate-bounce [animation-delay:0.4s]">●</span>
    <span className="ml-1 tracking-wider uppercase text-[10px]">AI is typing...</span>
  </div>
);

export default function ChatbotPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const convParam = searchParams.get("conversationId");
  const { user, userProfile } = useAuthStore();

  const [activeConversationId, setActiveConversationId] = useState(convParam || null);
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileProgressOpen, setMobileProgressOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Real Database Progress States
  const [dashboardData, setDashboardData] = useState(null);
  const [completedMeals, setCompletedMeals] = useState({});
  const [latestPlan, setLatestPlan] = useState(null);
  const [todayProgressLoading, setTodayProgressLoading] = useState(true);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Welcome to **Meal Mates AI**! I am your personal nutritionist assistant. Ask me anything about Pakistani cuisine, daily calorie deficits, macro targets, or customized meal suggestions.",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef(null);

  // 1. Fetch Real Progress from Database (/users/dashboard)
  const fetchLiveProgress = async () => {
    try {
      setTodayProgressLoading(true);
      const { data } = await api.get("/users/dashboard");
      if (data?.success) {
        setDashboardData(data);
        if (data.latestPlan) setLatestPlan(data.latestPlan);
        if (data.completedMeals) setCompletedMeals(data.completedMeals || {});
      }
    } catch (e) {
      console.warn("Live chatbot progress fetch fallback:", e);
    } finally {
      setTodayProgressLoading(false);
    }
  };

  // Toggle meal completion directly from chatbot panel
  const toggleMealCompletion = async (mealKey, mealIndex) => {
    const newState = !completedMeals[mealKey];
    const updated = { ...completedMeals, [mealKey]: newState };
    setCompletedMeals(updated);
    try {
      await api.post("/dashboard/meal-toggle", {
        mealIndex: mealIndex,
        completed: newState,
      });
      toast.success(newState ? "Meal marked as completed!" : "Meal marked uncompleted.");
    } catch (e) {
      console.warn("Meal toggle sync fallback:", e);
    }
  };

  // Target Macros from DB (or calibrated user profile)
  const targetCalories = dashboardData?.targets?.dailyCalories || userProfile?.targetCalories || user?.dailyCalories || 2000;
  const proteinTarget = dashboardData?.targets?.targetProtein || userProfile?.protein || user?.targetProtein || 140;
  const carbsTarget = dashboardData?.targets?.targetCarbs || userProfile?.carbs || user?.targetCarbs || 220;
  const fatsTarget = dashboardData?.targets?.targetFat || userProfile?.fats || user?.targetFat || 65;

  // Real Today Meals from Database Active Plan (Day 1)
  const todayDayPlan = latestPlan?.mealPlans?.[0] || latestPlan?.days?.[0] || null;
  const todayMeals = todayDayPlan?.recipes || todayDayPlan?.meals || [];

  // Calculate actual consumed macros from marked completed meals in DB
  const { consumedCalories, proteinCurrent, carbsCurrent, fatsCurrent, completedCount } = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0, done = 0;
    todayMeals.forEach((meal, idx) => {
      const isDone = Boolean(completedMeals[`0-${idx}`] || completedMeals[idx]);
      if (isDone) {
        done += 1;
        cal += Number(meal.calories || 0);
        p += Number(meal.protein || 0);
        c += Number(meal.carbs || 0);
        f += Number(meal.fat || meal.fats || 0);
      }
    });
    return {
      consumedCalories: cal,
      proteinCurrent: Math.round(p),
      carbsCurrent: Math.round(c),
      fatsCurrent: Math.round(f),
      completedCount: done,
    };
  }, [todayMeals, completedMeals]);

  const caloriePercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const remainingProtein = Math.max(0, proteinTarget - proteinCurrent);

  // Load history list & live progress
  const fetchConversations = async () => {
    try {
      setLoadingHistory(true);
      const { data } = await api.get("/groq/history");
      const list = data?.conversations || [];
      const sorted = list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      );
      setConversations(sorted);
    } catch (err) {
      console.warn("Could not load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchConversations();
    fetchLiveProgress();
  }, []);

  // Load specific conversation if param changes
  useEffect(() => {
    if (convParam) {
      const loadConv = async () => {
        setLoading(true);
        try {
          const { data } = await api.get(`/groq/conversation/${convParam}`);
          if (data?.success && data?.conversation) {
            setMessages(
              data.conversation.messages?.length > 0
                ? data.conversation.messages
                : [
                    {
                      role: "bot",
                      content: "How can I help you adjust your nutrition or meals today?",
                    },
                  ]
            );
            setActiveConversationId(convParam);
          }
        } catch (err) {
          toast.error("Failed to load conversation.");
        } finally {
          setLoading(false);
        }
      };
      loadConv();
    }
  }, [convParam]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";

      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast.info("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening... Speak your prompt now.");
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    router.replace("/chatbot");
    setMessages([
      {
        role: "bot",
        content:
          "Welcome to **Meal Mates AI**! I am your personal nutritionist assistant. Ask me anything about Pakistani cuisine, daily calorie deficits, macro targets, or customized meal suggestions.",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
  };

  const handleSelectConversation = async (convId) => {
    if (convId === activeConversationId) return;
    setActiveConversationId(convId);
    setLoading(true);
    try {
      const { data } = await api.get(`/groq/conversation/${convId}`);
      if (data?.success && data?.conversation) {
        setMessages(data.conversation.messages || []);
      }
    } catch (err) {
      toast.error("Could not load thread.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await api.delete(`/groq/history/${convId}`);
      toast.success("Thread removed.");
      setConversations((prev) => prev.filter((c) => (c.id || c._id) !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      toast.error("Failed to delete.");
    }
  };

  const handleSendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    const userMsg = {
      role: "user",
      content: textToSend,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post("/groq/chat", {
        message: textToSend,
        conversationId: activeConversationId,
      });

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.reply,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        if (data.conversationId) {
          setActiveConversationId(data.conversationId);
          fetchConversations();
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I'm having a brief connection issue right now. Please try asking again in a moment.",
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // Group conversations
  const todayConvs = [];
  const previousConvs = [];
  const now = new Date();

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updatedAt || conv.createdAt || 0);
    const isToday =
      convDate.getDate() === now.getDate() &&
      convDate.getMonth() === now.getMonth() &&
      convDate.getFullYear() === now.getFullYear();

    if (isToday) {
      todayConvs.push(conv);
    } else {
      previousConvs.push(conv);
    }
  });

  return (
    <div className="w-full h-full flex overflow-hidden bg-white text-gray-800 antialiased font-sans select-none">
      {/* 1. LEFT SIDEBAR: Chat History (Edge to Edge, Full Height) */}
      <aside
        className={`${
          showLeftSidebar ? "w-72 sm:w-80" : "w-0 -translate-x-full"
        } hidden md:flex flex-col bg-white border-r border-orange-100/90 shadow-[4px_0_24px_rgba(31,41,55,0.02)] transition-all duration-300 flex-shrink-0 z-20 h-full overflow-hidden`}
      >
        {/* Sidebar Header & New Chat Button */}
        <div className="p-5 border-b border-orange-100/80 bg-white">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-full font-bold text-xs border border-orange-200/80 shadow-sm hover:shadow transition-all duration-200 active:scale-98"
          >
            <FaPlus size={11} />
            <span>New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-orange-100 scrollbar-track-transparent">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-xs font-semibold">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-orange-500 mr-2" />
              Loading history...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-3 space-y-2">
              <FaComments className="mx-auto text-gray-300" size={26} />
              <p className="text-xs text-gray-400 font-medium">No previous consultations yet.</p>
            </div>
          ) : (
            <>
              {todayConvs.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-2">
                    Today
                  </p>
                  <div className="space-y-1">
                    {todayConvs.map((conv) => {
                      const id = conv.id || conv._id;
                      const isActive = id === activeConversationId;
                      const title =
                        conv.preview ||
                        conv.title ||
                        conv.messages?.[0]?.content ||
                        "Nutrition Consultation";

                      return (
                        <div
                          key={id}
                          onClick={() => handleSelectConversation(id)}
                          className={`group flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/20"
                              : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          <span className="truncate flex-1 pr-2">{title}</span>
                          <button
                            onClick={(e) => handleDeleteConversation(e, id)}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity ${
                              isActive ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-red-500"
                            }`}
                            title="Delete thread"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {previousConvs.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-2">
                    Previous Sessions
                  </p>
                  <div className="space-y-1">
                    {previousConvs.map((conv) => {
                      const id = conv.id || conv._id;
                      const isActive = id === activeConversationId;
                      const title =
                        conv.preview ||
                        conv.title ||
                        conv.messages?.[0]?.content ||
                        "Consultation Session";

                      return (
                        <div
                          key={id}
                          onClick={() => handleSelectConversation(id)}
                          className={`group flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/20"
                              : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          <span className="truncate flex-1 pr-2">{title}</span>
                          <button
                            onClick={(e) => handleDeleteConversation(e, id)}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity ${
                              isActive ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-red-500"
                            }`}
                            title="Delete thread"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* 2. CENTRAL CHAT CANVAS (Edge to Edge, Full Height) */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-gradient-to-b from-[#faf5ef]/50 via-[#faf5ef]/20 to-white">
        {/* Chat Header */}
        <div className="relative z-10 py-3.5 px-6 flex items-center justify-between border-b border-orange-100/90 bg-white/95 backdrop-blur-md flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="hidden md:flex p-2 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition"
              title="Toggle History Sidebar"
            >
              <FaHistory size={15} />
            </button>

            {/* Glowing Logo Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 rounded-full blur-md opacity-60 group-hover:opacity-100 transition animate-pulse"></div>
              <img
                src="/assets/logo.png"
                alt="Meal Mates Logo"
                className="relative w-10 h-10 rounded-full object-cover shadow border border-white bg-white"
                onError={(e) => {
                  e.target.src = "/assets/full logo.png";
                }}
              />
            </div>

            <div>
              <h2 className="text-base font-black text-gray-900 font-headline flex items-center">
                AI Nutritionist
                <sup className="text-[9px] font-black text-orange-500 ml-1 uppercase">Pro</sup>
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">Your personal nutrition assistant.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setMobileHistoryOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-orange-500 bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
              title="Chat History"
              aria-label="View chat history"
            >
              <FaHistory size={13} />
            </button>
            <button
              onClick={() => setMobileProgressOpen(true)}
              className="xl:hidden p-2 rounded-xl text-gray-600 hover:text-orange-500 bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
              title="Today's Progress"
              aria-label="View today's progress"
            >
              <FaChartBar size={13} />
            </button>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs hover:from-orange-600 hover:to-amber-600 transition cursor-pointer"
              title="Start New Chat"
            >
              <FaPlus size={10} />
              <span className="hidden xs:inline">New</span>
            </button>
            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="hidden xl:flex p-2 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition cursor-pointer"
              title="Toggle Progress Panel"
            >
              <FaLightbulb size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent min-h-0">
          {/* Timestamp Badge */}
          <div className="text-center">
            <span className="text-[10px] font-bold text-gray-400 bg-orange-50 border border-orange-100/80 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              Today &bull; Active Nutrition Session
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-4xl mx-auto"
                >
                  {isUser ? (
                    /* User Message (Right Aligned) */
                    <div className="flex justify-end items-end gap-2.5 w-full">
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[72%]">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium px-4 py-2.5 rounded-2xl rounded-br-xs text-xs sm:text-sm leading-relaxed shadow-sm shadow-orange-500/15 break-words whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        {msg.createdAt && (
                          <span className="text-[10px] text-gray-400 mt-1 mr-1">
                            {msg.createdAt}
                          </span>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0 mb-4">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                      </div>
                    </div>
                  ) : (
                    /* AI Bot Message (Left Aligned) */
                    <div className="flex justify-start items-start gap-3 w-full">
                      <div className="w-8 h-8 rounded-full border border-orange-200 shadow-xs bg-white flex items-center justify-center shrink-0 mt-0.5">
                        <img
                          src="/assets/logo.png"
                          alt="AI Avatar"
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = "/assets/full logo.png";
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-start max-w-[92%] sm:max-w-[85%] w-fit">
                        <div className="bg-white text-gray-800 border border-orange-100/90 px-5 py-3.5 rounded-2xl rounded-tl-xs shadow-[0px_2px_14px_rgba(0,0,0,0.04)] ai-markdown-content overflow-x-auto w-full">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(msg.content || ""),
                            }}
                          />
                        </div>
                        {msg.createdAt && (
                          <span className="text-[10px] text-gray-400 mt-1 ml-1">
                            {msg.createdAt}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-start gap-3 w-full max-w-4xl mx-auto"
            >
              <div className="w-8 h-8 rounded-full border border-orange-200 shadow-xs bg-white flex items-center justify-center shrink-0 mt-0.5">
                <img
                  src="/assets/logo.png"
                  alt="AI Avatar"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "/assets/full logo.png";
                  }}
                />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs border border-orange-100 shadow-xs">
                <TypingIndicator />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} className="h-2" />
        </div>

        {/* 3. STICKY BOTTOM INPUT AREA (Edge to Edge, Anchored at Bottom) */}
        <div className="relative z-20 p-4 sm:p-5 bg-white border-t border-orange-100 shadow-[0px_-4px_24px_rgba(31,41,55,0.04)] flex-shrink-0">
          <div className="max-w-4xl mx-auto w-full space-y-3">
            {/* Suggestion Chips (Horizontal Scrollable) */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(null, prompt)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-400 text-[11px] font-semibold transition-all duration-200 shadow-2xs active:scale-95 whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center w-full bg-gray-50/90 rounded-2xl p-1.5 border border-orange-200/80 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 shadow-sm transition-all duration-300"
            >
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-xl transition-colors ${
                  isListening
                    ? "bg-red-50 text-red-500 animate-pulse"
                    : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                }`}
                title={isListening ? "Listening... Click to stop" : "Voice input"}
              >
                {isListening ? <FaMicrophoneSlash size={15} /> : <FaMicrophone size={15} />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your nutrition, meal calories, or desi recipes..."
                className="flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 h-10 px-2 font-medium"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-40 shrink-0 ml-1 active:scale-95"
                title="Send Message"
              >
                <FaPaperPlane size={13} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* 4. RIGHT SIDEBAR / CONTEXT PANEL: Today's Real Live Progress (Edge to Edge, Full Height) */}
      <aside
        className={`${
          showRightSidebar ? "w-[330px]" : "w-0 translate-x-full"
        } hidden xl:flex flex-col bg-white border-l border-orange-100/90 flex-shrink-0 z-20 shadow-[-4px_0_24px_rgba(31,41,55,0.02)] p-5 overflow-y-auto transition-all duration-300 h-full scrollbar-thin scrollbar-thumb-orange-100 select-none`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-900 font-headline tracking-tight">Today&apos;s Progress</h3>

          <button
            onClick={fetchLiveProgress}
            title="Refresh progress"
            className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition cursor-pointer"
          >
            <FaSyncAlt size={10} className={todayProgressLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {todayProgressLoading ? (
          <div className="space-y-4 animate-pulse pt-4">
            <div className="w-36 h-36 mx-auto rounded-full bg-gray-100" />
            <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded" />
            </div>
          </div>
        ) : (
          <>
            {/* Main Calorie Ring */}
            <div className="relative w-40 h-40 mx-auto my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="stroke-orange-100/80"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  strokeWidth="8"
                />
                <circle
                  className="stroke-orange-500 transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * caloriePercent) / 100}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-2xl font-black text-gray-900 font-headline leading-none">
                  {consumedCalories.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-gray-400 mt-1">
                  / {Math.round(targetCalories).toLocaleString()} kcal
                </span>
                <span className="text-[10px] font-black text-orange-600 uppercase mt-0.5 tracking-wider">
                  {caloriePercent}% Consumed
                </span>
              </div>
            </div>

            {/* Quick Status Tag */}
            <div className="my-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-extrabold">
                <FaCheckCircle className="text-orange-500" size={10} />
                <span>{completedCount} of {todayMeals.length || 4} meals logged today</span>
              </span>
            </div>

            {/* Macro Breakdown Bars */}
            <div className="space-y-3.5 my-4">
              {/* Protein */}
              <div>
                <div className="flex justify-between items-end mb-1 text-xs">
                  <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                    <FaDumbbell className="text-emerald-500" size={11} /> Protein
                  </span>
                  <span className="font-bold text-emerald-700 text-[11px]">
                    {proteinCurrent}g / {Math.round(proteinTarget)}g
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, proteinTarget > 0 ? (proteinCurrent / proteinTarget) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between items-end mb-1 text-xs">
                  <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                    <FaFire className="text-amber-500" size={11} /> Carbs
                  </span>
                  <span className="font-bold text-amber-700 text-[11px]">
                    {carbsCurrent}g / {Math.round(carbsTarget)}g
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, carbsTarget > 0 ? (carbsCurrent / carbsTarget) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div>
                <div className="flex justify-between items-end mb-1 text-xs">
                  <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                    <FaFire className="text-purple-500" size={11} /> Fats
                  </span>
                  <span className="font-bold text-purple-700 text-[11px]">
                    {fatsCurrent}g / {Math.round(fatsTarget)}g
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, fatsTarget > 0 ? (fatsCurrent / fatsTarget) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Today's Schedule Checklist from Real DB */}
            <div className="space-y-2 my-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <FaUtensils size={9} /> Today&apos;s Active Plan
                </span>
                <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                  Day 1
                </span>
              </div>

              <div className="space-y-2">
                {todayMeals.length > 0 ? (
                  todayMeals.map((meal, mIdx) => {
                    const mealKey = `0-${mIdx}`;
                    const isDone = Boolean(completedMeals[mealKey] || completedMeals[mIdx]);
                    const slotLabels = ["Breakfast", "Lunch", "Dinner", "Snack"];
                    const slotName = meal.assignedMealSlot || meal.mealType || slotLabels[mIdx] || "Meal";

                    return (
                      <div
                        key={mIdx}
                        onClick={() => toggleMealCompletion(mealKey, mIdx)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isDone
                            ? "bg-emerald-50/60 border-emerald-200"
                            : "bg-gray-50/80 hover:bg-orange-50/60 border-gray-200/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button className="shrink-0 text-xs">
                            {isDone ? (
                              <FaCheckCircle className="text-emerald-600" size={14} />
                            ) : (
                              <FaRegCircle className="text-gray-400 hover:text-orange-500" size={14} />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-orange-600 block tracking-wider">
                              {slotName}
                            </span>
                            <h5 className={`text-xs font-bold truncate leading-tight ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                              {meal.recipeName || meal.name}
                            </h5>
                          </div>
                        </div>

                        <span className="text-[11px] font-black text-gray-600 shrink-0">
                          {meal.calories} kcal
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-gray-500 italic p-3 bg-gray-50 rounded-xl text-center">
                    No active plan yet. Generate one in the Meal Planner!
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic AI Contextual Advice */}
            <div className="p-3.5 bg-orange-50/70 border border-orange-100 rounded-2xl mt-3">
              <div className="flex items-center gap-1.5 mb-1 text-orange-600 font-extrabold text-xs">
                <FaLightbulb size={11} />
                <span>AI Nutritionist Advice</span>
              </div>
              <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                {remainingCalories > 0
                  ? `You have ${remainingCalories} kcal and ${Math.round(remainingProtein)}g protein remaining today. Ask me for recommendations to hit your targets!`
                  : "You have reached your daily calorie goal today! Focus on hydration and restorative sleep."}
              </p>
            </div>
          </>
        )}
      </aside>

      {/* 5. Mobile History Drawer Overlay */}
      {mobileHistoryOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileHistoryOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-entrance">
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <span className="font-headline font-black text-gray-900 text-sm">Consultation History</span>
              <button
                onClick={() => setMobileHistoryOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
              >
                <FaTimes size={11} />
              </button>
            </div>
            <div className="p-3 border-b border-orange-100">
              <button
                onClick={() => {
                  handleNewChat();
                  setMobileHistoryOpen(false);
                }}
                className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <FaPlus size={10} />
                <span>Start New Session</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {conversations.map((conv) => {
                const id = conv.id || conv._id;
                const isActive = id === activeConversationId;
                const title = conv.preview || conv.title || conv.messages?.[0]?.content || "Nutrition Session";
                return (
                  <div
                    key={id}
                    onClick={() => {
                      handleSelectConversation(id);
                      setMobileHistoryOpen(false);
                    }}
                    className={`p-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      isActive ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-50"
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{title}</span>
                    <button
                      onClick={(e) => handleDeleteConversation(e, id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Mobile Today's Progress Bottom Sheet */}
      {mobileProgressOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setMobileProgressOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-y-auto z-10 animate-entrance">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-orange-100">
              <h3 className="font-headline font-black text-gray-900 text-base">Today&apos;s Progress</h3>
              <button
                onClick={() => setMobileProgressOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Main Calorie Ring */}
            <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="stroke-orange-100/80"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  strokeWidth="8"
                />
                <circle
                  className="stroke-orange-500"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * caloriePercent) / 100}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-2xl font-black text-gray-900 font-headline leading-none">
                  {consumedCalories.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1">
                  / {Math.round(targetCalories).toLocaleString()} kcal
                </span>
                <span className="text-[9px] font-black text-orange-600 uppercase mt-0.5 tracking-wider">
                  {caloriePercent}% Consumed
                </span>
              </div>
            </div>

            {/* Macro Bars */}
            <div className="space-y-3 my-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Protein</span>
                  <span>{proteinCurrent}g / {Math.round(proteinTarget)}g</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (proteinCurrent / proteinTarget) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Carbs</span>
                  <span>{carbsCurrent}g / {Math.round(carbsTarget)}g</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (carbsCurrent / carbsTarget) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Fats</span>
                  <span>{fatsCurrent}g / {Math.round(fatsTarget)}g</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (fatsCurrent / fatsTarget) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Meals Checklist */}
            <div className="space-y-2 my-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Today&apos;s Meals</span>
              {todayMeals.map((meal, mIdx) => {
                const mealKey = `0-${mIdx}`;
                const isDone = Boolean(completedMeals[mealKey] || completedMeals[mIdx]);
                const slotLabels = ["Breakfast", "Lunch", "Dinner", "Snack"];
                const slotName = meal.assignedMealSlot || meal.mealType || slotLabels[mIdx] || "Meal";
                return (
                  <div
                    key={mIdx}
                    onClick={() => toggleMealCompletion(mealKey, mIdx)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      isDone ? "bg-emerald-50/60 border-emerald-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isDone ? <FaCheckCircle className="text-emerald-600 shrink-0" size={14} /> : <FaRegCircle className="text-gray-400 shrink-0" size={14} />}
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase text-orange-600 block">{slotName}</span>
                        <h5 className={`text-xs font-bold truncate ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{meal.recipeName || meal.name}</h5>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 shrink-0">{meal.calories} kcal</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
