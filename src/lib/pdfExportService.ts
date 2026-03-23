import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Employee, SystemSettings } from '../types';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
  }
}

interface PDFExportOptions {
  title: string;
  startDate?: string;
  endDate?: string;
  settings: SystemSettings;
}

export class PDFExportService {
  
  // Método para salvar PDF usando APIs Tauri
  static async savePDFWithDialog(doc: jsPDF, filename: string): Promise<void> {
    try {
      // Gerar ArrayBuffer do PDF
      const pdfArrayBuffer = doc.output('arraybuffer');
      
      // Verificar se estamos em ambiente Tauri
      const isTauri = !!(window as any).__TAURI_INTERNALS__;
      
      if (isTauri) {
        try {
          // Abrir diálogo "Salvar Como"
          const selectedPath = await save({
            title: 'Salvar Relatório PDF',
            defaultPath: filename,
            filters: [
              {
                name: 'PDF Files',
                extensions: ['pdf']
              }
            ]
          });
          
          if (selectedPath) {
            // Converter ArrayBuffer para Uint8Array
            const uint8Array = new Uint8Array(pdfArrayBuffer);
            
            // Escrever arquivo no caminho selecionado
            await writeFile(selectedPath, uint8Array);
            console.log(`[PDF] Salvo com sucesso: ${selectedPath}`);
          } else {
            console.log('[PDF] Utilizador cancelou o salvamento');
          }
        } catch (dialogError) {
          console.error('[PDF] Erro no diálogo Tauri:', dialogError);
          // Fallback de emergência para browser
          doc.save(filename);
          console.log(`[PDF] Fallback: Salvo via browser: ${filename}`);
        }
      } else {
        // Fallback para ambiente web
        doc.save(filename);
        console.log(`[PDF] Salvo via browser: ${filename}`);
      }
    } catch (error) {
      console.error('[PDF] Erro ao salvar PDF:', error);
      // Fallback de emergência para browser se Tauri falhar
      try {
        doc.save(filename);
        console.log(`[PDF] Fallback de emergência: ${filename}`);
      } catch (fallbackError) {
        console.error('[PDF] Fallback também falhou:', fallbackError);
      }
    }
  }
  
  static addHeader(doc: jsPDF, settings: SystemSettings, title: string) {
    // Cabeçalho com informações do restaurante
    doc.setFontSize(16);
    doc.text(settings.restaurantName || 'Restaurante', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`NIF: ${settings.nif || 'N/A'}`, 105, 28, { align: 'center' });
    
    if (settings.appLogoUrl) {
      try {
        doc.addImage(settings.appLogoUrl, 'PNG', 15, 15, 30, 30);
      } catch (error) {
        console.log('Não foi possível adicionar o logótipo');
      }
    }
    
    // Título do relatório
    doc.setFontSize(14);
    doc.text(title, 105, 50, { align: 'center' });
    
    // Data do relatório
    doc.setFontSize(9);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-PT')}`, 105, 58, { align: 'center' });
    
    return 70; // Retorna a posição Y para o conteúdo
  }

  static addFooter(doc: jsPDF, pageNumber: number) {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.text(`Página ${pageNumber} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Gerado por Rest-IA v1.1.1', 105, 290, { align: 'center' });
  }

  static async exportVendasPorArtigo(
    orders: Order[], 
    menu: any[], 
    options: PDFExportOptions
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.addHeader(doc, options.settings, 'Relatório de Vendas por Artigo');
    
    // Filtrar pedidos por data se necessário
    const filteredOrders = this.filterOrdersByDate(orders, options.startDate, options.endDate);
    
    // Garantir que sempre haja dados (mesmo que vazios)
    if (!filteredOrders || filteredOrders.length === 0) {
      doc.setFontSize(12);
      doc.text('Nenhuma venda encontrada no período selecionado.', 105, 120, { align: 'center' });
      doc.text('Tente selecionar um período diferente.', 105, 130, { align: 'center' });
      
      this.addFooter(doc, 1);
      await this.savePDFWithDialog(doc, 'vendas-por-artigo.pdf');
      return;
    }
    
    // Agrupar vendas por produto
    const vendasPorProduto = new Map();
    
    filteredOrders.forEach(order => {
      if (['FECHADO', 'closed', 'paid'].includes(order.status)) {
        order.items.forEach(item => {
          const productName = item.name || item.dish?.name || 'Produto';
          const quantity = item.quantity || 1;
          const price = item.price || item.unitPrice || 0;
          
          if (!vendasPorProduto.has(productName)) {
            vendasPorProduto.set(productName, {
              name: productName,
              quantity: 0,
              total: 0,
              price: price
            });
          }
          
          const product = vendasPorProduto.get(productName);
          product.quantity += quantity;
          product.total += price * quantity;
        });
      }
    });
    
    // Converter para array e ordenar por total
    const produtosArray = Array.from(vendasPorProduto.values())
      .sort((a, b) => b.total - a.total);
    
    // Tabela de vendas
    autoTable(doc, {
      head: [['Produto', 'Qtd', 'Preço Unit.', 'Total']],
      body: produtosArray.map(p => [
        p.name,
        p.quantity.toString(),
        `AOA ${p.price.toFixed(2)}`,
        `AOA ${p.total.toFixed(2)}`
      ]),
      startY: yPosition + 10,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Total geral
    const totalGeral = produtosArray.reduce((sum, p) => sum + p.total, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 250;
    
    doc.setFontSize(11);
    doc.text(`Total Geral: AOA ${totalGeral.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
    
    this.addFooter(doc, 1);
    await this.savePDFWithDialog(doc, 'vendas-por-artigo.pdf');
  }

  static async exportDespesas(
    expenses: Expense[], 
    employees: Employee[], 
    options: PDFExportOptions
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.addHeader(doc, options.settings, 'Relatório de Despesas Completo');
    
    // Filtrar despesas por data
    const filteredExpenses = this.filterExpensesByDate(expenses, options.startDate, options.endDate);
    
    // Preparar dados da tabela
    const despesasTable = filteredExpenses.map(expense => [
      new Date(expense.created_at || expense.date).toLocaleDateString('pt-PT'),
      expense.description || 'Sem descrição',
      expense.category || this.categorizeExpense(expense.description),
      `AOA ${(expense.amount_kz || expense.amount || 0).toFixed(2)}`
    ]);
    
    // Adicionar despesas de staff se houver
    employees.filter(emp => emp.status === 'ATIVO').forEach(employee => {
      despesasTable.push([
        new Date().toLocaleDateString('pt-PT'),
        `Salário - ${employee.name}`,
        'Staff',
        `AOA ${(employee.salary || 0).toFixed(2)}`
      ]);
    });
    
    // Tabela de despesas
    autoTable(doc, {
      head: [['Data', 'Descrição', 'Categoria', 'Valor']],
      body: despesasTable,
      startY: yPosition + 10,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60] }
    });
    
    // Total de despesas
    const totalDespesas = filteredExpenses.reduce((sum, exp) => 
      sum + (exp.amount_kz || exp.amount || 0), 0
    ) + employees.filter(emp => emp.status === 'ATIVO')
      .reduce((sum, emp) => sum + (emp.salary || 0), 0);
    
    const finalY = (doc as any).lastAutoTable.finalY || 250;
    
    doc.setFontSize(11);
    doc.text(`Total de Despesas: AOA ${totalDespesas.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
    
    this.addFooter(doc, 1);
    await this.savePDFWithDialog(doc, 'relatorio-despesas.pdf');
  }

  static async exportFinanceiroTotal(
    orders: Order[], 
    expenses: Expense[], 
    employees: Employee[], 
    options: PDFExportOptions
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.addHeader(doc, options.settings, 'Relatório Financeiro Master');
    
    // Filtrar dados por data
    const filteredOrders = this.filterOrdersByDate(orders, options.startDate, options.endDate);
    const filteredExpenses = this.filterExpensesByDate(expenses, options.startDate, options.endDate);
    
    // Calcular receitas
    const receitas = filteredOrders
      .filter(order => ['FECHADO', 'closed', 'paid'].includes(order.status))
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    // Calcular impostos
    const impostos = receitas * (options.settings.taxRate / 100);
    
    // Calcular despesas
    const despesasOperacionais = filteredExpenses.reduce((sum, exp) => 
      sum + (exp.amount_kz || exp.amount || 0), 0
    );
    const despesasStaff = employees.filter(emp => emp.status === 'ATIVO')
      .reduce((sum, emp) => sum + (emp.salary || 0), 0);
    const totalDespesas = despesasOperacionais + despesasStaff;
    
    // Calcular lucro líquido
    const lucroLiquido = receitas - impostos - totalDespesas;
    
    // Tabela resumo
    const resumoData = [
      ['Receita Bruta', `AOA ${receitas.toFixed(2)}`, '100%'],
      ['Impostos (IVA ' + options.settings.taxRate + '%)', `AOA ${impostos.toFixed(2)}`, 
       `${((impostos / receitas) * 100).toFixed(1)}%`],
      ['Despesas Operacionais', `AOA ${despesasOperacionais.toFixed(2)}`, 
       `${((despesasOperacionais / receitas) * 100).toFixed(1)}%`],
      ['Despesas de Staff', `AOA ${despesasStaff.toFixed(2)}`, 
       `${((despesasStaff / receitas) * 100).toFixed(1)}%`],
      ['Total Despesas', `AOA ${totalDespesas.toFixed(2)}`, 
       `${((totalDespesas / receitas) * 100).toFixed(1)}%`],
      ['LUCRO LÍQUIDO', `AOA ${lucroLiquido.toFixed(2)}`, 
       `${((lucroLiquido / receitas) * 100).toFixed(1)}%`]
    ];
    
    autoTable(doc, {
      head: [['Descrição', 'Valor (AOA)', '% sobre Receita']],
      body: resumoData,
      startY: yPosition + 10,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [46, 204, 113] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' }
      }
    });
    
    // Análise adicional
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    
    doc.setFontSize(10);
    doc.text('Análise de Rentabilidade', 15, finalY + 15);
    doc.setFontSize(9);
    
    const margemBruta = ((receitas - impostos) / receitas * 100).toFixed(1);
    const margemLiquida = ((lucroLiquido / receitas) * 100).toFixed(1);
    
    doc.text(`• Margem Bruta: ${margemBruta}%`, 15, finalY + 25);
    doc.text(`• Margem Líquida: ${margemLiquida}%`, 15, finalY + 32);
    doc.text(`• Regime Fiscal: ${options.settings.taxRegime} (${options.settings.taxRate}%)`, 15, finalY + 39);
    
    // Gráfico simples de pizza (texto)
    doc.text('Distribuição de Custos:', 15, finalY + 50);
    doc.text(`• Impostos: ${((impostos / receitas) * 100).toFixed(1)}%`, 15, finalY + 57);
    doc.text(`• Despesas Operacionais: ${((despesasOperacionais / receitas) * 100).toFixed(1)}%`, 15, finalY + 64);
    doc.text(`• Despesas de Staff: ${((despesasStaff / receitas) * 100).toFixed(1)}%`, 15, finalY + 71);
    doc.text(`• Lucro: ${((lucroLiquido / receitas) * 100).toFixed(1)}%`, 15, finalY + 78);
    
    this.addFooter(doc, 1);
    await this.savePDFWithDialog(doc, 'relatorio-financeiro-master.pdf');
  }

  static async exportMapaDespesas(
    expenses: Expense[], 
    employees: Employee[], 
    options: PDFExportOptions
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.addHeader(doc, options.settings, 'Mapa de Despesas Detalhado');
    
    // Filtrar despesas por data
    const filteredExpenses = this.filterExpensesByDate(expenses, options.startDate, options.endDate);
    
    // Agrupar despesas por categoria
    const despesasPorCategoria = new Map();
    
    filteredExpenses.forEach(expense => {
      const category = expense.category || this.categorizeExpense(expense.description);
      const amount = expense.amount_kz || expense.amount || 0;
      
      if (!despesasPorCategoria.has(category)) {
        despesasPorCategoria.set(category, { total: 0, items: [] });
      }
      
      despesasPorCategoria.get(category).total += amount;
      despesasPorCategoria.get(category).items.push({
        description: expense.description,
        amount: amount,
        date: expense.created_at || expense.date
      });
    });
    
    // Adicionar staff como categoria
    const staffAtivos = employees.filter(emp => emp.status === 'ATIVO');
    if (staffAtivos.length > 0) {
      const totalStaff = staffAtivos.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      despesasPorCategoria.set('Staff', {
        total: totalStaff,
        items: staffAtivos.map(emp => ({
          description: `Salário - ${emp.name}`,
          amount: emp.salary || 0,
          date: new Date().toISOString()
        }))
      });
    }
    
    // Tabela resumo por categoria
    const categoriasArray = Array.from(despesasPorCategoria.entries())
      .map(([category, data]) => [category, `AOA ${data.total.toFixed(2)}`])
      .sort((a, b) => parseFloat(b[1].replace('AOA ', '')) - parseFloat(a[1].replace('AOA ', '')));
    
    autoTable(doc, {
      head: [['Categoria', 'Total']],
      body: categoriasArray,
      startY: yPosition + 10,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [155, 89, 182] }
    });
    
    // Detalhamento por categoria (em nova página se necessário)
    let currentY = (doc as any).lastAutoTable.finalY || 150;
    
    despesasPorCategoria.forEach((data, category) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${category}: AOA ${data.total.toFixed(2)}`, 15, currentY + 10);
      currentY += 15;
      
      data.items.forEach(item => {
        doc.setFontSize(8);
        doc.text(`  • ${item.description}: AOA ${item.amount.toFixed(2)}`, 20, currentY + 5);
        currentY += 8;
      });
      
      currentY += 5;
    });
    
    this.addFooter(doc, doc.getNumberOfPages());
    await this.savePDFWithDialog(doc, 'mapa-despesas.pdf');
  }

  // Métodos auxiliares
  private static filterOrdersByDate(orders: Order[], startDate?: string, endDate?: string): Order[] {
    if (!startDate && !endDate) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at || order.date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-12-31');
      
      return orderDate >= start && orderDate <= end;
    });
  }

  private static filterExpensesByDate(expenses: Expense[], startDate?: string, endDate?: string): Expense[] {
    if (!startDate && !endDate) return expenses;
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.created_at || expense.date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-12-31');
      
      return expenseDate >= start && expenseDate <= end;
    });
  }

  private static categorizeExpense(description?: string): string {
    if (!description) return 'Outras';
    
    const desc = description.toLowerCase();
    
    if (desc.includes('salário') || desc.includes('staff') || desc.includes('funcionário')) {
      return 'Staff';
    } else if (desc.includes('comida') || desc.includes('bebida') || desc.includes('insumo') || desc.includes('ingredient')) {
      return 'Insumos';
    } else if (desc.includes('aluguel') || desc.includes('renda')) {
      return 'Aluguel';
    } else if (desc.includes('luz') || desc.includes('electricidade') || desc.includes('água') || desc.includes('gás')) {
      return 'Utilidades';
    } else if (desc.includes('internet') || desc.includes('telefone') || desc.includes('comunicação')) {
      return 'Comunicações';
    } else if (desc.includes('limpeza') || desc.includes('higiene')) {
      return 'Limpeza';
    } else if (desc.includes('manutenção') || desc.includes('reparo')) {
      return 'Manutenção';
    } else if (desc.includes('marketing') || desc.includes('publicidade') || desc.includes('promoção')) {
      return 'Marketing';
    } else if (desc.includes('transporte') || desc.includes('combustível') || desc.includes('viagem')) {
      return 'Transporte';
    } else if (desc.includes('seguro') || desc.includes('segurança')) {
      return 'Seguros';
    } else if (desc.includes('imposto') || desc.includes('taxa') || desc.includes('licença')) {
      return 'Impostos e Taxas';
    } else {
      return 'Outras';
    }
  }
}
