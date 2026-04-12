import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, AlertCircle, Paperclip, X, FileText, Image as ImageIcon, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  attachment?: {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

interface GroupChatProps {
  groupId: number;
  currentUserId?: number;
  isOrganizer?: boolean;
}

// ✅ TypeScript declarations for window extensions
declare global {
  interface Window {
    promoteMessageToDiscussion?: (messageId: number, content: string) => Promise<void>;
    prefillDiscussionForm?: (data: { prefillTitle: string; prefillContent: string }) => void;
  }
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const GroupChat = ({ groupId, currentUserId, isOrganizer = false }: GroupChatProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [groupId]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
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
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB");
      return;
    }
    
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type");
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    try {
      setSending(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("Please login to send messages");
        window.location.href = "/login";
        return;
      }

      let payload: any = { content: newMessage.trim() };
      
      if (selectedFile) {
        if (filePreview && filePreview.startsWith("data:")) {
          payload.attachment = {
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            base64: filePreview
          };
        } else {
          payload.attachment = {
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            url: URL.createObjectURL(selectedFile)
          };
        }
      }

      const response = await fetch(`${API_BASE}/groups/${groupId}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        
        if (result.isSuccess) {
          // ✅ 2025 Best Practice: Suggest Discussion for substantive content
          const messageContent = newMessage.trim();
          const isLongOrImportant = messageContent.length > 180 || 
            /ticket|refund|question|faq|how do|where is|when does|policy|rule/i.test(messageContent);
          
          if (isLongOrImportant) {
            toast.info("💡 Pro tip", {
              description: "For questions or important info, create a Discussion post so others can find it later.",
              action: {
                label: "Create Post",
                onClick: () => {
                  if (typeof window !== "undefined") {
                    const event = new CustomEvent("switchToDiscussions", { 
                      detail: { 
                        prefillTitle: messageContent.slice(0, 60) + (messageContent.length > 60 ? "..." : ""),
                        prefillContent: messageContent 
                      } 
                    });
                    window.dispatchEvent(event);
                  }
                }
              },
              duration: 7000
            });
          }
          
          setNewMessage("");
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          fetchMessages();
        } else {
          setError(result.message || "Failed to send message");
        }
      } else {
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderAttachment = (attachment: GroupMessage["attachment"]) => {
    if (!attachment) return null;
    
    if (attachment.fileType.startsWith("image/")) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border">
          <img 
            src={attachment.url} 
            alt={attachment.fileName}
            className="max-w-full h-auto max-h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      );
    }
    
    return (
      <div className="mt-2 p-3 border rounded-lg bg-muted/50 flex items-center gap-3">
        <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
        </div>
        <a 
          href={attachment.url} 
          download={attachment.fileName}
          className="text-primary hover:underline text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download
        </a>
      </div>
    );
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
              className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                      )}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.attachment && renderAttachment(message.attachment)}
                    </div>
                    {/* ✅ Organizer-only: Promote to Discussion */}
                    {isOrganizer && window.promoteMessageToDiscussion && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Message actions"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.promoteMessageToDiscussion?.(message.id, message.content)}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Promote to Discussion
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
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
      
      <div className="p-4 border-t">
        {selectedFile && (
          <div className="mb-3 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="h-10 w-10 flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
          
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
            disabled={sending || (!newMessage.trim() && !selectedFile)}
            className="flex-shrink-0"
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