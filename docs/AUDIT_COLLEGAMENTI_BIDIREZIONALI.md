# Audit dei collegamenti bidirezionali — Gestionale Artigiano
Data: 25 ottobre 2026

## Scopo
Una relazione è completa solo se:
1. è conservata nel database con chiavi esterne e vincoli coerenti;
2. è visibile nella scheda di entrambi i record collegati;
3. il nome/link apre il dettaglio dell'altro record;
4. le liste inverse si aggiornano quando il dato cambia;
5. lo storico resta integro e l'eliminazione non lascia dati orfani.

Non duplicare nomi e descrizioni manualmente in tante tabelle. Conservare gli ID e mostrare le etichette risolte dal record sorgente. Per i documenti commerciali emessi, mantenere anche snapshot storici.

## Fonti e versioni controllate
- Repository pubblicato: https://github.com/vbhkvhzvx2-creator/fill-app
- `main` online, al momento dell'audit: `package.json` 1.0.4. I dati del gestionale passano ancora da `LocalStorageRepository`; nel branch non c'è `js/supabase-data.js`.
- Archivio sorgente locale esaminato: release 1.3.0. `npm run quality` eseguito localmente: 20 file JS controllati, 39/39 test, build con 18 artefatti e baseline 18 file protetti tutti superati.
- Questa è un'analisi statica del codice e dello schema. Non equivale a un test con dati reali su Supabase né a un test visuale end-to-end.
- La pipeline P0 è ora su `main`; i controlli CI sono passati e il deploy viene volutamente saltato fino alla sincronizzazione approvata della release 1.3.0.

## Matrice delle relazioni presenti nella release locale 1.3.0

| Relazione | Database/schema | UI attuale | Gap rilevato |
|---|---|---|---|
| Cliente ↔ Intervento | Presente: `jobs.client_id → clients.id`, con vincolo stesso owner | Il dettaglio cliente conta gli interventi; da lì si può creare un intervento. Il dettaglio intervento mostra il nome cliente | Il nome cliente nell'intervento non apre in modo uniforme la scheda cliente; la scheda cliente non mostra l'elenco navigabile dei lavori |
| Cliente ↔ Scadenza | Presente: `deadlines.client_id → clients.id` | La scadenza salva e mostra il cliente associato | Manca una vista cliente con tutte le scadenze e un link reciproco |
| Intervento ↔ Scadenza | Colonna opzionale `deadlines.job_id → jobs.id` nel database | Il modulo scadenze non offre un selettore di intervento collegato nel flusso di creazione | Relazione SQL possibile ma non completamente gestibile dalla UI; il client_id della scadenza può non corrispondere al cliente dell'intervento collegato |
| Cliente ↔ Cantiere | Presente: `sites.client_id → clients.id` | Il cantiere seleziona e mostra il cliente | Nome non navigabile; il dettaglio cliente non raccoglie i suoi cantieri |
| Cantiere ↔ Documento | Presente: `site_documents.site_id → sites.id`; bucket privato e URL firmato temporaneo | Il dettaglio cantiere mostra/carica/apre/elimina i suoi documenti | I documenti non sono visibili da una scheda cliente centralizzata e non esiste una ricerca documentale globale |
| Cantiere ↔ Intervento | **Assente**: `jobs` non contiene `site_id` | La scheda cantiere mostra interventi filtrati per `clientId` | Mostra tutti gli interventi del cliente, anche se non appartengono a quel cantiere. È un'associazione implicita, non un vero collegamento di commessa |
| Cliente ↔ Fattura | Presente: `invoices.client_id → clients.id` | La fattura mostra l'etichetta cliente | La scheda cliente non mostra fatture; nome cliente non navigabile |
| Cantiere ↔ Fattura | Presente: `invoices.site_id → sites.id`, opzionale | Attività del cantiere filtra le fatture per `siteId` | Le fatture non sono linkabili dal cantiere; il form fattura mostra tutti i cantieri senza filtrare per cliente; il DB controlla lo stesso owner ma non che il cantiere sia del cliente selezionato |
| Magazzino ↔ Intervento/Cantiere | Assente: `inventory_items` ha articolo e quantità, ma nessun registro movimenti | Esistono edit e incrementi/decrementi diretti della quantità | Non sappiamo quale lavoro abbia consumato un materiale; niente storico, resi o tracciabilità dei movimenti |
| Preventivo ↔ Cliente/Cantiere | Il modulo preventivi non esiste ancora nello schema corrente | Nessuna schermata preventivi nella release 1.3.0 | Blocco funzionale da implementare dopo la fase relazioni |
| Pagamento ↔ Fattura | Non esiste tabella `payments` | La UI permette di cambiare lo stato della fattura a Pagata | Nessun acconto/saldo parziale, data/metodo di pagamento o calcolo residuo tramite movimenti di incasso |
| Impianto ↔ Manutenzioni | Non esiste un registro distinto dell'impianto installato | Scadenze generiche, non una scheda impianto completa | Garanzia, matricola e cronologia interventi non possono ancora essere navigati come un singolo asset |
| Utente ↔ Organizzazione | Lo schema attuale usa `owner_id = auth.uid()` | App pensata per un unico account proprietario | Non è ancora un ecosistema con utenti e ruoli aziendali diversi |

## Vincoli strutturali già buoni
- Le relazioni verso clienti, lavori, cantieri, fatture e documenti usano chiavi esterne e vincoli di ownership composti per evitare relazioni tra record di proprietari diversi.
- Gli intervalli orari degli interventi e le date del cantiere hanno check sul database.
- I file del cantiere sono in un bucket privato con link firmati a scadenza.
- Gli errori FK/RLS hanno messaggi operativi nell'adapter della release 1.3.0.

## Rischi da correggere prima di aggiungere altri moduli
1. **Eliminazioni distruttive.** Clienti, cantieri e fatture presentano azioni elimina; se ci sono relazioni possono fallire le FK. Per record storici preferire archiviazione/annullamento e impedire cancellazioni con dipendenze.
2. **Pulizia file prima della cancellazione del cantiere.** Il flusso attuale elimina prima i file dal bucket e poi il cantiere; se la cancellazione SQL fallisce per una FK di fattura, il cantiere resta ma i file sono già persi. Prima verificare i vincoli e usare un flusso di archiviazione/transazione compensativa.
3. **Fattura con cliente e cantiere non coerenti.** Il form deve filtrare i cantieri del cliente e il DB deve imporre la coerenza, non solo l'ownership.
4. **Scadenza e intervento non coerenti.** Se `job_id` è valorizzato, validare che il lavoro appartenga al medesimo cliente.
5. **Nessun ID di cantiere sugli interventi.** Aggiungere la relazione esplicita per distinguere gli interventi di un cantiere da altri lavori dello stesso cliente.
6. **Quantità magazzino sovrascritta.** Sostituire gradualmente i cambi quantità diretti con `inventory_movements`; la giacenza dovrà essere ricostruibile dal registro.
7. **Dati fiscali e incassi incompleti.** Non usare il modulo fatture attuale come sistema fiscale; righe, pagamenti, numerazione e percorso FatturaPA/SDI sono fasi separate.

## Navigazione uniforme da implementare
Ogni scheda deve usare una sezione “Collegamenti” con conteggio e link:
- **Cliente:** sedi/impianti, preventivi, cantieri, interventi, scadenze, documenti, fatture/pagamenti e timeline.
- **Cantiere:** cliente (link forte), preventivo/revisione accettata, interventi assegnati al cantiere, scadenze, documenti, rapportini/ore, DDT/materiali, SAL e fatture.
- **Intervento:** cliente, sede/cantiere (se presente), scadenze collegate, checklist, rapportino, materiali usati e fattura/quote pertinente.
- **Scadenza:** cliente e intervento correlato, con link di ritorno.
- **Preventivo:** cliente, sede, sopralluogo, revisioni; dopo accettazione link alla commessa creata.
- **Fattura:** cliente, cantiere, righe origine (preventivo/SAL/rapportino), pagamenti e documenti.
- **Articolo di magazzino:** movimenti, DDT/ordini sorgente e cantieri che lo hanno consumato.
- **Documento:** proprietario/contesto, collegamento al record padre e link temporaneo sicuro.

Su mobile la UI deve evitare schermate troppo dense: una riga “Collegato a: Cliente · Cantiere” navigabile e un pannello “Altri collegamenti” con conteggi sono sufficienti. Le breadcrumb devono conservare il contesto: tornando da un dettaglio, ripristinare filtro, ricerca e scheda di origine.

## Regole di coerenza dati
- Salvare ID e FK, mai soltanto il testo del nome.
- Se una fattura ha `site_id`, il cliente della fattura deve essere quello del cantiere.
- Se una scadenza ha `job_id`, il cliente della scadenza deve coincidere con quello del lavoro.
- Un lavoro può riferirsi a un cantiere opzionale: nessuna inferenza automatica solo perché il cliente coincide.
- Un preventivo accettato genera al massimo una commessa per versione accettata (idempotenza e vincolo univoco).
- Le righe di preventivo e fattura conservano snapshot di descrizione, quantità, prezzo e IVA.
- Record collegati a documenti contabili o attività svolte si archiviano, non vengono eliminati a cascata.
- Le liste inverse devono riflettere lo stesso FK e aggiornarsi dopo CRUD/refresh; niente duplicazione manuale delle relazioni nella UI.

## Piano di lavoro per questa fase
### P1-A — Allineamento della fonte
1. Allineare il contenuto della release locale 1.3.0 nel repository GitHub su un branch, senza sovrascrivere `main` alla cieca.
2. Rieseguire gate CI, controllare il diff e verificare la build.
3. Testare con account Supabase di staging: login, letture, creazioni/modifiche/cancellazioni protette e documenti.
4. Confermare che GitHub Pages usa GitHub Actions solo dopo che il branch e l'ambiente cloud sono stati convalidati.

### P1-B — Collegamenti espliciti e bidirezionali
1. Cliente ↔ cantiere / interventi / scadenze / fatture.
2. Cantiere ↔ interventi / documenti / fatture, con `jobs.site_id` e vincoli di coerenza.
3. Filtraggio cantiere per cliente nel form fattura e coerenza anche sul database.
4. Breadcrumb e ritorno al contesto, azione “Apri cliente” e link accessibili da tutte le schede.
5. Disattivare eliminazioni distruttive per record collegati; progettare archiviazione.

### Test di accettazione P1-B
- Aprire un cliente e arrivare a ogni suo cantiere, lavoro, scadenza e fattura; da ciascun dettaglio tornare alla scheda cliente.
- Aprire un cantiere e vedere solo i lavori esplicitamente collegati a esso, non tutti i lavori del cliente.
- Tentare di assegnare una fattura al cantiere di un altro cliente: UI e DB devono rifiutare.
- Tentare di collegare una scadenza a un lavoro di un altro cliente: UI e DB devono rifiutare.
- Archiviare un cliente/cantiere con dati collegati senza cancellare documenti o storico.
- Dopo refresh, tutti i collegamenti e le liste inverse devono essere identici.
- Test RLS con account separati; un account non deve vedere o inferire i record dell'altro.

## Stato della fase
L'audit e la matrice sono pronti. L'implementazione di codice applicativo deve seguire l'allineamento sicuro della sorgente 1.3.0: la versione remota attuale resta 1.0.4. Questa distinzione evita di sovrapporre modifiche al ramo pubblicato e di dichiarare come live funzionalità presenti soltanto nell'archivio locale.
