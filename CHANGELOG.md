# Changelog

## 1.0.3 — Correzione avvio GitHub Pages
- Corretto il caricamento degli asset usando percorsi relativi, compatibili con GitHub Pages in modalità repository.
- Corretto lo scope del manifest e la registrazione del service worker per pubblicazioni sotto sottopercorso.
- Aggiornata la cache offline del service worker alla versione v2.
- Aggiunto un fallback visibile di caricamento immediato nel documento HTML per evitare una pagina completamente vuota durante l'avvio JavaScript.
- Verifiche: 17 test automatici superati; build statica completata. La verifica visuale nel dominio GitHub Pages va eseguita sul link pubblicato.


## 1.0.0 — Prima versione funzionale

- Ricostruite le 10 schermate principali del riferimento con HTML/CSS/JavaScript nativi.
- Aggiunti navigazione, ricerca clienti, creazione cliente/intervento, validazione orari, aggiornamento dimostrativo stato lavoro/scadenza e impostazioni persistenti.
- Aggiunti manifest PWA, icone installabili, service worker, server e build senza dipendenze runtime esterne.
- Aggiunti test automatici per dominio, repository, template UI e risposte HTTP, oltre allo script browser/screenshot da eseguire in ambiente compatibile.
- Limite noto: accesso demo e persistenza solo locale, nessun backend/database cloud.

## 1.0.1 — Configurazione Supabase

- Aggiunto `js/supabase-config.js` con Project URL, publishable key e endpoint REST derivato.
- Aggiunti test di configurazione e validazione per HTTPS e prefisso `sb_publishable_`.
- La build verifica la presenza del modulo. I moduli protetti dell'interfaccia, del dominio e della persistenza locale non sono stati modificati.
- Limite dichiarato: nessuna sincronizzazione cloud attiva finché schema, policy RLS, autenticazione e adapter remoto non saranno implementati.


## 1.0.2 — Fedeltà grafica al riferimento
- Sostituita la sagoma illustrata dell'artigiano nella schermata di accesso con un ritaglio fotografico dal mockup fornito.
- Aggiunto il ritratto del profilo nella dashboard.
- Estesi i controlli di build e la baseline SHA-256 ai due nuovi asset grafici.
- Test automatici: 17/17 superati; build statica completata.
- Test visuale browser non eseguibile in questo ambiente: Chromium restituisce `ERR_BLOCKED_BY_ADMINISTRATOR` su localhost; nessuna approvazione pixel-perfect dichiarata.


## 1.0.4 — Autenticazione Supabase e correzione ciclo login

- Collegato il modulo login a Supabase Auth REST tramite `js/supabase-auth.js`; credenziali controllate realmente dal progetto, niente fallback PIN demo.
- Persistenza e ripristino rapido della sessione; refresh token con timeout di 8 secondi; logout locale immediato e invio recupero password.
- Errori specifici per credenziali non valide, email non confermata, rate limit, rete e timeout.
- Aggiunto indicatore “Verifica credenziali…”, disabilitazione dei controlli durante l’invio e messaggio di errore visibile.
- Service worker portato a shell v3 e aggiornato l’app shell per includere il modulo auth, così non riutilizza la cache precedente.
- Nuovi test unitari per login, invalid credentials, restore session, refresh, password recovery e logout.
- Nota: dati di clienti/interventi/scadenze rimangono su localStorage; il collegamento delle tabelle cloud non è incluso in questa correzione.
