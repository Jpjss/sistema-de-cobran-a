/**
 * Gerador de código PIX EMV válido conforme padrão do Banco Central do Brasil
 * Implementação completa do padrão EMV QR Code para PIX
 */

export interface PixPayload {
  pixKey: string;           // Chave PIX
  description?: string;     // Descrição da transação
  merchantName: string;     // Nome do recebedor
  merchantCity: string;     // Cidade do recebedor
  amount?: number;          // Valor (opcional para QR dinâmico)
  txid?: string;           // Identificador da transação
}

export class PixQRCodeGenerator {
  
  /**
   * Gera código PIX EMV completo e válido
   */
  static generatePixCode(payload: PixPayload): string {
    const emv = new EMVBuilder();
    
    // 00 - Payload Format Indicator (obrigatório)
    emv.add('00', '01');
    
    // 01 - Point of Initiation Method (dinâmico = 12, estático = 11)
    emv.add('01', payload.amount ? '11' : '12');
    
    // 26 - Merchant Account Information (PIX)
    const pixInfo = new EMVBuilder();
    pixInfo.add('00', 'BR.GOV.BCB.PIX');  // GUI
    pixInfo.add('01', payload.pixKey);     // Chave PIX
    
    if (payload.description) {
      pixInfo.add('02', payload.description.substring(0, 72)); // Descrição
    }
    
    emv.add('26', pixInfo.build());
    
    // 52 - Merchant Category Code
    emv.add('52', '0000');
    
    // 53 - Transaction Currency (986 = BRL)
    emv.add('53', '986');
    
    // 54 - Transaction Amount (opcional para QR dinâmico)
    if (payload.amount && payload.amount > 0) {
      emv.add('54', payload.amount.toFixed(2));
    }
    
    // 58 - Country Code
    emv.add('58', 'BR');
    
    // 59 - Merchant Name
    emv.add('59', payload.merchantName.substring(0, 25));
    
    // 60 - Merchant City
    emv.add('60', payload.merchantCity.substring(0, 15));
    
    // 62 - Additional Data Field Template (opcional)
    if (payload.txid) {
      const additionalData = new EMVBuilder();
      additionalData.add('05', payload.txid.substring(0, 25)); // Reference Label
      emv.add('62', additionalData.build());
    }
    
    // Calcula CRC16 antes de adicionar o campo 63
    const payloadWithoutCrc = emv.build() + '6304';
    const crc = this.calculateCRC16(payloadWithoutCrc);
    
    // 63 - CRC (obrigatório)
    emv.add('63', crc);
    
    return emv.build();
  }
  
  /**
   * Calcula CRC16-CCITT conforme padrão PIX
   */
  private static calculateCRC16(data: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8);
      
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  /**
   * Valida se uma chave PIX está no formato correto
   */
  static validatePixKey(key: string): boolean {
    // CPF: 11 dígitos
    if (/^\d{11}$/.test(key)) return true;
    
    // CNPJ: 14 dígitos
    if (/^\d{14}$/.test(key)) return true;
    
    // Email: formato válido
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return true;
    
    // Telefone: +5511999999999
    if (/^\+55\d{10,11}$/.test(key)) return true;
    
    // Chave aleatória: UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return true;
    
    return false;
  }
}

/**
 * Builder para construir EMV QR Code
 */
class EMVBuilder {
  private data: string = '';
  
  add(id: string, value: string): void {
    if (value) {
      const length = value.length.toString().padStart(2, '0');
      this.data += id + length + value;
    }
  }
  
  build(): string {
    return this.data;
  }
}

/**
 * Função auxiliar para gerar PIX code compatível com a API existente
 */
export function generateValidPixCode(
  pixKey: string, 
  merchantName: string, 
  amount: number, 
  description?: string,
  txid?: string
): string {
  return PixQRCodeGenerator.generatePixCode({
    pixKey,
    merchantName,
    merchantCity: 'SAO PAULO',
    amount,
    description,
    txid
  });
}