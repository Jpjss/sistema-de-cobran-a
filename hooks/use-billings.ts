import { useState, useEffect } from "react"
import { Billing } from "@/app/page"
import { auditService } from "@/lib/audit"

export function useBillings(user: any) {
  const [billings, setBillings] = useState<Billing[]>([])
  const [loadingBillings, setLoadingBillings] = useState(true)

  // Função para carregar cobranças
  const fetchBillings = async () => {
    setLoadingBillings(true)
    try {
      const response = await fetch('/api/cobrancas')
      if (response.ok) {
        const data = await response.json()
        // Converter os dados do MongoDB para o formato do frontend
        const formattedBillings = data.map((cobranca: any) => ({
          id: cobranca._id,
          customerName: cobranca.clienteId, // temporário, pode ser melhorado
          customerEmail: cobranca.clienteId,
          description: cobranca.descricao,
          amount: cobranca.valor,
          dueDate: cobranca.vencimento,
          status: cobranca.status,
          createdAt: cobranca.criadoEm,
        }))
        setBillings(formattedBillings)
      } else {
        console.error('Erro ao carregar cobranças')
        setBillings([])
      }
    } catch (error) {
      console.error('Erro de conexão:', error)
      setBillings([])
    } finally {
      setLoadingBillings(false)
    }
  }

  // Carregar cobranças ao inicializar
  useEffect(() => {
    fetchBillings()
  }, [])

  const addBilling = async (billing: Omit<Billing, "id" | "createdAt">) => {
    try {
      const response = await fetch('/api/cobrancas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: billing.customerEmail,
          descricao: billing.description,
          valor: billing.amount,
          vencimento: billing.dueDate,
          status: billing.status,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Recarregar a lista de cobranças para garantir dados atualizados
        await fetchBillings()

        // Log da auditoria
        auditService.log({
          userId: user.id,
          userName: user.name,
          action: "CREATE",
          resource: "BILLING",
          resourceId: result.cobrancaId,
          details: `Criou cobrança para ${billing.customerName} - ${billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        })

        return true
      } else {
        console.error('Erro ao salvar cobrança:', await response.text())
        return false
      }
    } catch (error) {
      console.error('Erro de conexão:', error)
      return false
    }
  }

  const updateBilling = async (id: string, updates: Partial<Billing>) => {
    try {
      const response = await fetch(`/api/cobrancas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (response.ok) {
        // Recarregar a lista de cobranças
        await fetchBillings()

        const billing = billings.find((b) => b.id === id)
        if (billing && user) {
          auditService.log({
            userId: user.id,
            userName: user.name,
            action: "UPDATE",
            resource: "BILLING",
            resourceId: id,
            details: `Atualizou cobrança de ${billing.customerName}${updates.status ? ` - Status: ${updates.status}` : ""}`,
          })
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao atualizar cobrança:', error)
      return false
    }
  }

  const deleteBilling = async (id: string) => {
    const billing = billings.find((b) => b.id === id)
    if (billing) {
      try {
        const response = await fetch(`/api/cobrancas`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          // Recarregar a lista de cobranças
          await fetchBillings()

          if (user) {
            auditService.log({
              userId: user.id,
              userName: user.name,
              action: "DELETE",
              resource: "BILLING",
              resourceId: id,
              details: `Excluiu cobrança de ${billing.customerName}`,
            })
          }
          return true
        }
        return false
      } catch (error) {
        console.error('Erro ao excluir cobrança:', error)
        return false
      }
    }
    return false
  }

  return {
    billings,
    loadingBillings,
    fetchBillings,
    addBilling,
    updateBilling,
    deleteBilling,
  }
}
