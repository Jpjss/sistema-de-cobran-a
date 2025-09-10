'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Send, Phone, Clock, User, Tag } from 'lucide-react';

interface Message {
  messageId: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  createdAt: string;
}

interface Conversation {
  _id: string;
  phone: string;
  customerName?: string;
  messages: Message[];
  lastInteraction: string;
  status: 'active' | 'resolved' | 'pending';
  cobrancaId?: string;
  tags: string[];
}

export default function WhatsAppManager() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [statusFilter]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/whatsapp/conversations?${params}`);
      const data = await response.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedConversation.phone,
          message: newMessage
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        // Recarregar conversas para mostrar a nova mensagem
        await loadConversations();
        // Reselecionar a conversa atualizada
        const updatedConversation = conversations.find(c => c.phone === selectedConversation.phone);
        if (updatedConversation) {
          setSelectedConversation(updatedConversation);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const updateConversationStatus = async (phone: string, status: string) => {
    try {
      await fetch('/api/whatsapp/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, status })
      });
      
      await loadConversations();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'resolved': return 'Resolvido';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          WhatsApp Manager
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie conversas e automatize respostas para cobranças
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversas</span>
                <Button 
                  onClick={loadConversations} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Carregando...' : 'Atualizar'}
                </Button>
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?._id === conversation._id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">
                        {conversation.customerName || conversation.phone}
                      </span>
                    </div>
                    <Badge className={getStatusColor(conversation.status)}>
                      {getStatusLabel(conversation.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.messages[conversation.messages.length - 1]?.body || 'Sem mensagens'}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {new Date(conversation.lastInteraction).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  {conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conversation.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {conversation.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{conversation.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {conversations.length === 0 && !loading && (
                <Alert>
                  <AlertDescription>
                    Nenhuma conversa encontrada
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.customerName || 'Cliente'}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedConversation.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedConversation.status}
                      onValueChange={(status) => updateConversationStatus(selectedConversation.phone, status)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedConversation.cobrancaId && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Com Cobrança
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Mensagens */}
                <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-3">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.messageId}
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          message.fromMe
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p className={`text-xs mt-1 ${
                          message.fromMe ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enviar mensagem */}
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    rows={3}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={sending || !newMessage.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Pressione Enter para enviar • Shift+Enter para nova linha
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}