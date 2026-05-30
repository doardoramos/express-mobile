import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Ordem, Perfil } from "@/types";

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export async function gerarPDF(ordem: Ordem, perfil: Perfil): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();

  // ── Paleta
  const DARK = [15, 15, 22] as [number, number, number];
  const GREEN = [34, 197, 94] as [number, number, number];
  const GRAY = [120, 120, 140] as [number, number, number];
  const LIGHT = [245, 245, 250] as [number, number, number];

  // ── Fundo do cabeçalho
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 45, "F");

  // ── Barra verde lateral esquerda no header
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, 4, 45, "F");

  // ── Nome da empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(perfil.nome || "Prestador", 14, 18);

  // ── Contato
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  if (perfil.telefone) doc.text(`📞 ${perfil.telefone}`, 14, 26);
  if (perfil.chave_pix) doc.text(`PIX: ${perfil.chave_pix}`, 14, 32);

  // ── Número e data da OS (canto direito)
  doc.setTextColor(...GREEN);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`OS #${String(ordem.numero).padStart(4, "0")}`, W - 14, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(
    format(new Date(ordem.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    W - 14,
    26,
    { align: "right" }
  );

  // ── Status badge
  const statusMap: Record<string, string> = {
    em_aberto: "EM ABERTO",
    aprovado: "APROVADO",
    concluido: "CONCLUÍDO",
    pago: "PAGO",
  };
  doc.setFillColor(...GREEN);
  doc.roundedRect(W - 44, 30, 30, 8, 2, 2, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(statusMap[ordem.status] || ordem.status.toUpperCase(), W - 29, 35.5, { align: "center" });

  // ── Seção: Dados do Cliente
  let y = 55;
  doc.setFillColor(...LIGHT);
  doc.rect(10, y, W - 20, 28, "F");
  doc.setDrawColor(...GREEN);
  doc.rect(10, y, 2, 28, "F");

  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", 16, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(ordem.clientes?.nome || "—", 16, y + 15);
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  if (ordem.clientes?.whatsapp) doc.text(`WhatsApp: ${ordem.clientes.whatsapp}`, 16, y + 22);
  if (ordem.clientes?.endereco) doc.text(ordem.clientes.endereco, 100, y + 22);

  y += 36;

  // ── Descrição (se houver)
  if (ordem.descricao) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(`Obs: ${ordem.descricao}`, W - 20);
    doc.text(lines, 10, y);
    y += lines.length * 5 + 4;
  }

  // ── Tabela de itens
  const rows = (ordem.itens_ordem || []).map((item) => [
    item.nome,
    String(item.quantidade),
    formatBRL(item.valor_unit),
    formatBRL(item.subtotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["SERVIÇO / PRODUTO", "QTD", "VALOR UNIT.", "SUBTOTAL"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 32 },
    },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // ── Total
  doc.setFillColor(...DARK);
  doc.rect(W - 75, finalY, 65, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL", W - 70, finalY + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text(formatBRL(ordem.total), W - 12, finalY + 10, { align: "right" });

  // ── Pagamento (Pix)
  if (perfil.chave_pix) {
    const pixY = finalY + 22;
    doc.setFillColor(...LIGHT);
    doc.rect(10, pixY, W - 20, 20, "F");
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("💳 PAGAMENTO VIA PIX", 16, pixY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(perfil.chave_pix, 16, pixY + 14);
  }

  // ── Rodapé
  const rodapeY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(...LIGHT);
  doc.line(10, rodapeY - 4, W - 10, rodapeY - 4);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Gerado com OS Express", 10, rodapeY);
  doc.text(
    format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
    W - 10,
    rodapeY,
    { align: "right" }
  );

  return doc.output("blob");
}

export function buildWhatsAppUrl(
  whatsapp: string,
  clienteNome: string,
  numeroOS: number,
  linkOS: string
): string {
  const phone = whatsapp.replace(/\D/g, "");
  const mensagem = `Olá ${clienteNome}! 👋\n\nSegue o link da sua Ordem de Serviço *OS #${String(numeroOS).padStart(4, "0")}*:\n\n🔗 ${linkOS}\n\nQualquer dúvida, estou à disposição!`;
  return `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(mensagem)}`;
}
