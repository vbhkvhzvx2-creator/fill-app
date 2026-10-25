# Analisi comparativa Pillar, Reonic e Gestify
Data verifica: 23 ottobre 2026.

## Sintesi
Pillar è un riferimento per gestione economica e operativa della commessa: preventivi/computi, margini, costi, acquisti, rapportini, SAL e documenti.
Reonic è un riferimento per CRM e pipeline, calendario, team, task, checklist, file/note per progetto e assistente WhatsApp che interagisce con i dati.
Gestify è un riferimento particolarmente pertinente per impiantisti italiani: ciclo preventivo-ordine-DDT-fattura, clienti/fornitori, cataloghi e listini, magazzino, commesse, documenti DDT fornitore in PDF, rapportini, pianificazione, schede impianto e fatturazione elettronica nei piani previsti.

## Fonti pubbliche
- Pillar: https://www.pillar.it/ e https://www.pillar.it/preventivi
- Gestify Core: https://www.gestify.it/core/
- Gestify Power e piani: https://www.gestify.it/prezzi-e-versioni/
- Reonic CRM: https://reonic.com/it-it/product/360h/crm/
- Reonic WhatsApp AI: https://reonic.com/it-it/ai-whatsapp/
- Centro assistenza Reonic: https://docs.reonic.com/it
- Supabase pricing: https://supabase.com/pricing
- WhatsApp Business Developer Hub: https://whatsappbusiness.com/developers/developer-hub/

Le pagine ufficiali descrivono capacità commerciali, ma non tutte le feature sono incluse in ogni piano. Controllare il piano e le tariffe vigenti prima di preventivare un costo.

## Funzioni da incorporare nel nostro gestionale

### CRM e richieste
- Pipeline personalizzabile dal primo contatto fino a sopralluogo, preventivo, accettazione, installazione e manutenzione.
- Anagrafiche clienti privati/aziende/condomini, più sedi/impianti e contatti multipli.
- Deduplica per partita IVA/codice fiscale, email, telefono e nome normalizzato.
- Origine lead, assegnatario, priorità, valore stimato, task, prossima azione e motivo di perdita.
- Timeline unificata con note, telefonate, email annotate, WhatsApp, appuntamenti, file e documenti.
- Vista “da rispondere oggi” e “preventivi in attesa” per non perdere richieste.

### Preventivi e ciclo di vendita
- Catalogo prodotti/servizi e manodopera con SKU, unità, costo interno, prezzo al cliente, aliquota IVA e categoria.
- Prezzi speciali per cliente e articoli composti (macro-articoli).
- Preventivi multilivello: capitoli, sottocapitoli, righe, sconti, costi, IVA, totali, margine interno.
- Versioni immutabili, storico invio, scadenza, stato accettato/rifiutato/sostituito, PDF stampabile.
- Accettazione tracciata e conversione idempotente in commessa; niente doppia commessa da doppio click.

### Cantieri, interventi e rapportini
- Fascicolo unico con cliente, sede, preventivo accettato, ordini, task, checklist, materiali, costi, foto, documenti, ore e SAL.
- Pianificazione per addetto, calendario giornaliero e reminder pronti per invio.
- Rapportini da mobile con ore, attività, materiali, foto prima/dopo, esito e firma/ricevuta se prevista.
- Schede impianto con marca/modello/seriale, data installazione, garanzia, manuali e prossima manutenzione.
- Stima versus consuntivo: ore e materiali non sovrascrivono i valori preventivati.
- Chiusura con checklist tecnica, documenti da consegnare e task fatturazione.
- Storico dei cantieri chiusi consultabile; riapertura esplicita e motivata oppure nuovo intervento collegato al lavoro originario.

### DDT, acquisti e magazzino (lezione principale da Gestify)
- Distinguere DDT in ingresso del fornitore da DDT/prelievo in uscita verso il cliente/cantiere.
- Ricevimento parziale o totale collegato a ordine d'acquisto, originale allegato e quantità realmente ricevute.
- Import iniziale via CSV e PDF digitale con revisione manuale: nessun aggiornamento stock prima della convalida delle righe.
- Catalogo con prezzi di acquisto e vendita, ricarichi, listini, prezzi cliente, lotti, matricole e depositi quando servono.
- Registro movimenti stock append-only: acquisto, consumo in commessa, reso da cantiere, reso fornitore, rettifica, trasferimento.
- Soglia minima, materiale riservato per commessa, richiesta di acquisto, confronto offerte fornitore, ordine e ricevimento.
- DDT in uscita con destinatario, indirizzo, causale, date, righe, quantità, colli/vettore ove applicabile e prova di consegna. Validare i requisiti documentali con il commercialista.

### Amministrazione
- Fatture con righe snapshot, scadenze, pagamenti parziali, acconti, saldi e note credito/storni tracciati.
- Scadenzario, solleciti proposti, prima nota e cashflow.
- Costi diretti per commessa, fatture passive e spese con riferimento alla fonte per evitare doppio conteggio.
- SAL collegati alle righe contrattuali della versione accettata.
- Il PDF gestionale non equivale a fattura elettronica XML FatturaPA inviata/ricevuta via SDI: scegliere un provider idoneo, verificare i costi e convalidare il processo col commercialista.

### WhatsApp, email e automazioni
- Fase gratuita: link wa.me, testi modello editabili, log manuale e follow-up. Il link non legge le chat private e non prova che il messaggio sia stato inviato.
- Fase API: WhatsApp Business Platform, endpoint HTTPS, verifica firma, secret server-side, deduplica webhook, stati consegna, retry, privacy/retention e tariffe attuali da verificare. Non promettere API o AI gratis.
- Email/Calendar: partire con timeline manuale e export ICS/CSV; integrare provider solo dopo valutazione delle quote e permessi.
- Eventi: lead nuovo crea task; preventivo inviato crea follow-up; accettazione crea commessa; intervento approvato consuntiva costi e propone fattura; sotto scorta genera richiesta, non ordine automatico; fattura in scadenza genera notifica interna.

## Cosa possiamo fare a costo software aggiuntivo zero
CRUD, pipeline CRM, task/follow-up, schede cliente/sede, listino proprio, preventivi multilivello, PDF tramite browser, stampa DDT/rapportini interni, checklist, margini, registro attività, stock ledger, import/export CSV, calendario ICS, notifiche in-app, link WhatsApp, deploy e test via GitHub Actions, database entro quote gratuite.

Supabase Free, secondo la pagina pubblica corrente, include 500 MB DB, 1 GB file storage e 5 GB egress; i progetti inattivi possono essere sospesi dopo una settimana. Un'app aziendale operativa non ha comunque SLA/backup gestiti equivalenti a un piano a pagamento. Verificare sempre i limiti correnti: https://supabase.com/pricing.

Non sono da considerare gratuiti garantiti: e-fattura SDI e conservazione, invii WhatsApp API, AI/estrazione PDF con modelli cloud, cataloghi proprietari aggiornati, geocoding a volume, email/SMS transazionali oltre quota e backup/SLA di produzione.

## Stato reale della nostra app: blocco P0
Audit su repository vbhkvhzvx2-creator/fill-app, main: package.json indica 1.0.4, README 1.0.3; il codice online usa ancora LocalStorageRepository, le schermate Fatture/Magazzino sono generiche e nel branch verificato non sono presenti js/supabase-data.js né .github/workflows/deploy.yml. La copia locale 1.3.0 con adapter e workflow ha test locali superati, ma non è la versione già rilasciata su main né è verificata contro Supabase live. Prima di implementare oltre, allineare tramite branch e pull request, non cancellare/ricaricare il repository.

## Roadmap ordinata
P0 Fonte di verità Git + CI, test e deploy automatico.
P1 Multi-azienda, membri/ruoli, RLS e Storage policies, migrazione sicura da owner_id.
P2 CRM, sedi, deduplica, timeline, task e follow-up; WhatsApp manuale via link.
P3 Catalogo, preventivo con righe/kapitoli, revisioni e conversione in commessa.
P4 Cantiere, pianificazione, checklist, rapportini, ore, materiali e SAL.
P5 DDT entrata/uscita, fornitori, richieste/ordini d'acquisto e stock ledger.
P6 Fatture, pagamenti, scadenzario, prima nota e report margini.
P7 Notifiche, portale cliente ed eventuale WhatsApp API dopo verifica costi.
P8 E2E browser, confronti screenshot, audit RLS/Storage, backup e ripristino.

## Definition of Done
Ogni modulo ha UI per loading/empty/error/retry/success/offline, migrazione SQL versionata, validazione sul DB, test CRUD e permessi negati, prova browser con refresh, changelog, rollback e baseline visuale approvata. Main riceve solo PR piccole con controlli verdi.
