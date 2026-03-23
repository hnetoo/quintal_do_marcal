
import { Order, Dish, SystemSettings, Customer } from '../types';
import ThermalPrinterManager from './thermalPrinterConfig';

const formatKz = (val: number) => 
  new Intl.NumberFormat('pt-AO', { 
    style: 'currency', 
    currency: 'AOA', 
    maximumFractionDigits: 0 
  }).format(val);

// Comandos genéricos para impressora térmica
const getThermalCommands = () => {
  return `
    <script>
      window.onload = function() {
        // Configurar impressora térmica para 80mm
        const printCommands = document.createElement('div');
        printCommands.innerHTML = 
          String.fromCharCode(27) + String.fromCharCode(112) + String.fromCharCode(0) + String.fromCharCode(60) + String.fromCharCode(255) + // Abrir gaveta
          String.fromCharCode(29) + String.fromCharCode(86) + String.fromCharCode(1) + // Corte total (80mm)
          String.fromCharCode(27) + String.fromCharCode(64); // Inicializar impressora
        document.body.appendChild(printCommands);
        window.print();
      };
    </script>
  `;
};

const thermalStyles = `
  @page { 
    margin: 0; 
    size: 80mm auto;
  }
  @media print {
    body { 
      font-family: 'Courier New', Courier, monospace; 
      width: 80mm; 
      min-height: 200mm;
      padding: 4mm; 
      font-size: 10px; 
      color: #000; 
      line-height: 1.2;
      background: #fff;
      margin: 0;
      box-sizing: border-box;
    }
  }
  body { 
    font-family: 'Courier New', Courier, monospace; 
    width: 80mm; 
    padding: 4mm; 
    font-size: 10px; 
    color: #000; 
    line-height: 1.2;
    background: #fff;
    margin: 0;
    box-sizing: border-box;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px solid #000; margin: 8px 0; }
  .header-title { font-size: 12px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
  .items-table { width: 100%; margin: 8px 0; border-collapse: collapse; }
  .items-table td { padding: 2px 0; vertical-align: top; }
  .qr-container { margin: 10px 0; display: flex; justify-content: center; }
  .hash-box { 
    font-size: 8px; 
    margin-top: 8px; 
    text-align: center; 
    line-height: 1.2; 
    background: #f5f5f5; 
    padding: 4px; 
    border: 1px solid #000;
  }
  .tax-table { width: 100%; font-size: 8px; margin-top: 5px; border-collapse: collapse; }
  .tax-table th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
  .customer-box { margin: 5px 0; }
`;

/**
 * Função utilitária para disparar a impressão usando um IFRAME oculto.
 * Isso é mais robusto em ambientes Tauri/WebView do que window.open.
 */
const executePrint = (html: string) => {
  // Verificar se já está imprimindo usando flag global
  if ((window as any).isPrinting) {
    console.log('[PRINT] Impressão já em andamento, ignorando chamada duplicada');
    return;
  }

  (window as any).isPrinting = true;
  console.log('[PRINT] Iniciando impressão com lock global');
  
  const frameId = 'print-frame';
  let printFrame = document.getElementById(frameId) as HTMLIFrameElement;
  
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = frameId;
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);
  }

  const doc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    
    // Obter configuração da impressora térmica
    const printerConfig = ThermalPrinterManager.getConfig();
    
    // Configurar CSS específico da impressora
    if (printerConfig) {
      const printerCSS = ThermalPrinterManager.getPrinterCSS(printerConfig);
      const styleElement = doc.createElement('style');
      styleElement.textContent = printerCSS;
      doc.head.appendChild(styleElement);
    }
    
    // Delay único para garantir renderização completa e evitar duplicação
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        console.log('[PRINT] Impressão disparada com sucesso');
      } catch (error) {
        console.error('[PRINT] Erro ao disparar impressão:', error);
      } finally {
        // Liberar lock global após 1 segundo
        setTimeout(() => {
          (window as any).isPrinting = false;
          console.log('[PRINT] Lock global liberado');
        }, 1000);
      }
    }, 500); // Reduzido para 500ms para resposta mais rápida
  } else {
    (window as any).isPrinting = false;
    console.error('[PRINT] Não foi possível obter o documento do iframe');
  }
};

export const printThermalInvoice = (
  order: Order,
  menu: Dish[],
  settings: SystemSettings,
  customer?: Customer
) => {
  console.log(`[PRINT] Iniciando impressão de Fatura: ${order.invoiceNumber}`, {
    orderId: order.id,
    items: order.items.length,
    total: order.total
  });

  const isFR = order.paymentMethod !== 'PAGAR_DEPOIS';
  const docType = isFR ? 'Fatura-Recibo' : 'Fatura';
  
  const taxRate = settings.taxRate || 14;
  const netTotal = order.total - order.taxTotal;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${order.invoiceNumber}</title>
        <style>${thermalStyles}</style>
      </head>
      <body>
        <div class="text-center">
          <div class="header-title">${settings.restaurantName || 'TASCA DO VEREDA'}</div>
          <div style="font-size: 9px;">NIF: ${settings.nif || '999999999'}</div>
          <div style="font-size: 9px;">${settings.address || 'Endereço da Empresa'}</div>
          <div style="font-size: 9px;">${settings.phone || 'Telefone'}</div>
          <div class="divider"></div>
          <div class="bold" style="font-size: 12px; text-transform: uppercase;">${docType}</div>
          <div class="bold" style="font-size: 11px;">${order.invoiceNumber}</div>
          <div class="divider"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 9px;">
          <span>DATA: ${new Date(order.timestamp).toLocaleDateString('pt-AO')}</span>
          <span>HORA: ${new Date(order.timestamp).toLocaleTimeString('pt-AO')}</span>
        </div>
        
        <div class="customer-box">
          <div style="font-size: 9px;">
            <strong>CLIENTE:</strong> ${customer?.name || 'CONSUMIDOR FINAL'}
          </div>
          <div style="font-size: 9px;">
            <strong>NIF:</strong> ${customer?.nif || '999999999'}
          </div>
        </div>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr class="bold">
              <td style="width: 60%">DESCRIÇÃO</td>
              <td class="text-right">TOTAL</td>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => {
              const dish = item.dish;
              const itemName = dish?.name || 'Produto Sem Nome';
              const safeItemName = typeof itemName === 'string' ? itemName.substring(0, 30) : String(itemName).substring(0, 30);
              return `
                <tr>
                  <td>${item.quantity}x ${safeItemName}</td>
                  <td class="text-right">${(item.unitPrice * item.quantity).toFixed(0)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="text-right" style="font-size: 12px;">
          <div class="bold">TOTAL A PAGAR: ${formatKz(order.total)}</div>
        </div>

        <div style="margin-top: 10px;">
          <div class="bold" style="font-size: 9px; text-decoration: underline;">RESUMO DE IMPOSTOS:</div>
          <table class="tax-table">
            <thead>
              <tr>
                <th>DESCRIÇÃO</th>
                <th>TAXA</th>
                <th>INCID.</th>
                <th>VALOR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>IVA</td>
                <td>${taxRate}%</td>
                <td>${netTotal.toFixed(2)}</td>
                <td>${order.taxTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hash-box">
          <strong>CÓDIGO DE VALIDAÇÃO AGT:</strong><br/>
          ${order.hash?.substring(0, 4)}-${order.hash?.substring(order.hash.length - 4)}<br/>
          Processado por programa certificado<br/>
          N.º ${settings.agtCertificate || '000'}/AGT/2025
        </div>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 8px;">
          Documento processado eletronicamente<br/>
          REST IA OS v1.1.1
        </div>
      </body>
    </html>
  `;

  executePrint(html);
};

export const printCashClosing = (closedToday: Order[], settings: SystemSettings, user: string, paymentConfigs?: any[]) => {
  const total = closedToday.reduce((acc, o) => acc + o.total, 0);
  
  // Agrupar por método de pagamento com mapeamento correto
  const byMethod = closedToday.reduce((acc: any, o) => {
    let method = o.paymentMethod || 'OUTRO';
    
    // Mapear métodos para nomes padronizados
    switch (String(method).toLowerCase()) {
      case 'cash':
      case 'numerário':
      case 'numerario':
        method = 'Numerário';
        break;
      case 'card':
      case 'tpa':
      case 'multicaixa':
      case 'pos':
      case 'debit':
      case 'credit':
        method = 'TPA/Multicaixa';
        break;
      case 'transfer':
      case 'transferência':
      case 'transferencia':
      case 'bank':
        method = 'Transferência Bancária';
        break;
      case 'mpesa':
      case 'm-pesa':
        method = 'M-Pesa';
        break;
      case 'express':
      case 'referencia':
      case 'ref':
        method = 'Referência';
        break;
      default:
        method = 'OUTRO';
    }
    
    acc[method] = (acc[method] || 0) + o.total;
    return acc;
  }, {});

  // Adicionar métodos que não tiveram vendas mas estão configurados
  if (paymentConfigs) {
    paymentConfigs.forEach((config: any) => {
      if (config.isActive && !byMethod[config.name]) {
        byMethod[config.name] = 0;
      }
    });
  }

  console.log(`[PRINT] Gerando HTML para Fecho de Caixa`, {
    total,
    pedidos: closedToday.length,
    operador: user,
    metodos: Object.keys(byMethod)
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${thermalStyles}</style>
      </head>
      <body>
        <div class="text-center">
          <div class="header-title">${settings.restaurantName}</div>
          <div class="non-fiscal">FECHO DE CAIXA DIÁRIO</div>
          <div class="divider"></div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <div>OPERADOR: ${user}</div>
          <div>DATA: ${new Date().toLocaleDateString('pt-AO')}</div>
          <div>HORA: ${new Date().toLocaleTimeString('pt-AO')}</div>
          <div>PEDIDOS: ${closedToday.length}</div>
        </div>

        <div class="divider"></div>
        <div class="bold">RESUMO POR PAGAMENTO:</div>
        <table class="items-table">
          ${Object.entries(byMethod).map(([method, val]) => `
            <tr>
              <td>${method}</td>
              <td class="text-right">${formatKz(val as number)}</td>
            </tr>
          `).join('')}
        </table>

        <div class="divider"></div>
        <div class="text-right bold" style="font-size: 16px;">
          TOTAL GERAL: ${formatKz(total)}
        </div>

        <div class="divider"></div>
        <div class="text-center">
          <div class="bold">ASSINATURA OPERADOR</div>
          <div style="height: 40px; border-bottom: 1px solid #000; width: 150px; margin: 0 auto;"></div>
        </div>

        <div class="legal-footer">
          RELATÓRIO DE USO INTERNO
          <br/>
          <b>REST IA OS v1.1.1</b>
        </div>
        ${getThermalCommands()}
      </body>
    </html>
  `;

  executePrint(html);
};

export const printTableReview = (order: Order, menu: Dish[], settings: SystemSettings) => {
  console.log(`[PRINT] Iniciando Consulta de Mesa: ${order.tableId}`, {
    orderId: order.id,
    total: order.total
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${thermalStyles}</style>
      </head>
      <body>
        <div class="text-center">
          <div class="header-title">${settings.restaurantName}</div>
          <div class="non-fiscal">CONSULTA DE MESA</div>
          <div class="divider"></div>
        </div>
        <div>MESA: ${order.tableId}</div>
        <div>DATA: ${new Date().toLocaleString('pt-AO')}</div>
        <table class="items-table">
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.quantity}x ${menu.find(d => d.id === item.dishId)?.name}</td>
                <td class="text-right">${(item.unitPrice * item.quantity).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="text-right bold" style="font-size: 16px;">
          PRE-CONTA: ${formatKz(order.total)}
        </div>
        <div class="legal-footer" style="border: none;">
          ESTE DOCUMENTO NÃO SERVE DE FATURA.
        </div>
      </body>
    </html>
  `;
  
  executePrint(html);
};

export const printStaffSchedules = (employees: any[], shifts: any[], settings: any) => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Escalas de Staff</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #334155; }
          h1 { color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
          .staff-name { font-weight: bold; color: #000; }
        </style>
      </head>
      <body>
        <h1>Escalas de Trabalho - ${settings.restaurantName}</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-AO')}</p>
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Dia da Semana</th>
              <th>Entrada</th>
              <th>Saída</th>
            </tr>
          </thead>
          <tbody>
            ${shifts.map(s => {
              const emp = employees.find(e => e.id === s.employeeId);
              return `
                <tr>
                  <td class="staff-name">${emp?.name || 'N/A'}</td>
                  <td>${days[s.dayOfWeek]}</td>
                  <td>${s.startTime}</td>
                  <td>${s.endTime}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  executePrint(html);
};

export const printPayroll = (employees: any[], settings: any) => {
  const total = employees.reduce((acc, e) => acc + e.salary, 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Folha de Salários</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #334155; }
          h1 { color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
          .total-row { background: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Folha de Pagamento - ${settings.restaurantName}</h1>
        <p>Referência: ${new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</p>
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Cargo</th>
              <th>Salário Base</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(e => `
              <tr>
                <td>${e.name}</td>
                <td>${e.role}</td>
                <td>${formatKz(e.salary)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL A PAGAR</td>
              <td>${formatKz(total)}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  executePrint(html);
};

export const printFinanceReport = (title: string, data: any[], columns: string[], settings: any) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #334155; }
          h1 { color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f8fafc; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h1>${title} - ${settings.restaurantName}</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-AO')}</p>
        <table>
          <thead>
            <tr>
              ${columns.map(c => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${row.map((cell: any) => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  executePrint(html);
};
