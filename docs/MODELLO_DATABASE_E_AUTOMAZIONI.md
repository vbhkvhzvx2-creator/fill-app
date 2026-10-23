# Modello dati target e regole di automazione
Documento di disegno; implementare con migrazioni SQL incrementali dopo backup e test su staging.

## Stato attuale
Lo schema esistente ha profiles, clients, jobs, deadlines, sites, invoices, inventory_items, settings e site_documents. L'isolamento usa owner_id = auth.uid(), adatto al proprietario singolo ma non a un team con ruoli condivisi.

## Organizzazione e ruoli
- organizations: identità aziendale, dati fiscali, contatti, timezone, logo, impostazioni e numerazioni.
- organization_members: organizzazione, auth user, ruolo owner/admin/office/technician/accounting/read_only, stato attivo/invited/suspended.
- profiles: identità personale. Ruoli/accessi non sono modificabili dal client.
Migrazione: crea un'organizzazione per ogni owner corrente; backfill organization_id; verifica nessun orfano e tutte le FK; aggiungi nuove RLS e test paralleli; rimuovi vecchi campi solo dopo una release stabile.

## CRM
- leads: fonte, contatto, servizio, urgenza, fase, valore, responsabile, prossima azione e motivo di perdita.
- client_locations: più sedi/impianti, recapito sul posto, indicazioni accesso e note.
- communication_threads: lead/cliente, canale, stato, responsabile, ultimo messaggio inbound, needs_reply e next_action_at.
- messages: thread, ID provider univoco, direzione, testo, stato consegna e storage path allegato.
- follow_up_tasks: contesto, titolo, responsabile, priorità, scadenza, stato e completamento.
- activity_log: timeline append-only.
- whatsapp_webhook_events: provider event ID univoco, stato processing, retry ed errore sanificato.

## Catalogo e vendite
- catalog_items: SKU, tipo materiale/lavoro/servizio/trasferta, descrizione, unità, costo, prezzo vendita, IVA, categoria e validità prezzo.
- customer_price_lists e customer_price_list_lines: prezzi dedicati e sconti per cliente.
- quotes, quote_sections, quote_lines: numero, cliente/lead, sede, stato, revisione, validità, condizioni, capitoli, righe con descrizione/prezzo/IVA snapshot.
- quote_events e quote_documents: invii, risposte, accettazione/rifiuto, PDF e hash.
- customer_orders: ordine cliente collegato a quote e commessa.
- number_sequences: assegnazione atomica progressivi per organizzazione/tipo/anno in transazione DB.

## Commesse, cantiere e rapportini
Estendere sites/jobs con organization_id, creato/aggiornato da, site_id, quote_id, assignee_id e riferimenti di sede.
- site_tasks e checklist_templates/items + site_checklists/items.
- service_reports e time_entries per esito, orari, ore per persona, note, foto e accettazione.
- site_costs e job_materials per costi e materiali legati alla fonte.
- progress_claims e progress_claim_lines per SAL legati alla versione accettata.
- installation_assets/equipment_register per impianto installato, produttore, modello, seriale, garanzia e manutenzione.

## Fornitori, DDT e magazzino
- suppliers.
- purchase_requests, supplier_quote_requests/lines, purchase_orders/lines.
- goods_documents/goods_document_lines: tipo supplier_ddt, delivery_ddt, transfer, return; numero/data/causale, mittente/destinatario, righe, quantità, stato convalida, storage originale.
- goods_receipts per ricevimento parziale/totale collegato all'ordine.
- warehouses per magazzino, furgone o deposito cantiere.
- inventory_movements: articolo, tipo, delta quantità, costo unitario, deposito, commessa, fonte, autore e data; tipi acquisto, consumo, reso lavoro, reso fornitore, rettifica, trasferimento.
- supplier_bills ed expenses per fatture passive/spese allocabili ai cantieri.

La quantità corrente può essere una cache; la fonte storica è il libro movimenti. Mai cancellare un movimento contabilizzato: usare rettifica. Un PDF importato non aggiorna stock senza review, mapping e convalida.

## Fatturazione e incassi
- invoices + invoice_lines con snapshot cliente, descrizione, prezzo, quantità, IVA e totali.
- payments + payment_allocations per acconti e pagamenti parziali.
- credit_notes per storni/note credito collegati al documento originale.
- cash_entries per prima nota se richiesta.
Le fatture emesse non vanno modificate silenziosamente. PDF interno non significa e-fattura SDI.

## Documenti e avvisi
- documents: entità di contesto, storage path privato, MIME, size, hash, autore, scadenza.
- notifications e push_subscriptions.
- audit_log per stati, pagamenti, stock, permessi e azioni rilevanti.
- company_settings distinte dalle preferenze personali.

## Guardrail automazioni
- Commutazione quote → commessa con vincolo univoco quote/versione.
- DDT importato ha chiave di idempotenza e ricevimento convalidato.
- Pagamento distinto dallo stato visuale fattura.
- Consumo stock atomico, giacenza ricostruibile dalla somma movimenti.
- Webhook deduplicati per event ID e retry sicuri.
- Scheduler crea ricorrenze solo se non c'è già un evento per quella regola/data.
- Invii esterni usano outbox persistente e conferma provider; non fare network side effects in trigger SQL.

## Test obbligatori
1. RLS con due aziende e ruoli diversi, incluse API REST/Storage.
2. Nessuna FK cross-tenant; migrazione senza record orfani.
3. Numerazione concorrente unica.
4. Preventivi revisionati invariati, IVA/sconti e arrotondamenti corretti.
5. Pagamenti parziali, note credito e residuo.
6. Stock: entrata, consumo, reso, rettifica e race condition.
7. DDT doppio importato non crea due ricevimenti.
8. Doppia accettazione non crea due commesse.
9. Allegati privati e link firmati scaduti.
10. Webhook duplicati/fuori ordine.
11. Backup/restore provato su staging prima del cambio schema in produzione.
