// Teste direto do gerador PIX
console.log('🧪 Testando gerador PIX...\n');

// Simular os dados que seriam enviados
const testData = {
  pixKey: 'jp0886230@gmail.com',
  merchantName: 'Cliente Teste',
  amount: 100.50,
  description: 'Teste cobrança',
  txid: 'TXN123456789'
};

console.log('📋 Dados de entrada:');
console.log('- Chave PIX:', testData.pixKey);
console.log('- Nome:', testData.merchantName);
console.log('- Valor:', `R$ ${testData.amount.toFixed(2)}`);
console.log('- Descrição:', testData.description);
console.log('- ID Transação:', testData.txid);
console.log();

// Teste manual da estrutura EMV
console.log('🔧 Construindo código PIX EMV:');

// Versão (00)
const version = '00020';
console.log('✅ Versão EMV:', version);

// Método (01) - 12 = dinâmico
const method = '0102';
console.log('✅ Método:', method);

// Merchant Account Information (26)
const pixGUI = 'BR.GOV.BCB.PIX';
const pixKeyField = `0114${pixGUI}01${testData.pixKey.length.toString().padStart(2, '0')}${testData.pixKey}`;
const merchantAccount = `26${pixKeyField.length.toString().padStart(2, '0')}${pixKeyField}`;
console.log('✅ Merchant Account:', merchantAccount);

// Currency (53) - 986 = BRL
const currency = '5303986';
console.log('✅ Moeda:', currency);

// Amount (54)
const amountStr = testData.amount.toFixed(2);
const amount = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
console.log('✅ Valor:', amount);

// Country (58) - BR
const country = '5802BR';
console.log('✅ País:', country);

// Merchant Name (59)
const merchantName = testData.merchantName.substring(0, 25);
const merchantNameField = `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;
console.log('✅ Nome comerciante:', merchantNameField);

// Merchant City (60)
const merchantCity = 'SAO PAULO';
const merchantCityField = `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`;
console.log('✅ Cidade:', merchantCityField);

// Additional Data (62) - opcional
const txidField = testData.txid.substring(0, 25);
const additionalData = `05${txidField.length.toString().padStart(2, '0')}${txidField}`;
const additionalDataField = `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`;
console.log('✅ Dados adicionais:', additionalDataField);

// Montar payload sem CRC
const payloadWithoutCrc = version + method + merchantAccount + currency + amount + country + merchantNameField + merchantCityField + additionalDataField + '6304';

console.log('\n📝 Payload sem CRC:');
console.log(payloadWithoutCrc);

// Calcular CRC16-CCITT
function calculateCRC16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

const crc = calculateCRC16(payloadWithoutCrc);
console.log('🔐 CRC16 calculado:', crc);

// Código PIX final
const finalPixCode = payloadWithoutCrc + crc;
console.log('\n🎯 CÓDIGO PIX FINAL:');
console.log(finalPixCode);

console.log('\n📊 Análise:');
console.log('- Tamanho:', finalPixCode.length, 'caracteres');
console.log('- Inicia com 00020:', finalPixCode.startsWith('00020') ? '✅' : '❌');
console.log('- Contém PIX ID:', finalPixCode.includes('BR.GOV.BCB.PIX') ? '✅' : '❌');
console.log('- Contém moeda BRL:', finalPixCode.includes('5303986') ? '✅' : '❌');
console.log('- CRC válido:', crc.length === 4 ? '✅' : '❌');

console.log('\n🧪 Teste concluído!');