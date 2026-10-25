# Ciclo di sviluppo e rilascio

## Flusso operativo
1. Creare un branch dal codice aggiornato di main.
2. Modificare i file sorgente nella root e in js/, non gli asset compilati dentro dist/.
3. Prima della pull request, eseguire localmente con Node.js 22:
   ```bash
   npm run quality
   ```
4. Aprire una pull request verso main. GitHub Actions deve completare i controlli automatici prima della revisione.
5. Unire solo dopo esame del diff e dei risultati. Un push su main esegue di nuovo i gate.
6. La pubblicazione Pages è volutamente protetta: procede solo quando package.json indica la release applicativa approvata 1.3.0 e il modulo di sincronizzazione dati `js/supabase-data.js` è presente. Finché il ramo principale non è stato allineato alla sorgente 1.3.0, i controlli girano ma il deploy viene saltato con una nota. Questo impedisce di sovrascrivere per errore una versione più recente con quella vecchia presente su main.
7. Per annullare una release già pubblicata, usare un revert tracciato del commit/merge e lasciare che la pipeline ricompili e pubblichi.

## Controlli attivi
- Controllo sintassi JavaScript.
- Test automatici Node.js.
- Build della PWA.
- SHA-256 dei file protetti rispetto a `.quality/baseline.json`.
- Pubblicazione da artefatto compilato, non dal codice sorgente direttamente.

La baseline iniziale è un punto di riferimento tecnico della versione attualmente presente su main. Quando si sceglie intenzionalmente di modificare un file protetto, non aggiornare l'hash solo per far passare il controllo: la modifica deve essere revisionata, i test rieseguiti e la nuova baseline generata e approvata nella stessa pull request.

## Impostazione GitHub Pages
Dopo la sincronizzazione della release e prima del primo deploy, aprire **Settings → Pages** e scegliere **Source: GitHub Actions**. Questa impostazione di repository non viene modificata dal workflow. Aprire Actions e verificare il primo run fino al job Deploy.

## Limiti noti
- Il test browser/screenshot non viene eseguito nella pipeline in quanto il browser headless non è stato validato in un ambiente CI stabile. Va eseguito in ambiente compatibile e i risultati visivi vanno revisionati.
- Il progetto contiene ancora il vecchio contenuto `dist/` tracciato in Git per compatibilità con l'assetto corrente. Non modificarlo a mano; il workflow genera la build nuova. La sua rimozione verrà fatta soltanto dopo aver verificato la nuova sorgente Pages.
- I test di qualità non sostituiscono il test di autenticazione e CRUD con un utente Supabase di staging. Non eseguire test distruttivi sul database con dati reali.
- Questa PR mette i gate di qualità sulla sorgente attualmente presente su main; non è un aggiornamento del codice applicativo alla 1.3.0. L'allineamento della release locale 1.3.0 resta il successivo passaggio controllato.
