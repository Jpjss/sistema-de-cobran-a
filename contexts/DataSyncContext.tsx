// Context e Provider para sincronização global de dados
'use client'

import React, { createContext, useContext, ReactNode, useState } from 'react'
import { toast } from 'sonner'

interface DataSyncContextType {
  notifyBillingChange: (action: 'created' | 'updated' | 'deleted' | 'paid', billingId?: string) => void
  notifyCustomerChange: (action: 'created' | 'updated' | 'deleted', customerId?: string) => void
  notifyPaymentChange: (action: 'created' | 'updated', paymentId?: string) => void
  lastAction: string | null
  syncTimestamp: Date
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined)

interface DataSyncProviderProps {
  children: ReactNode
}

export function DataSyncProvider({ children }: DataSyncProviderProps) {
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [syncTimestamp, setSyncTimestamp] = useState<Date>(new Date())

  const notifyBillingChange = (action: 'created' | 'updated' | 'deleted' | 'paid', billingId?: string) => {
    setLastAction(`billing_${action}`)
    setSyncTimestamp(new Date())
    
    // Disparar evento global para components que precisam reagir (apenas no client)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reportsDataChange', {
        detail: { type: 'billing', action, id: billingId }
      }))
    }
    
    const actionText = {
      created: 'criada',
      updated: 'atualizada', 
      deleted: 'removida',
      paid: 'paga'
    }[action]
    
    toast.success(`Cobrança ${actionText} - relatórios atualizados`)
  }

  const notifyCustomerChange = (action: 'created' | 'updated' | 'deleted', customerId?: string) => {
    setLastAction(`customer_${action}`)
    setSyncTimestamp(new Date())
    
    // Disparar evento global para components que precisam reagir (apenas no client)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reportsDataChange', {
        detail: { type: 'customer', action, id: customerId }
      }))
    }
    
    const actionText = {
      created: 'criado',
      updated: 'atualizado',
      deleted: 'removido'
    }[action]
    
    toast.success(`Cliente ${actionText} - relatórios atualizados`)
  }

  const notifyPaymentChange = (action: 'created' | 'updated', paymentId?: string) => {
    setLastAction(`payment_${action}`)
    setSyncTimestamp(new Date())
    
    // Disparar evento global para components que precisam reagir (apenas no client)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reportsDataChange', {
        detail: { type: 'payment', action, id: paymentId }
      }))
    }
    
    const actionText = action === 'created' ? 'criado' : 'atualizado'
    toast.success(`Pagamento ${actionText} - relatórios atualizados`)
  }

  const contextValue: DataSyncContextType = {
    notifyBillingChange,
    notifyCustomerChange, 
    notifyPaymentChange,
    lastAction,
    syncTimestamp
  }

  return (
    <DataSyncContext.Provider value={contextValue}>
      {children}
    </DataSyncContext.Provider>
  )
}

export function useDataSyncContext() {
  const context = useContext(DataSyncContext)
  if (context === undefined) {
    throw new Error('useDataSyncContext must be used within a DataSyncProvider')
  }
  return context
}

// Hook simplificado para uso nos componentes
export function useNotifyDataChange() {
  const { 
    notifyBillingChange, 
    notifyCustomerChange, 
    notifyPaymentChange 
  } = useDataSyncContext()

  // Função para notificar mudanças de usuários
  const notifyUserChange = (action: 'created' | 'updated' | 'deleted', userId?: string) => {
    toast.success(`Usuário ${action === 'created' ? 'criado' : action === 'updated' ? 'atualizado' : 'removido'} - relatórios atualizados`)
  }

  return {
    // Notificações para cobranças
    onBillingCreated: (billingId?: string) => notifyBillingChange('created', billingId),
    onBillingUpdated: (billingId?: string) => notifyBillingChange('updated', billingId),
    onBillingDeleted: (billingId?: string) => notifyBillingChange('deleted', billingId),
    onBillingPaid: (billingId?: string) => notifyBillingChange('paid', billingId),
    
    // Notificações para clientes
    onCustomerCreated: (customerId?: string) => notifyCustomerChange('created', customerId),
    onCustomerUpdated: (customerId?: string) => notifyCustomerChange('updated', customerId),
    onCustomerDeleted: (customerId?: string) => notifyCustomerChange('deleted', customerId),
    
    // Notificações para pagamentos
    onPaymentCreated: (paymentId?: string) => notifyPaymentChange('created', paymentId),
    onPaymentUpdated: (paymentId?: string) => notifyPaymentChange('updated', paymentId),
    
    // Notificações para usuários
    onUserCreated: (userId?: string) => notifyUserChange('created', userId),
    onUserUpdated: (userId?: string) => notifyUserChange('updated', userId),
    onUserDeleted: (userId?: string) => notifyUserChange('deleted', userId),
    
    // Função genérica
    notifyChange: (type: string, action: string, id?: string) => {
      if (type === 'billing') {
        notifyBillingChange(action as any, id)
      } else if (type === 'customer') {
        notifyCustomerChange(action as any, id)
      } else if (type === 'payment') {
        notifyPaymentChange(action as any, id)
      }
    }
  }
}