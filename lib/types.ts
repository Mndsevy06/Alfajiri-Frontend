export type Site = 'zambie' | 'lubumbashi' | 'sabri' | 'frontiere';

export type SiteInfo = {
  id: Site;
  label: string;
  short: string;
  color: string;
};

export type Dossier = {
  id: string;
  raisonSociale: string;
  sigle: string;
  statutJuridique: string;
  rccm: string;
  idNat: string;
  nImpot: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string;
  logo?: string;
  devise: string;
  exerciceEnCours: string;
  dateDebut: string;
  dateFin: string;
};

export type CompteComptable = {
  numero: string;
  libelle: string;
  classe: string;
  type: 'general' | 'auxiliaire';
  parent?: string;
  lettable: boolean;
  tiers?: {
    code: string;
    nom: string;
    type: 'fournisseur' | 'client' | 'personnel' | 'etat' | 'associe';
  };
  soldeDebit: number;
  soldeCredit: number;
};

export type LigneEcriture = {
  id: string;
  date: string;
  compte: string;
  libelleCompte: string;
  libelle: string;
  debit: number;
  credit: number;
  auxiliaire?: string;
  piece?: string;
};

export type Ecriture = {
  id: string;
  numero: string;
  journal: JournalCode;
  date: string;
  libelle: string;
  lignes: LigneEcriture[];
  statut: 'brouillard' | 'valide';
  saisiePar: string;
  validePar?: string;
  piece?: string;
};

export type JournalCode = 'ACH' | 'VTE' | 'CAI' | 'BQ' | 'OD' | 'FISC';

export type Journal = {
  code: JournalCode;
  libelle: string;
  type: 'achats' | 'ventes' | 'caisse' | 'banque' | 'od';
  site: Site;
  dernierNumero: number;
};

export type Camion = {
  id: string;
  immat: string;
  chauffeur: string;
  transporteur: string;
  chargement: number;
  statut: 'chargement' | 'transit_zambie' | 'douane_zambie' | 'douane_rdc' | 'transit_rdc' | 'arrive_sabri' | 'decharge';
  dateDepart: string;
  dateArrivee?: string;
  position: string;
  progression: number;
  bl: string;
  factureTransport: number;
  douaneMontant: number;
};

export type Tiers = {
  code: string;
  nom: string;
  type: 'fournisseur' | 'client' | 'personnel' | 'etat' | 'associe';
  compte: string;
  soldeDebit: number;
  soldeCredit: number;
  balanceAgee: { periode: string; montant: number }[];
};

export type Facture = {
  id: string;
  numero: string;
  date: string;
  client: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: 'impayee' | 'payee' | 'partielle';
  echeance: string;
};

export type Immobilisation = {
  id: string;
  code: string;
  libelle: string;
  categorie: string;
  dateAcquisition: string;
  valeurAcquisition: number;
  duree: number;
  methode: 'lineaire' | 'degressive';
  cumulAmortissement: number;
  vnc: number;
  dotationAnnuelle: number;
  site: Site;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  utilisateur: string;
  role: string;
  ip: string;
  terminal: string;
  action: string;
  module: string;
  objet: string;
  avant?: string;
  apres?: string;
};

export type KPI = {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  evolution: number;
  icon: string;
  color: string;
};

export type LigneReleve = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  sens: 'debit' | 'credit';
  pointe: boolean;
};

export type LigneCompta = {
  id: string;
  date: string;
  libelle: string;
  compte: string;
  montant: number;
  sens: 'debit' | 'credit';
  pointe: boolean;
};

export type Parametre = {
  id: string;
  cle: string;
  valeur: string;
  categorie: 'apparence' | 'finance' | 'localisation' | 'notifications' | 'systeme' | 'ia' | 'securite';
  typeValeur: 'string' | 'boolean' | 'number' | 'json';
  utilisateur_id?: string;
  description: string;
};
