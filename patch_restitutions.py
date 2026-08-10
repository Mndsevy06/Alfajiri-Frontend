import re
import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add Imports
    if "import * as XLSX from 'xlsx'" not in content:
        imports_to_add = """
import { Switch } from '@/components/ui/switch';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
"""
        content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\n" + imports_to_add)
    
    if "Settings," not in content and "Settings } from 'lucide-react'" not in content:
        content = content.replace("AlignJustify", "AlignJustify,\n  Settings")

    # 2. Add preferences to RestitutionsPage
    if "const [preferences, setPreferences] = useState<any>({});" not in content:
        prefs_code = """
  const [preferences, setPreferences] = useState<any>({});

  const loadPreferences = async () => {
    try {
      const data = await fetchWithAuth('/users/me/');
      const prefs = data.preferences || {};
      setPreferences(prefs);
    } catch (error) {
      console.error('Erreur lors du chargement des préférences utilisateur', error);
    }
  };

  const handleTogglePreference = async (key: string, value: any, showToast = true) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);
      
      await fetchWithAuth('/users/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPrefs }),
      });
      
      if (showToast) {
        toast.success('Préférence mise à jour');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Erreur lors de la sauvegarde de la préférence');
      }
    }
  };
"""
        content = content.replace("const [layoutMode, setLayoutMode] = useState<'modern' | 'table' | 'compact'>('modern');", "const [layoutMode, setLayoutMode] = useState<'modern' | 'table' | 'compact'>('modern');\n" + prefs_code)
    
    # Update init() in RestitutionsPage
    if "loadPreferences();" not in content:
        content = content.replace("await fetchData();", "await fetchData();\n      await loadPreferences();")

    # 3. Update BalanceView signature and props passing
    content = content.replace(
        "layoutModeToggle={<LayoutModeToggle />} layoutMode={layoutMode}",
        "layoutModeToggle={<LayoutModeToggle />} layoutMode={layoutMode} preferences={preferences} handleTogglePreference={handleTogglePreference}"
    )

    content = content.replace(
        "onApplyFilters: () => void; layoutModeToggle?: React.ReactNode; layoutMode?: string }) {",
        "onApplyFilters: () => void; layoutModeToggle?: React.ReactNode; layoutMode?: string; preferences?: any; handleTogglePreference?: (k: string, v: any) => void }) {"
    )

    # 4. Inject Export Functions and Popover in BalanceView
    # Replace the old export dropdown with the new Configuration + Export
    old_balance_export = """          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Exporter">
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background border-[var(--border-default)]/50 shadow-md">
              <DropdownMenuItem onClick={() => toast.success('Export PDF généré')} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Export Excel généré')} className="cursor-pointer">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>"""
    
    new_balance_export = """
          <Popover>
            <PopoverTrigger asChild>
              <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Configuration de l'affichage">
                <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 bg-background border border-border/50 shadow-md rounded-lg flex flex-col gap-4 z-50">
              <div className="flex flex-col gap-1 border-b pb-2">
                <h4 className="font-semibold text-xs text-foreground">Options d'affichage</h4>
                <p className="text-[10px] text-muted-foreground">Personnalisez les colonnes affichées dans la Balance.</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'showBalCompte', label: 'N° Compte' },
                  { id: 'showBalLibelle', label: 'Libellé' },
                  { id: 'showBalAfs', label: 'Code AFS' },
                  { id: 'showBalOuvDebit', label: 'S. Ouv. Débit' },
                  { id: 'showBalOuvCredit', label: 'S. Ouv. Crédit' },
                  { id: 'showBalMvtDebit', label: 'Mvt Débit' },
                  { id: 'showBalMvtCredit', label: 'Mvt Crédit' },
                  { id: 'showBalFinDebit', label: 'S. Fin. Débit' },
                  { id: 'showBalFinCredit', label: 'S. Fin. Crédit' }
                ].map(col => (
                  <div key={col.id} className="flex items-center justify-between gap-2">
                    <Label htmlFor={col.id} className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">{col.label}</Label>
                    <Switch
                      id={col.id}
                      checked={preferences?.[col.id] !== false}
                      onCheckedChange={(checked) => handleTogglePreference?.(col.id, checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Exporter">
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background border-[var(--border-default)]/50 shadow-md">
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
"""
    content = content.replace(old_balance_export, new_balance_export)

    # Insert export functions into BalanceView
    balance_exports = """
  const exportToExcel = () => {
    try {
      const activeCols = [
        { id: 'compte', header: 'N° Compte', visible: preferences?.showBalCompte !== false, getVal: (c: any) => c.compte, width: 15 },
        { id: 'libelle', header: 'Libellé', visible: preferences?.showBalLibelle !== false, getVal: (c: any) => c.libelle, width: 40 },
        { id: 'afs', header: 'Code AFS', visible: preferences?.showBalAfs !== false, getVal: (c: any) => c.code_afs || '-', width: 15 },
        { id: 'ouvD', header: 'S. Ouv. Débit', visible: preferences?.showBalOuvDebit !== false, getVal: (c: any) => parseFloat(c.solde_ouv_debit) || 0, width: 15 },
        { id: 'ouvC', header: 'S. Ouv. Crédit', visible: preferences?.showBalOuvCredit !== false, getVal: (c: any) => parseFloat(c.solde_ouv_credit) || 0, width: 15 },
        { id: 'mvtD', header: 'Mvt Débit', visible: preferences?.showBalMvtDebit !== false, getVal: (c: any) => parseFloat(c.debit) || 0, width: 15 },
        { id: 'mvtC', header: 'Mvt Crédit', visible: preferences?.showBalMvtCredit !== false, getVal: (c: any) => parseFloat(c.credit) || 0, width: 15 },
        { id: 'finD', header: 'S. Fin. Débit', visible: preferences?.showBalFinDebit !== false, getVal: (c: any) => parseFloat(c.solde_debit) || 0, width: 15 },
        { id: 'finC', header: 'S. Fin. Crédit', visible: preferences?.showBalFinCredit !== false, getVal: (c: any) => parseFloat(c.solde_credit) || 0, width: 15 }
      ].filter(col => col.visible);

      const dataToExport = filteredBalance.map(c => {
        const row: any = {};
        activeCols.forEach(col => { row[col.header] = col.getVal(c); });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Balance");
      worksheet['!cols'] = activeCols.map(col => ({ wch: col.width }));
      XLSX.writeFile(workbook, "Balance_Comptable.xlsx");
      toast.success('Export Excel réussi');
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('l', 'pt', 'a4');
      doc.setFontSize(18);
      doc.text('Balance Comptable', 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Période : ${periode}`, 40, 60);

      const activeCols = [
        { id: 'compte', header: 'N° Compte', visible: preferences?.showBalCompte !== false, getVal: (c: any) => c.compte, width: 60, align: 'left' },
        { id: 'libelle', header: 'Libellé', visible: preferences?.showBalLibelle !== false, getVal: (c: any) => c.libelle, width: 140, align: 'left' },
        { id: 'afs', header: 'AFS', visible: preferences?.showBalAfs !== false, getVal: (c: any) => c.code_afs || '-', width: 50, align: 'center' },
        { id: 'ouvD', header: 'Ouv. Débit', visible: preferences?.showBalOuvDebit !== false, getVal: (c: any) => parseFloat(c.solde_ouv_debit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_debit)) : '-', width: 80, align: 'right' },
        { id: 'ouvC', header: 'Ouv. Crédit', visible: preferences?.showBalOuvCredit !== false, getVal: (c: any) => parseFloat(c.solde_ouv_credit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_credit)) : '-', width: 80, align: 'right' },
        { id: 'mvtD', header: 'Mvt Débit', visible: preferences?.showBalMvtDebit !== false, getVal: (c: any) => parseFloat(c.debit) > 0 ? formatCurrency(parseFloat(c.debit)) : '-', width: 80, align: 'right' },
        { id: 'mvtC', header: 'Mvt Crédit', visible: preferences?.showBalMvtCredit !== false, getVal: (c: any) => parseFloat(c.credit) > 0 ? formatCurrency(parseFloat(c.credit)) : '-', width: 80, align: 'right' },
        { id: 'finD', header: 'Fin. Débit', visible: preferences?.showBalFinDebit !== false, getVal: (c: any) => parseFloat(c.solde_debit) > 0 ? formatCurrency(parseFloat(c.solde_debit)) : '-', width: 80, align: 'right' },
        { id: 'finC', header: 'Fin. Crédit', visible: preferences?.showBalFinCredit !== false, getVal: (c: any) => parseFloat(c.solde_credit) > 0 ? formatCurrency(parseFloat(c.solde_credit)) : '-', width: 80, align: 'right' }
      ].filter(col => col.visible);

      const tableHeaders = [activeCols.map(col => col.header)];
      const tableData = filteredBalance.map(c => activeCols.map(col => col.getVal(c)));
      
      const columnStyles: any = {};
      activeCols.forEach((col, idx) => { columnStyles[idx] = { cellWidth: col.width, halign: col.align }; });

      autoTable(doc, {
        startY: 80,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: columnStyles,
      });

      doc.save("Balance_Comptable.pdf");
      toast.success('Export PDF réussi');
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };
"""
    content = content.replace("const [filterClass, setFilterClass] = useState('all');", "const [filterClass, setFilterClass] = useState('all');\n" + balance_exports)

    # 5. GrandLivreView Export and Popover
    old_gl_export = """          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Exporter">
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background border-[var(--border-default)]/50 shadow-md">
              <DropdownMenuItem onClick={() => toast.success('Export PDF généré')} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Export Excel généré')} className="cursor-pointer">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>"""
    
    new_gl_export = """
          <Popover>
            <PopoverTrigger asChild>
              <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Configuration de l'affichage">
                <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 bg-background border border-border/50 shadow-md rounded-lg flex flex-col gap-4 z-50 h-[400px] overflow-y-auto">
              <div className="flex flex-col gap-1 border-b pb-2">
                <h4 className="font-semibold text-xs text-foreground">Options d'affichage</h4>
                <p className="text-[10px] text-muted-foreground">Personnalisez les colonnes affichées dans le Grand Livre.</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'showGlDate', label: 'Date Compta.' },
                  { id: 'showGlJournal', label: 'Journal' },
                  { id: 'showGlBatch', label: 'Batch N°' },
                  { id: 'showGlFacture', label: 'N° Facture' },
                  { id: 'showGlAfs', label: 'AFS' },
                  { id: 'showGlLibelle', label: 'Libellé' },
                  { id: 'showGlTiers', label: 'Tiers' },
                  { id: 'showGlDevise', label: 'Devise' },
                  { id: 'showGlMontantOrig', label: 'Montant Orig.' },
                  { id: 'showGlTaux', label: 'Taux' },
                  { id: 'showGlDateSaisie', label: 'Date Saisie' },
                  { id: 'showGlDebit', label: 'Débit' },
                  { id: 'showGlCredit', label: 'Crédit' }
                ].map(col => (
                  <div key={col.id} className="flex items-center justify-between gap-2">
                    <Label htmlFor={col.id} className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">{col.label}</Label>
                    <Switch
                      id={col.id}
                      checked={preferences?.[col.id] !== false}
                      onCheckedChange={(checked) => handleTogglePreference?.(col.id, checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Exporter">
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background border-[var(--border-default)]/50 shadow-md">
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
"""
    content = content.replace(old_gl_export, new_gl_export)

    gl_exports = """
  const exportToExcel = () => {
    try {
      const activeCols = [
        { id: 'date', header: 'Date', visible: preferences?.showGlDate !== false, getVal: (l: any) => formatDate(l.date), width: 12 },
        { id: 'journal', header: 'Journal', visible: preferences?.showGlJournal !== false, getVal: (l: any) => l.journal__code, width: 10 },
        { id: 'batch', header: 'Batch', visible: preferences?.showGlBatch !== false, getVal: (l: any) => l.numero_piece || '-', width: 15 },
        { id: 'facture', header: 'Facture', visible: preferences?.showGlFacture !== false, getVal: (l: any) => l.numero_facture || '-', width: 15 },
        { id: 'afs', header: 'AFS', visible: preferences?.showGlAfs !== false, getVal: (l: any) => l.code_afs || '-', width: 10 },
        { id: 'libelle', header: 'Libellé', visible: preferences?.showGlLibelle !== false, getVal: (l: any) => l.libelle, width: 40 },
        { id: 'tiers', header: 'Tiers', visible: preferences?.showGlTiers !== false, getVal: (l: any) => l.tiers_nom || '-', width: 25 },
        { id: 'devise', header: 'Devise', visible: preferences?.showGlDevise !== false, getVal: (l: any) => l.devise || '-', width: 10 },
        { id: 'montant_orig', header: 'Montant Orig.', visible: preferences?.showGlMontantOrig !== false, getVal: (l: any) => parseFloat(l.montant_devise) || 0, width: 15 },
        { id: 'taux', header: 'Taux', visible: preferences?.showGlTaux !== false, getVal: (l: any) => parseFloat(l.taux_change) || 1, width: 10 },
        { id: 'date_saisie', header: 'Date Saisie', visible: preferences?.showGlDateSaisie !== false, getVal: (l: any) => formatDate(l.date_saisie), width: 12 },
        { id: 'debit', header: 'Débit', visible: preferences?.showGlDebit !== false, getVal: (l: any) => parseFloat(l.debit) || 0, width: 15 },
        { id: 'credit', header: 'Crédit', visible: preferences?.showGlCredit !== false, getVal: (l: any) => parseFloat(l.credit) || 0, width: 15 }
      ].filter(col => col.visible);

      const dataToExport = filteredEcritures.map(l => {
        const row: any = {};
        activeCols.forEach(col => { row[col.header] = col.getVal(l); });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grand Livre");
      worksheet['!cols'] = activeCols.map(col => ({ wch: col.width }));
      XLSX.writeFile(workbook, `Grand_Livre_${compteData?.compte || 'Export'}.xlsx`);
      toast.success('Export Excel réussi');
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('l', 'pt', 'a4');
      doc.setFontSize(18);
      doc.text(`Grand Livre - Compte ${compteData?.compte || ''}`, 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Intitulé : ${compteData?.libelle || ''} | Période : ${periode}`, 40, 60);

      const activeCols = [
        { id: 'date', header: 'Date', visible: preferences?.showGlDate !== false, getVal: (l: any) => formatDate(l.date), width: 50, align: 'center' },
        { id: 'journal', header: 'Jrn', visible: preferences?.showGlJournal !== false, getVal: (l: any) => l.journal__code, width: 40, align: 'center' },
        { id: 'batch', header: 'Batch', visible: preferences?.showGlBatch !== false, getVal: (l: any) => l.numero_piece || '-', width: 50, align: 'center' },
        { id: 'facture', header: 'Facture', visible: preferences?.showGlFacture !== false, getVal: (l: any) => l.numero_facture || '-', width: 50, align: 'center' },
        { id: 'afs', header: 'AFS', visible: preferences?.showGlAfs !== false, getVal: (l: any) => l.code_afs || '-', width: 40, align: 'center' },
        { id: 'libelle', header: 'Libellé', visible: preferences?.showGlLibelle !== false, getVal: (l: any) => l.libelle, width: 120, align: 'left' },
        { id: 'tiers', header: 'Tiers', visible: preferences?.showGlTiers !== false, getVal: (l: any) => l.tiers_nom || '-', width: 90, align: 'left' },
        { id: 'devise', header: 'Dev', visible: preferences?.showGlDevise !== false, getVal: (l: any) => l.devise || '-', width: 30, align: 'center' },
        { id: 'montant_orig', header: 'M. Orig.', visible: preferences?.showGlMontantOrig !== false, getVal: (l: any) => parseFloat(l.montant_devise) ? formatCurrency(parseFloat(l.montant_devise)) : '-', width: 60, align: 'right' },
        { id: 'taux', header: 'Taux', visible: preferences?.showGlTaux !== false, getVal: (l: any) => parseFloat(l.taux_change) || 1, width: 30, align: 'right' },
        { id: 'date_saisie', header: 'Saisie', visible: preferences?.showGlDateSaisie !== false, getVal: (l: any) => formatDate(l.date_saisie), width: 50, align: 'center' },
        { id: 'debit', header: 'Débit', visible: preferences?.showGlDebit !== false, getVal: (l: any) => parseFloat(l.debit) > 0 ? formatCurrency(parseFloat(l.debit)) : '-', width: 65, align: 'right' },
        { id: 'credit', header: 'Crédit', visible: preferences?.showGlCredit !== false, getVal: (l: any) => parseFloat(l.credit) > 0 ? formatCurrency(parseFloat(l.credit)) : '-', width: 65, align: 'right' }
      ].filter(col => col.visible);

      const tableHeaders = [activeCols.map(col => col.header)];
      const tableData = filteredEcritures.map(l => activeCols.map(col => col.getVal(l)));
      
      const columnStyles: any = {};
      activeCols.forEach((col, idx) => { columnStyles[idx] = { cellWidth: col.width, halign: col.align }; });

      autoTable(doc, {
        startY: 80,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 3 },
        columnStyles: columnStyles,
      });

      doc.save(`Grand_Livre_${compteData?.compte || 'Export'}.pdf`);
      toast.success('Export PDF réussi');
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };
"""
    content = content.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n" + gl_exports)

    # 6. Apply conditional rendering to BalanceView columns using regex
    # Columns map to index: 1-9
    bal_cols = [
      "showBalCompte", "showBalLibelle", "showBalAfs", "showBalOuvDebit", "showBalOuvCredit",
      "showBalMvtDebit", "showBalMvtCredit", "showBalFinDebit", "showBalFinCredit"
    ]
    # For TableHead
    for i, pref in enumerate(bal_cols):
        # Find the (i+1)th TableHead inside BalanceView TableHeader
        # Actually it's easier to replace them explicitly since the strings are unique
        pass # I will do it with explicit strings below

    # BalanceView Headers
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-left whitespace-nowrap px-2 py-2 font-semibold", true)}>N° Compte</TableHead>', '{preferences?.showBalCompte !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-left whitespace-nowrap px-2 py-2 font-semibold", true)}>N° Compte</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-left whitespace-nowrap px-2 py-2 font-semibold", true)}>Libellé</TableHead>', '{preferences?.showBalLibelle !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-left whitespace-nowrap px-2 py-2 font-semibold", true)}>Libellé</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center whitespace-nowrap px-2 py-2 font-semibold", true)}>Code AFS</TableHead>', '{preferences?.showBalAfs !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center whitespace-nowrap px-2 py-2 font-semibold", true)}>Code AFS</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Ouv. Débit</TableHead>', '{preferences?.showBalOuvDebit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Ouv. Débit</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Ouv. Crédit</TableHead>', '{preferences?.showBalOuvCredit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Ouv. Crédit</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>Mvt Débit</TableHead>', '{preferences?.showBalMvtDebit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>Mvt Débit</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>Mvt Crédit</TableHead>', '{preferences?.showBalMvtCredit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>Mvt Crédit</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Fin. Débit</TableHead>', '{preferences?.showBalFinDebit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Fin. Débit</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Fin. Crédit</TableHead>', '{preferences?.showBalFinCredit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right whitespace-nowrap px-2 py-2 font-semibold", true)}>S. Fin. Crédit</TableHead>}')

    # BalanceView Cells
    content = content.replace(
      '<TableCell className={getCellClass(layoutMode || "modern", "text-left font-mono whitespace-nowrap px-2 py-1.5")}>\n                      <Badge variant="secondary" className={cn("font-mono shadow-sm text-[10px] sm:text-xs px-1.5", isAnomalie ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background border-[var(--border-default)]/50")}>{c.compte}</Badge>\n                    </TableCell>',
      '{preferences?.showBalCompte !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-left font-mono whitespace-nowrap px-2 py-1.5")}>\n                      <Badge variant="secondary" className={cn("font-mono shadow-sm text-[10px] sm:text-xs px-1.5", isAnomalie ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background border-[var(--border-default)]/50")}>{c.compte}</Badge>\n                    </TableCell>}'
    )
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-left font-medium truncate max-w-[150px] sm:max-w-[250px] px-2 py-1.5")} title={c.libelle}>{c.libelle}</TableCell>', '{preferences?.showBalLibelle !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-left font-medium truncate max-w-[150px] sm:max-w-[250px] px-2 py-1.5")} title={c.libelle}>{c.libelle}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center px-2 py-1.5")}>\n                      {c.code_afs ? <Badge variant="outline" className="font-mono text-[10px] font-bold">{c.code_afs}</Badge> : <span className="text-muted-foreground/40">-</span>}\n                    </TableCell>', '{preferences?.showBalAfs !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center px-2 py-1.5")}>\n                      {c.code_afs ? <Badge variant="outline" className="font-mono text-[10px] font-bold">{c.code_afs}</Badge> : <span className="text-muted-foreground/40">-</span>}\n                    </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-muted-foreground/80 whitespace-nowrap px-2 py-1.5")}>{parseFloat(c.solde_ouv_debit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_debit)) : \'-\'}</TableCell>', '{preferences?.showBalOuvDebit !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-muted-foreground/80 whitespace-nowrap px-2 py-1.5")}>{parseFloat(c.solde_ouv_debit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_debit)) : \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-muted-foreground/80 whitespace-nowrap px-2 py-1.5")}>{parseFloat(c.solde_ouv_credit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_credit)) : \'-\'}</TableCell>', '{preferences?.showBalOuvCredit !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-muted-foreground/80 whitespace-nowrap px-2 py-1.5")}>{parseFloat(c.solde_ouv_credit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_credit)) : \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-foreground/90 whitespace-nowrap px-2 py-1.5")}>{debit > 0 ? formatCurrency(debit) : \'-\'}</TableCell>', '{preferences?.showBalMvtDebit !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-foreground/90 whitespace-nowrap px-2 py-1.5")}>{debit > 0 ? formatCurrency(debit) : \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-foreground/90 whitespace-nowrap px-2 py-1.5")}>{credit > 0 ? formatCurrency(credit) : \'-\'}</TableCell>', '{preferences?.showBalMvtCredit !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-foreground/90 whitespace-nowrap px-2 py-1.5")}>{credit > 0 ? formatCurrency(credit) : \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={cn(getCellClass(layoutMode || "modern", "text-right font-mono font-bold whitespace-nowrap px-2 py-1.5"), isAnomalie && soldeD > 0 ? "text-destructive" : "text-indigo-400")}>{soldeD > 0 ? formatCurrency(soldeD) : \'-\'}</TableCell>', '{preferences?.showBalFinDebit !== false && <TableCell className={cn(getCellClass(layoutMode || "modern", "text-right font-mono font-bold whitespace-nowrap px-2 py-1.5"), isAnomalie && soldeD > 0 ? "text-destructive" : "text-indigo-400")}>{soldeD > 0 ? formatCurrency(soldeD) : \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={cn(getCellClass(layoutMode || "modern", "text-right font-mono font-bold whitespace-nowrap px-2 py-1.5"), isAnomalie && soldeC > 0 ? "text-destructive" : "text-indigo-400")}>{soldeC > 0 ? formatCurrency(soldeC) : \'-\'}</TableCell>', '{preferences?.showBalFinCredit !== false && <TableCell className={cn(getCellClass(layoutMode || "modern", "text-right font-mono font-bold whitespace-nowrap px-2 py-1.5"), isAnomalie && soldeC > 0 ? "text-destructive" : "text-indigo-400")}>{soldeC > 0 ? formatCurrency(soldeC) : \'-\'}</TableCell>}')

    # GrandLivreView Headers
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[6%]", true)}>Date Compta.</TableHead>', '{preferences?.showGlDate !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[6%]", true)}>Date Compta.</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[5%]", true)}>Journal</TableHead>', '{preferences?.showGlJournal !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[5%]", true)}>Journal</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[7%]", true)}>Batch N°</TableHead>', '{preferences?.showGlBatch !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[7%]", true)}>Batch N°</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[6%]", true)}>N° Facture</TableHead>', '{preferences?.showGlFacture !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[6%]", true)}>N° Facture</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[4%]", true)}>AFS</TableHead>', '{preferences?.showGlAfs !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[4%]", true)}>AFS</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-left w-[16%]", true)}>Libellé</TableHead>', '{preferences?.showGlLibelle !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-left w-[16%]", true)}>Libellé</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-left w-[12%]", true)}>Tiers / Adresse</TableHead>', '{preferences?.showGlTiers !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-left w-[12%]", true)}>Tiers / Adresse</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[5%]", true)}>Devise</TableHead>', '{preferences?.showGlDevise !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[5%]", true)}>Devise</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right w-[7%]", true)}>Montant Orig.</TableHead>', '{preferences?.showGlMontantOrig !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right w-[7%]", true)}>Montant Orig.</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right w-[5%]", true)}>Taux</TableHead>', '{preferences?.showGlTaux !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right w-[5%]", true)}>Taux</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-center w-[7%]", true)}>Date Saisie</TableHead>', '{preferences?.showGlDateSaisie !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-center w-[7%]", true)}>Date Saisie</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right w-[6%]", true)}>Débit</TableHead>', '{preferences?.showGlDebit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right w-[6%]", true)}>Débit</TableHead>}')
    content = content.replace('<TableHead className={getCellClass(layoutMode || "modern", "text-right w-[6%]", true)}>Crédit</TableHead>', '{preferences?.showGlCredit !== false && <TableHead className={getCellClass(layoutMode || "modern", "text-right w-[6%]", true)}>Crédit</TableHead>}')

    # GrandLivreView Cells
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center font-mono text-xs text-muted-foreground")}>{formatDate(l.date)}</TableCell>', '{preferences?.showGlDate !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center font-mono text-xs text-muted-foreground")}>{formatDate(l.date)}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            <Badge variant="outline" className="font-mono text-[9px] font-bold text-foreground/80">{l.journal__code}</Badge>\n                          </TableCell>', '{preferences?.showGlJournal !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            <Badge variant="outline" className="font-mono text-[9px] font-bold text-foreground/80">{l.journal__code}</Badge>\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            {l.numero_piece ? <Badge variant="secondary" className="font-mono text-[9px] bg-muted">{l.numero_piece}</Badge> : "-"}\n                          </TableCell>', '{preferences?.showGlBatch !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            {l.numero_piece ? <Badge variant="secondary" className="font-mono text-[9px] bg-muted">{l.numero_piece}</Badge> : "-"}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center font-mono text-xs text-muted-foreground")}>{l.numero_facture || \'-\'}</TableCell>', '{preferences?.showGlFacture !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center font-mono text-xs text-muted-foreground")}>{l.numero_facture || \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            {l.code_afs ? <span className="font-mono text-[9px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">{l.code_afs}</span> : "-"}\n                          </TableCell>', '{preferences?.showGlAfs !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            {l.code_afs ? <span className="font-mono text-[9px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">{l.code_afs}</span> : "-"}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-left font-medium text-xs text-foreground/90 truncate max-w-[120px]")} title={l.libelle}>{l.libelle}</TableCell>', '{preferences?.showGlLibelle !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-left font-medium text-xs text-foreground/90 truncate max-w-[120px]")} title={l.libelle}>{l.libelle}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-left text-xs text-muted-foreground truncate max-w-[100px]")} title={l.tiers_nom || \'\'}>\n                            {l.tiers_nom ? (\n                              <div className="flex flex-col"><span className="font-medium text-foreground/80">{l.tiers_nom}</span>{l.tiers_adresse && <span className="text-[9px] opacity-70 truncate">{l.tiers_adresse}</span>}</div>\n                            ) : \'-\'}\n                          </TableCell>', '{preferences?.showGlTiers !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-left text-xs text-muted-foreground truncate max-w-[100px]")} title={l.tiers_nom || \'\'}>\n                            {l.tiers_nom ? (\n                              <div className="flex flex-col"><span className="font-medium text-foreground/80">{l.tiers_nom}</span>{l.tiers_adresse && <span className="text-[9px] opacity-70 truncate">{l.tiers_adresse}</span>}</div>\n                            ) : \'-\'}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            {l.devise && l.devise !== \'USD\' ? <Badge variant="outline" className="text-[9px]">{l.devise}</Badge> : <span className="text-[10px] text-muted-foreground">USD</span>}\n                          </TableCell>', '{preferences?.showGlDevise !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center")}>\n                            {l.devise && l.devise !== \'USD\' ? <Badge variant="outline" className="text-[9px]">{l.devise}</Badge> : <span className="text-[10px] text-muted-foreground">USD</span>}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono text-xs text-muted-foreground")}>\n                            {parseFloat(l.montant_devise) ? formatCurrency(parseFloat(l.montant_devise)) : "-"}\n                          </TableCell>', '{preferences?.showGlMontantOrig !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono text-xs text-muted-foreground")}>\n                            {parseFloat(l.montant_devise) ? formatCurrency(parseFloat(l.montant_devise)) : "-"}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono text-xs text-muted-foreground")}>\n                            {parseFloat(l.taux_change) && parseFloat(l.taux_change) !== 1 ? parseFloat(l.taux_change).toFixed(2) : "-"}\n                          </TableCell>', '{preferences?.showGlTaux !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono text-xs text-muted-foreground")}>\n                            {parseFloat(l.taux_change) && parseFloat(l.taux_change) !== 1 ? parseFloat(l.taux_change).toFixed(2) : "-"}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-center font-mono text-[10px] text-muted-foreground")}>\n                            {formatDate(l.date_saisie)}\n                          </TableCell>', '{preferences?.showGlDateSaisie !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-center font-mono text-[10px] text-muted-foreground")}>\n                            {formatDate(l.date_saisie)}\n                          </TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-sm text-foreground/90")}>{debit > 0 ? formatCurrency(debit) : \'-\'}</TableCell>', '{preferences?.showGlDebit !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-sm text-foreground/90")}>{debit > 0 ? formatCurrency(debit) : \'-\'}</TableCell>}')
    content = content.replace('<TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-sm text-destructive/90")}>{credit > 0 ? formatCurrency(credit) : \'-\'}</TableCell>', '{preferences?.showGlCredit !== false && <TableCell className={getCellClass(layoutMode || "modern", "text-right font-mono font-medium text-sm text-destructive/90")}>{credit > 0 ? formatCurrency(credit) : \'-\'}</TableCell>}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file(r'c:\Users\DELL\Desktop\Alphajiri\Code\Alfajiri\Frontend\app\(app)\restitutions\page.tsx')
print("Successfully patched page.tsx")
