"use client";
import { useState, useEffect, useRef } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  where
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ClipboardDocumentIcon, CheckIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { MessageSquarePlus, Send, Sparkles, Trash, Trash2, X, XCircle } from "lucide-react";

function Chatroom({ workspaceId, setIsChatOpen }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const userId = auth.currentUser.uid;
  const name = auth.currentUser.displayName;

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.workspaceId === workspaceId);

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, newMessage, isAIProcessing]);

  const generateAIResponse = async (prompt) => {
    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });
  
      if (!response.ok) {
        throw new Error('API request failed');
      }
  
      const data = await response.json();
      console.log("ai response data" ,data.aiResponse);
      return data.aiResponse;
    } catch (error) {
      console.error("API Error:", error);
      return "Sorry, I couldn't process that request. Please try again.";
    } finally {
      setIsAIProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const imageUrl = auth.currentUser.photoURL;
    const aiMatch = newMessage.match(/@(.+)/);
    let aiPrompt = null;
    let userMessage = newMessage;

    if (aiMatch) {
      aiPrompt = aiMatch[1].trim();
    }

    console.log("AI Prompt:", aiPrompt);
    console.log("User Message:", userMessage);
    try {
      if (userMessage) {
        const messageRef = await addDoc(messagesRef, {
          text: userMessage,
          createdAt: serverTimestamp(),
          imageUrl,
          userId,
          name,
          workspaceId,
        });
      }

      console.log(messagesRef,"ewfweewf");

      if (aiPrompt) {
        const aiResponse = await generateAIResponse(aiPrompt);
        await addDoc(messagesRef, {
          text: `🤖 ${aiResponse}`,
          createdAt: serverTimestamp(),
          imageUrl: "/ai-avatar.png",
          userId: "AI_BOT",
          name: "CodeBot",
          workspaceId,
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const clearChat = async () => {
    try {
      const querySnapshot = await getDocs(
        query(messagesRef, where("workspaceId", "==", workspaceId))
      );
      
      const deletePromises = querySnapshot.docs.map((docItem) => deleteDoc(doc(messagesRef, docItem.id)));
      await Promise.all(deletePromises);
      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ msg }) => {
    const isCurrentUser = msg.userId === userId;
    const isAI = msg.userId === "AI_BOT";
    const [copiedCode, setCopiedCode] = useState(null);

    const parseMessage = (text) => {
      const parts = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        const [fullMatch, lang, code] = match;
        const startIndex = match.index;
        const endIndex = codeBlockRegex.lastIndex;

        if (startIndex > lastIndex) {
          parts.push({
            type: 'text',
            content: text.substring(lastIndex, startIndex)
          });
        }

        parts.push({
          type: 'code',
          lang: lang || 'text',
          code: code.trim()
        });

        lastIndex = endIndex;
      }

      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex)
        });
      }

      return parts;
    };

    const copyToClipboard = async (code, index) => {
      await navigator.clipboard.writeText(code);
      setCopiedCode(index);
      setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
      <div className={`flex flex-col gap-1  ${
        isCurrentUser ? "items-end" : 
        isAI ? "items-center w-full" : "items-start"
      }`}>
        {!isAI && (
          <span className="text-xs text-gray-400">
            {isCurrentUser ? "You" : msg.name}
          </span>
        )}
        
        <div className="flex justify-end gap-2">
          {!isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl || "/robotic.png"}
              alt="Avatar"
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
          )}

          <div className={`py-2 px-4 text-sm rounded-2xl mx-auto max-w-[550px] break-words ${
            isAI ? "bg-green-900/20 border ring-1 ring-green-400" :
            isCurrentUser ? "bg-purple-600/60" : "bg-blue-600/60 "
          }`}>
            {isAI && <span className="text-blue-400 mr-2">⚡</span>}
            
            {parseMessage(msg.text).map((part, index) => {
              if (part.type === 'text') {
                return (
                  <span key={index} className="whitespace-pre-wrap">
                    {part.content}
                  </span>
                );
              }
              
              if (part.type === 'code') {
                return (
                  <div key={index} className="relative my-2 group">
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(part.code, index)}
                        className="p-1 rounded bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm"
                      >
                        {copiedCode === index ? (
                          <CheckIcon className="h-4 w-4 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={part.lang}
                      style={vscDarkPlus}
                      customStyle={{
                        background: '#000',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        margin: '0.5rem 0'
                      }}
                      codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
                    >
                      {part.code}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              
              return null;
            })}

            {isAI && (
              <div className="text-xs text-green-200/70 mt-1">
                AI-generated response
              </div>
            )}
          </div>

          {isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl || "/robotic.png"}
              alt="Avatar"
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full backdrop-blur-sm border border-gray-500 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
      {/* Header with glass effect */}
      <div className="flex justify-between items-center p-4 bg-gray-950/60 backdrop-blur-xl border-b-2 border-gray-600 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-900/20 rounded-lg border border-indigo-200/20">
            <Sparkles className="h-6 w-6 text-indigo-200" />
          </div>
          <h2 className="text-xl font-semibold shadow-2xl text-gray-100">
            Collaborative AI Chat
            <span className="text-indigo-400/90 text-sm font-normal ml-2">v1.2</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={clearChat}
            className="px-3 py-2 text-sm bg-gray-700/50 hover:bg-gray-600/60 text-gray-300 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
          >
            <Trash className="h-4 w-4 text-red-500" />
            <span>Clear</span>
          </Button>
          <Button
            onClick={() => setIsChatOpen(false)}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/60 text-white rounded-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/60 ">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm animate-fade-in">
            <div className="mb-4 animate-float">
              <MessageSquarePlus className="h-8 w-8 opacity-60" />
            </div>
            <p>Start a conversation with AI</p>
            <p className="text-sm mt-1 text-gray-500/70">Type @ followed by your query</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              msg={msg}
              className="animate-message-enter"
            />
          ))
        )}

        {isAIProcessing && (
          <div className="flex justify-center animate-pulse">
            <div className="flex items-center gap-3 text-indigo-300 text-sm py-2 px-4 rounded-full bg-gray-700/50 border border-indigo-500/20">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
              <span>Analyzing request...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-gray-600/30 bg-gray-800/60 backdrop-blur-sm">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (@ for AI commands)"
            className="flex-1 bg-gray-700/40 border border-gray-600/30 text-gray-200 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
          />
          <Button 
            type="submit" 
            disabled={isAIProcessing}
            className="bg-indigo-600/80 hover:bg-indigo-500/90 text-gray-100 rounded-xl px-6 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] group"
          >
            <PaperAirplaneIcon className="h-5 w-5 text-indigo-100 group-hover:translate-x-0.5 transition-transform" />
            <span>Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}


export default Chatroom;