# Il Tuo Lavoro — Gestionale Artigiano PWA

**Versione 1.0.3 · prototipo funzionale mobile-first, senza dipendenze npm esterne.**

## Avvio in pochi secondi

Requisito: Node.js 20 o successivo. Non serve `npm install`.

```bash
npm run dev
```

Apri `http://localhost:4173`. Per provare l'accesso demo, inserisci un indirizzo email a scelta, una password non vuota e il PIN `1234`. I dati e le impostazioni restano nel `localStorage` del browser e quindi su quel dispositivo/profilo browser.

Per provare esattamente ciò che verrebbe pubblicato:

```bash
npm run build
npm run preview
```

La cartella pubblicabile è `dist/`: può essere ospitata su un server statico HTTPS. In locale il service worker è attivo su `localhost`.

## Controlli

```bash
npm run check:syntax
npm test
npm run build
npm run check:baseline
npm run quality
```

La pipeline `quality` controlla la sintassi JS, test di dominio/persistenza/rendering, disponibilità degli asset HTTP, build e hash del codice protetto, compresi i template grafici e il CSS. Non scarica framework o librerie da internet. Per questa release `npm run check:syntax`, `npm test` (23/23), `npm run build` e `npm run check:baseline` sono passati. Il test browser end-to-end non è stato completato in questo ambiente: Chromium blocca le richieste a localhost con `ERR_BLOCKED_BY_ADMINISTRATOR`. Esegui `npm run test:browser-auth` e il test visuale su una macchina in cui Chromium può aprire localhost. Non esiste ancora una baseline screenshot approvata: vedi `docs/QUALITY_GATES.md`.

Per il controllo visuale e i flussi end-to-end, serve Python Playwright e Pillow (`python -m pip install playwright pillow`) e Chromium disponibile nel sistema oppure installato per Playwright. Puoi indicare il binario tramite `CHROMIUM_PATH`. Esegui `npm run dev` in un terminale e, in un altro:

```bash
npm run test:browser
npm run test:browser-auth
```

Il test visivo acquisisce le 10 schermate a 390×844, verifica la navigazione, ricerca clienti, creazione cliente/intervento, cambio e persistenza impostazioni e overflow orizzontale. **La prima baseline visuale deve essere generata solo dopo aver esaminato manualmente gli screenshot**:

```bash
UPDATE_VISUAL_BASELINE=1 npm run test:browser
npm run test:browser-auth
```

Da lì in poi `npm run test:browser` confronta gli screenshot con la baseline. Non aggiornare la baseline solo per rendere verde un test: controllare e approvare le differenze prima.

## Pubblicazione GitHub Pages (consigliata)

Il repository include `.github/workflows/deploy.yml`: dopo aver caricato il progetto sul branch `main`, apri **Settings → Pages** e seleziona **Source: GitHub Actions**. Il workflow esegue controlli sintattici, test, build e verifica della baseline, quindi pubblica la cartella `dist/` con percorsi relativi adatti anche ai repository di progetto. Guarda la scheda **Actions** per l’esito della pubblicazione. Non configurare contemporaneamente la pubblicazione da branch `/ (root)`, perché il workflow distribuisce l’output compilato.

## Configurazione Supabase

Il Project URL e la publishable key sono salvati in `js/supabase-config.js`. `js/supabase-auth.js` esegue login con email/password, ripristina sessioni memorizzate, rinnova token prossimi alla scadenza, invia email di recupero password e cancella la sessione al logout. Non usa SDK remoti né CDN. Gli errori (credenziali errate, email non confermata, rete/timeout, rate limit) sono mostrati nel form. La chiave `sb_publishable_...` è una chiave pubblica per client web; non inserire mai nel frontend `sb_secret_...`, `service_role` o credenziali PostgreSQL.

### Configurazione Supabase richiesta

1. In Supabase → Authentication → Sign In / Providers, abilita Email.
2. In Authentication → Users, crea o verifica l'utente che userai per l'accesso. Usa l'indirizzo email completo, non un username. Se la conferma email è obbligatoria, conferma l'account prima di accedere.
3. In Authentication → URL Configuration, configura Site URL con il dominio reale GitHub Pages e aggiungi quell'URL tra i Redirect URLs per i link di recupero.
4. Pubblica la cartella `dist/` generata da `npm run build`. Dopo l'aggiornamento, fai un hard refresh; la cache PWA viene invalidata con la nuova versione del service worker.

**Importante:** l'autenticazione Supabase è attiva, ma il repository operativo continua ancora a salvare in `localStorage`. La sincronizzazione dei dati del gestionale alle tabelle cloud richiede il successivo adapter Supabase e policy RLS corrette per ogni tabella e bucket. Vedi la [documentazione Supabase sulla sicurezza dei dati](https://supabase.com/docs/guides/database/secure-data) e sulle [policy RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Funzioni presenti

- Login reale Supabase Auth con email/password, ripristino sessione, rinnovo token, recupero password e logout.
- Dashboard e navigazione a Lavori Oggi, Calendario, Clienti, Scadenze, Cantieri, Fatture, Magazzino e Impostazioni.
- Agenda con cambio stato completato; calendario mensile e creazione intervento con validazione cliente/descrizione/data/orari.
- Ricerca e filtro clienti, dettaglio cliente e aggiunta cliente.
- Filtri scadenze e aggiornamento dimostrativo dello stato.
- Dettaglio cantiere con schede Dettagli, Documenti, Note e Attività.
- Impostazioni persistenti, manifest, icone installabili, cache offline dell'app shell.

I dati campione usano nomi e date del mockup (maggio/giugno 2025) per mantenere il riferimento grafico.

## Limiti di questa versione

L’autenticazione email/password è verificata da Supabase Auth. Tuttavia clienti, interventi, scadenze e preferenze sono ancora dati demo/locali e non vengono sincronizzati con il database remoto. Non considerare il gestionale pronto per la produzione fino al collegamento del repository a Supabase, alla verifica delle policy RLS, ai test di sicurezza e alla configurazione dei backup.

## Struttura

- `js/model.js`: tipi concettuali, dati demo, selettori e regole dominio.
- `js/repository.js`: interfaccia di persistenza locale, punto di sostituzione futuro per API/database.
- `js/screens.js`: markup delle schermate.
- `js/ui.js`: componenti HTML/icone condivisi e escaping.
- `js/app.js`: navigazione, azioni, form e stato UI.
- `styles.css`: stile responsive e componenti visuali.
- `public/`: manifest, service worker, icone PNG/SVG e immagine cantiere derivata dal mockup fornito.
- `tests/`: unit test e smoke test HTTP; `scripts/browser_smoke.py` per test browser e regressione visuale.
- `docs/QUALITY_GATES.md`: regole di modifica e rilascio.


### Autenticazione e avvio 1.0.4
La schermata di accesso chiama Supabase Auth REST (senza SDK/CDN), non accetta più email/password arbitrarie e non richiede il PIN demo 1234 dopo il login. La sessione valida viene ripristinata all’apertura senza chiamate di rete se il token è ancora valido; i token in scadenza vengono rinnovati con timeout. Gli errori di autenticazione sono mostrati nel modulo. Aggiunti invio recupero password e logout. Service worker aggiornato a shell v3 per invalidare la vecchia cache. Test auth aggiunti.

### Aggiornamento grafico 1.0.2
La schermata di accesso ora utilizza il ritaglio fotografico dell'artigiano dal riferimento e la dashboard il ritratto presente nel mockup. I due asset sono inclusi nella build e protetti dalla baseline. La verifica pixel-per-pixel resta da eseguire in un browser non bloccato: il test Playwright locale in questo ambiente è impedito da `ERR_BLOCKED_BY_ADMINISTRATOR`.

## Schema SQL Supabase

Il file `supabase/schema.sql` contiene lo schema iniziale per profili, clienti, interventi, scadenze, cantieri, fatture, magazzino, impostazioni e metadati dei documenti, oltre a trigger, indici, policy RLS e bucket privato `site-documents`. Eseguirlo dal SQL Editor su un progetto nuovo, poi configurare Supabase Auth. Lo schema da solo non collega ancora `LocalStorageRepository` alla sincronizzazione remota: va implementato il repository Supabase nel frontend prima che i dati della PWA vengano salvati nel cloud.
