import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, AlertCircle } from "lucide-react";

interface GroupMessage {
  id: number;
  senderId: number;
  sender: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  sentAt: string;
  editedAt?: string;
  likeCount: number;
}

interface GroupChatProps {
  groupId: number;
  currentUserId?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const GroupChat = ({ groupId, currentUserId }: GroupChatProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/groups/${groupId}/chat/messages?limit=50`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        // Token expired or invalid - user should re-login
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse()); // Show oldest first in array, but UI shows newest at bottom
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      // Don't set error state for auth issues - let redirect handle it
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("Please login to send messages");
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_BASE}/groups/${groupId}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        return;
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        
        if (result.isSuccess) {
          setNewMessage("");
          fetchMessages(); // Refresh to get the new message
        } else {
          setError(result.message || "Failed to send message");
        }
      } else {
        // Handle empty or non-JSON responses
        if (!response.ok) {
          setError("Failed to send message. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Send message failed:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading && messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          Group Chat
          <span className="text-xs font-normal text-muted-foreground">
            ({messages.length} messages)
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.sender.profilePicture} />
                <AvatarFallback className="text-xs">
                  {getInitials(message.sender.firstName, message.sender.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                <div className={`rounded-lg px-3 py-2 ${
                  isOwn 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground"
                }`}>
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1">
                      {message.sender.firstName} {message.sender.lastName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className={`text-xs text-muted-foreground mt-1 ${
                  isOwn ? "text-right" : ""
                }`}>
                  {formatTime(message.sentAt)}
                  {message.editedAt && " • edited"}
                </p>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </CardContent>
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
            maxLength={2000}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {newMessage.length}/2000
        </p>
      </div>
    </Card>
  );
};

export default GroupChat;