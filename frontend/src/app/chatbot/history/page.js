"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { toast } from "react-toastify";
import {
  FaHistory,
  FaRobot,
  FaTrash,
  FaComments,
  FaArrowLeft,
  FaPlus,
} from "react-icons/fa";

export default function ChatbotHistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/groq/history");
      const list = data.conversations || [];
      const sorted = list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setConversations(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation thread?")) return;
    try {
      await api.delete(`/groq/history/${convId}`);
      toast.success("Conversation deleted.");
      setConversations((prev) => prev.filter((c) => (c.id || c._id) !== convId));
    } catch (err) {
      toast.error("Failed to delete conversation.");
    }
  };

  const handleResume = (convId) => {
    router.push(`/chatbot?conversationId=${convId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-gray-800">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
            <FaHistory size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-headline">
              Chatbot Conversations History
            </h1>
            <p className="text-xs text-gray-500">
              Review and resume past AI nutrition consultations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 py-2.5 text-xs font-bold transition shadow-sm"
          >
            <FaPlus size={11} />
            <span>New Chat</span>
          </Link>
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-500 rounded-full px-4 py-2.5 text-xs font-semibold border border-gray-200 transition"
          >
            <FaArrowLeft size={11} />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Loading your conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto">
            <FaComments size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Chat History Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Start a conversation with our AI Nutritionist to get customized guidance on Pakistani dishes.
          </p>
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-6 py-2.5 shadow-sm transition"
          >
            Start First Chat
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => {
            const convId = conv.id || conv._id;
            const previewText =
              conv.preview ||
              conv.messages?.[0]?.content ||
              conv.title ||
              "Nutrition Consultation Session";
            const dateStr = conv.updatedAt || conv.createdAt
              ? new Date(conv.updatedAt || conv.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={convId}
                onClick={() => handleResume(convId)}
                className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <FaRobot size={18} />
                  </div>
                  <div className="overflow-hidden space-y-0.5">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">
                      {previewText}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {dateStr} &bull; {conv.messages?.length || 2} messages
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleResume(convId)}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 transition"
                  >
                    Resume &rarr;
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, convId)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition"
                    title="Delete Thread"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
