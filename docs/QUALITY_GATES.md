# Gate obbligatori per qualità, stabilità e regressioni

Queste regole valgono per ogni modifica futura.

## 1. Protezione del codice già approvato

Il dominio, la persistenza, l'app shell, i template delle schermate, il CSS e gli asset PWA hanno hash SHA-256 in `.quality/baseline.json`. `npm run check:baseline` impedisce di consegnare modifiche accidentali a questi file. I nuovi moduli si aggiungono senza riscrivere il codice congelato, quando possibile.

La baseline non si modifica per far diventare verde un controllo. Quando una modifica a un modulo protetto è necessaria, occorre: spiegare causa/rischio, aggiungere prima un test che riproduca il problema, ottenere approvazione esplicita, eseguire tutti i controlli, revisionare il diff e solo alla fine rigenerare la baseline.

## 2. Gate automatici obbligatori

Eseguire da root del progetto:

1. `npm run check:syntax` — parsing di tutti i file JavaScript.
2. `npm test` — dominio, validazione, persistenza, rendering e server HTTP.
3. `npm run build` — genera `dist/` e verifica gli artefatti PWA richiesti.
4. `npm run check:baseline` — hash dei moduli protetti.
5. `npm run test:browser` su una macchina con Chromium accessibile — scenari end-to-end e screenshot di regressione.

Una consegna non è approvata se un gate fallisce o non è stato eseguito. Se l'ambiente impedisce l'accesso a un browser, riportare il gate come non eseguito, mai come superato.

## 3. Revisione visiva

Il riferimento fornito è una tavola con 10 viewport, non una singola schermata. La revisione va effettuata per schermata a 360×800, 390×844 e 430×932, più una larghezza desktop. Verificare proporzioni, tipografia, colori, bordi, ombre, scroll, safe area, testi lunghi, errori e stati vuoti.

Lo script `scripts/browser_smoke.py` acquisisce login, PIN, dashboard, agenda, calendario, clienti, scadenze, modale intervento, impostazioni e cantiere. La prima baseline (`UPDATE_VISUAL_BASELINE=1`) va generata soltanto dopo revisione manuale. Le esecuzioni successive confrontano gli screenshot e bloccano le differenze oltre soglia. Un cambiamento grafico intenzionale deve avere motivazione e baseline approvata.

## 4. Funzioni e dati

Per ogni nuova funzione aggiungere test per percorso positivo, input mancante, errore, persistenza e interazione con i moduli esistenti. Verificare manualmente console browser, richieste fallite, navigazione, creazione/modifica, reload e offline dopo una prima visita.

La versione corrente salva in `localStorage`. Per produzione occorrono autenticazione/autorizzazione lato server, database condiviso, migrazioni, backup, audit, TLS, gestione dei segreti, politiche di retention e test sicurezza/privacy. Login/PIN demo non sono un meccanismo di sicurezza.

## 5. Registro modifiche

Ogni release aggiunge a `CHANGELOG.md`: obiettivo, file modificati, test eseguiti, build, baseline, controllo browser/visivo ed eventuali gate non eseguiti. Non dichiarare una prova grafica se non è stata eseguita su un browser.

## Stato dei gate per la prima versione

Per questa consegna sono passati `npm run check:syntax`, `npm test` (15/15), `npm run build` e `npm run check:baseline`. La prova end-to-end visuale è presente ma in questo ambiente non è eseguibile: Chromium blocca la navigazione verso localhost con `ERR_BLOCKED_BY_ADMINISTRATOR`. La baseline screenshot **non è stata generata**; eseguire la revisione manuale e poi `UPDATE_VISUAL_BASELINE=1 npm run test:browser` su una macchina con browser accessibile.
