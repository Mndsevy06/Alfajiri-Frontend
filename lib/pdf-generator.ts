import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';
import { numberToWordsFR } from './number-to-words';
import { Dossier } from './types';

export const generateInvoicePDF = (facture: any, activeEntite?: Dossier | null) => {
  const doc = new jsPDF();

  // Colors
  const primaryColor = [11, 87, 85]; // Dark teal
  const secondaryColor = [100, 100, 100]; // Gray

  // --- Header ---
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${facture.numero}`, 14, 32);
  doc.text(`Date: ${formatDate(facture.date)}`, 14, 37);

  // --- Company Info (Left) ---
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(activeEntite?.raisonSociale || 'ALPHAJIRI S.A.', 14, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(activeEntite?.adresse || '123 Avenue de l\'Indépendance', 14, 55);
  doc.text(`${activeEntite?.ville || 'Kinshasa, Gombe'}${activeEntite?.pays ? `, ${activeEntite.pays}` : ''}`, 14, 60);
  doc.text(activeEntite?.pays || 'RDC', 14, 65);
  doc.text(`RCCM: ${activeEntite?.rccm || 'CD/KIN/RCCM/14-B-4321'}`, 14, 70);
  doc.text(`Id. Nat: ${activeEntite?.idNat || '01-123-N45678Z'}`, 14, 75);
  doc.text(`NIF: ${activeEntite?.nImpot || 'A1234567H'}`, 14, 80);

  // --- Client Info (Right) ---
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Facturé à:', 120, 50);
  
  doc.setFontSize(11);
  doc.text(facture.client?.nom || 'Client Anonyme', 120, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  if (facture.client?.code) {
    doc.text(`Code Client: ${facture.client.code}`, 120, 60);
  }
  doc.text(`Échéance: ${formatDate(facture.echeance)}`, 120, 65);

  // --- Table of Items ---
  // If there are no specific lines in the facture object, we mock one based on totals
  const hasLines = facture.lignes && facture.lignes.length > 0;
  
  const tableData = hasLines 
    ? facture.lignes.map((l: any) => [
        l.designation || 'Article',
        l.quantite || 1,
        formatCurrency(l.prixUnitaire || l.montantHT || 0),
        formatCurrency(l.montantHT || 0)
      ])
    : [
        ['Prestations de services / Vente de marchandises', '1', formatCurrency(facture.montantHT), formatCurrency(facture.montantHT)]
      ];

  autoTable(doc, {
    startY: 95,
    head: [['Désignation', 'Qté', 'Prix Unitaire HT', 'Total HT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });

  // --- Totals Section ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Create a totals table to keep it aligned
  autoTable(doc, {
    startY: finalY,
    margin: { left: 130 },
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', halign: 'right' },
      1: { cellWidth: 35, halign: 'right' },
    },
    body: [
      ['Total HT:', formatCurrency(facture.montantHT)],
      ['TVA:', formatCurrency(facture.tva)],
      ['Total TTC:', formatCurrency(facture.montantTTC)],
    ],
    willDrawCell: (data) => {
      if (data.row.index === 2) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      }
    }
  });

  const totalsFinalY = (doc as any).lastAutoTable.finalY + 15;

  // --- Footer / Notes ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Arrêté la présente facture à la somme de :', 14, totalsFinalY);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  const amountInWords = numberToWordsFR(Number(facture.montantTTC));
  // Capitalize first letter
  const amountInWordsCapitalized = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
  doc.text(`${amountInWordsCapitalized} Francs Congolais.`, 14, totalsFinalY + 6);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const termsY = doc.internal.pageSize.height - 30;
  doc.text('Conditions de paiement : Le paiement est attendu à la date d\'échéance indiquée.', 14, termsY);
  doc.text('En cas de retard de paiement, des pénalités pourront être appliquées selon la loi en vigueur (OHADA).', 14, termsY + 5);
  
  // Footer Border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(14, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 15);

  doc.text('Merci pour votre confiance !', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });

  // Save the PDF
  doc.save(`Facture_${facture.numero}.pdf`);
};
