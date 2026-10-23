# Specifica funzionale ad hoc per il Gestionale Artigiano
Attività target: impianti elettrici, idraulici/termoidraulici e clima, fotovoltaico, allarmi e videosorveglianza. L'app deve funzionare sul telefono in cantiere e in ufficio.

## Flusso unico
Richiesta/lead → cliente/sede → sopralluogo → preventivo → accettazione → commessa/cantiere → pianificazione → rapportino/materiali → DDT/costi → SAL → fattura → incasso → manutenzione/follow-up.

Ogni record aperto deve avere un responsabile, uno stato e una prossima azione. La timeline è la memoria unica: niente richiesta dispersa in WhatsApp o nella memoria di una persona.

## 1. Nuova richiesta e cliente
Fonti: chiamata, WhatsApp, email, referral o cliente abituale. Registrare ora, origine, servizio richiesto, urgenza, descrizione, foto e prossimo contatto.

Prima di creare cliente:
1. normalizzare email/telefono;
2. cercare corrispondenza per partita IVA/codice fiscale, telefono, email e nome simile;
3. se probabile duplicato, proporre Apri cliente esistente, Usa questo o Crea comunque con motivo;
4. mai fondere anagrafiche automaticamente e non ripetere la creazione dopo timeout senza verificare l'esito.

Campi rapidi: nome/denominazione e almeno un recapito o sede. Tipo privato/azienda/condominio/altro. Dati fiscali e PEC/SDI sono opzionali finché non serve il documento fiscale. Separare cliente pagante da più sedi/impianti; ciascuna sede ha indirizzo, referente sul posto, accesso, note, foto e apparecchi installati.

Scheda cliente con tab Panoramica, Sedi/Impianti, Richieste, Preventivi, Interventi, Cantieri, Documenti, Fatture/Pagamenti e Timeline. Ricerca per nome, telefono, email, P.IVA, indirizzo. Record con relazioni si archiviano, non si cancellano a cascata.

## 2. Lavori aperti, chiusi e richiamati
- Nuova richiesta sullo stesso impianto: riusa cliente e sede, crea nuovo lead/intervento.
- Garanzia o richiamo: crea nuovo intervento collegato all'origine, indicando motivo; non riaprire né sovrascrivere il rapportino completato.
- Cantiere concluso da riprendere: azione esplicita Riapri commessa con motivo, responsabile, data e audit; in alternativa crea una nuova commessa collegata alla precedente.
- Cantiere sospeso: preserva task e budget, blocca assegnazioni non confermate e chiede data di revisione.
- Il lavoro concluso resta ricercabile e visibile nello storico.

## 3. Sopralluogo
Quando il servizio richiede valutazione tecnica, l'app propone sopralluogo prima del preventivo definitivo. Campi: sede, data/ora, addetto, motivo, checklist per categoria, misure, foto, quadro/installazioni esistenti, ostacoli, accesso, materiali ipotizzati e note. Il tecnico salva il report e può creare il preventivo da quel contesto senza reinserire cliente/indirizzo.

Categorie-template iniziali:
- Elettrico: quadro/protezioni, linee/cavi, punti luce/prese, prove e documentazione applicabile.
- Clima/termoidraulica: unità, tubazioni, accessori, collegamenti, posa, prove e manutenzione.
- Fotovoltaico: moduli, inverter, accumulo, strutture, protezioni, posa, collaudo e pratiche applicabili.
- Allarme/videosorveglianza: centrale/NVR, sensori/camere, cablaggio, configurazione e collaudo.
Sono checklist aziendali configurabili, non prescrizioni normative automatiche.

## 4. Preventivo
Si avvia da un cliente, lead, sede o sopralluogo. Riusa i dati esistenti. Il listino deve contenere materiale, manodopera, servizio, trasferta e macro-articolo con codice, descrizione, unità, costo interno, prezzo cliente, IVA e categoria.

Ogni preventivo ha capitoli/sottocapitoli opzionali e righe con descrizione snapshot, quantità, unità, prezzo, sconto, IVA, imponibile e totale. Costi e margini sono visibili solo a ruoli autorizzati. Usare una sola regola di arrotondamento (per riga a due decimali) coperta da test. Margine stimato = ricavo imponibile netto meno costo diretto stimato, con percentuale calcolata solo se il ricavo è positivo.

Stati: Bozza → Revisione interna → Approvato → Inviato → Accettato/Rifiutato/Scaduto/Sostituito. Ogni invio memorizza data, autore, canale e versione. Dopo l'invio, ogni modifica crea una nuova revisione immutabile. Il PDF riporta cliente/sede, lavorazioni e quantità, inclusioni/esclusioni, validità, tempi/condizioni pagamento e note. Registrare l'accettazione e l'evidenza disponibile; la validità legale di una firma elettronica va valutata separatamente.

Automatismi:
- campi obbligatori mancanti bloccano invio;
- invio crea follow-up, ad esempio 2 giorni lavorativi dopo, configurabile;
- scadenza senza risposta crea task di richiamo, non elimina il preventivo;
- rifiuto conserva il motivo e lo storico;
- accettazione crea la commessa una sola volta, con unique key su preventivo/revisione;
- revisione sostituita non somma due volte la pipeline.

## 5. Apertura cantiere/commessa
Dopo accettazione, creare codice commessa, cliente, sede, preventivo/revisione accettata, responsabile, date, budget costi/ricavi e stato. Copiare in snapshot le righe commerciali; mai dipendere dal listino attuale per ricostruire il contratto.

Fascicolo in tab: Riepilogo, Preventivo/Ordine, Pianificazione, Checklist, Rapportini/Ore, Materiali/DDT, Costi/Margini, SAL, Documenti/Foto, Fatture/Pagamenti, Timeline.

Generare checklist da modello:
- pre-lavoro: accesso, misure, conferma materiali, permessi/documenti, appuntamento;
- durante: foto prima, sicurezza, attività, materiali e seriali;
- chiusura: prove/collaudo, foto dopo, scheda impianto, manuali, documenti applicabili, consegna e fatturazione.

## 6. Pianificazione e rapportino
Il tecnico vede i lavori assegnati, cliente, indirizzo, contatto, mappa, accesso, note, orario, checklist e materiali. Stati: Pianificato, Confermato, In corso, In attesa cliente/materiale, Completato, Verificato/Fatturabile, Annullato (motivo obbligatorio).

Rapportino: inizio/fine/pause, addetti, ore, attività, esito, materiali usati/ritornati, foto prima/dopo, anomalie, raccomandazioni e firma/ricevuta se richiesta. Ore effettive generano costo consuntivo, non modificano la stima. Copia al cliente solo dopo revisione e con un canale configurato.

## 7. DDT, acquisti e stock
Quattro operazioni diverse:
1. DDT passivo: carica PDF/XML/CSV originale; identifica fornitore; esamina righe; abbina/crea articolo; corregge quantità e prezzi; approva ricevimento totale o parziale; registra movimenti stock sul deposito/cantiere; archivia originale.
2. Richiesta materiale del tecnico: seleziona commessa, articoli e quantità; il responsabile approva; il sistema verifica giacenza libera e prepara il prelievo o una richiesta acquisto.
3. DDT/prelievo uscita: destinatario, luogo, causale, date, articoli/quantità, colli e vettore se pertinente, prova di consegna e collegamento all'ordine/commessa.
4. Reso/rettifica: movimento compensativo con motivo e origine; non cancellare il movimento iniziale.

Il DDT fornitore importa stock solo dopo revisione umana. Supportare ricezione parziale, lotti e matricole quando servono. Le formalità del DDT e i collegamenti alla fattura vanno verificati con il commercialista; PDF logistico non equivale a fattura elettronica.

Workflow acquisto: richiesta → approvazione → richiesta offerta a fornitori (opzionale) → confronto → ordine → ricevimento/DDT → movimento stock → fattura passiva allocata a commessa. Un ordine non va contabilizzato come costo fatturato una seconda volta.

## 8. Fatture e pagamenti
Creare bozza dalle righe preventivo accettate, rapportini o SAL approvati. Copiare snapshot di descrizione/prezzo/cliente. Righe già fatturate devono avere quantità/importo fatturato residuo, per prevenire doppia fatturazione; eccezioni tracciate con permesso.

Pagamenti sono record separati: data, importo, metodo, riferimento e allocazione. Il residuo deriva da totale meno pagamenti e storni validi. Scadenze creano alert/task; solleciti email o WhatsApp non partono senza provider autorizzato e log del risultato. XML FatturaPA/SDI richiede integrazione fiscale idonea, non va simulato con un PDF.

## 9. Manutenzione e scheda impianto
Conservare marca/modello, seriale, data installazione, garanzia, documenti, posizione, componenti sostituiti e storico interventi. Piano di manutenzione con periodicità e prossima data genera un intervento/task con chiave univoca, notifica interna e messaggio cliente pronto da inviare. Non creare doppie visite a ogni riapertura/riprova.

## 10. Automazioni evento → azione
- Nuovo lead → follow-up assegnato; prima controlla duplicati.
- Preventivo inviato → prossima azione e reminder.
- Preventivo accettato → commessa e checklist una sola volta.
- Intervento programmato → promemoria in-app e bozza messaggio.
- Scorta sotto soglia → alert e richiesta di acquisto proposta, non ordine automatico.
- DDT convalidato → ricevimento e movimenti una volta sola.
- Rapportino approvato → aggiorna costi reali e propone fatturazione.
- Commessa completata → verifica checklist, documenti, seriali, materiali, rapportini e fatture.
- Fattura in scadenza → notifica interna; invio esterno solo se configurato.
- Pagamento registrato → ricalcolo residuo e stato.
- Manutenzione → prossimo task/intervento idempotente.
- Messaggio WhatsApp in entrata via API → thread assegnato, needs_reply true, task se non già esistente.

Ogni automazione necessita log, stato, retry controllato, idempotenza e messaggio di errore leggibile. Nessuna automazione esterna deve essere considerata riuscita prima dell'esito del provider.

## 11. Definition of Done
Una schermata non è completata perché si apre: deve avere stati loading/empty/error/retry/success/offline, controlli, permessi server, migrazione, test dominio/CRUD/RLS, prova browser con refresh, screenshot approvato e rollback documentato.
