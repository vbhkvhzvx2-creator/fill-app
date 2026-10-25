# Ciclo di sviluppo e rilascio

## Flusso operativo
1. Creare un branch dal codice aggiornato di main.
2. Modificare i file sorgente nella root e in js/, non gli asset compilati dentro dist/.
3. Prima della pull request, eseguire localmente con Node.js 22:
   ```bash
   npm run quality
   ```
4. Aprire una pull request verso main. GitHub Actions deve completare i controlli automatici prima della revisione.
5. Unire solo dopo esame del diff e dei risultati. Un push su main esegue di nuovo i gate e, se tutti passano, distribuisce l'artefatto dist/ su GitHub Pages.
6. Per annullare una release, usare un revert del commit/merge e lasciare che la pipeline ricompili e pubblichi.

## Controlli attivi
- Controllo sintassi JavaScript.
- Test automatici Node.js.
- Build della PWA.
- SHA-256 dei file protetti rispetto a .quality/baseline.json.
- Pubblicazione da artefatto compilato, non dal codice sorgente direttamente.

La baseline iniziale è un punto di riferimento tecnico della versione attualmente presente su main. Quando si sceglie intenzionalmente di modificare un file protetto, non aggiornare l'hash solo per far passare il controllo: la modifica deve essere revisionata, i test rieseguiti e la nuova baseline generata e approvata nella stessa pull request.

## Unica impostazione manuale GitHub Pages
Dopo l'approvazione e il merge della pull request, aprire Settings → Pages e scegliere **Source: GitHub Actions**. Questa impostazione di repository non viene modificata dal workflow. Quindi aprire Actions e verificare il primo run fino al job Deploy.

## Limiti noti
- Il test browser/screenshot non viene eseguito nella pipeline per evitare di dichiararlo superato senza un browser headless configurato e stabile. Va eseguito in ambiente compatibile e i risultati visivi vanno revisionati.
- Il progetto contiene ancora il vecchio contenuto dist/ tracciato in Git per compatibilità con l'assetto corrente. Non editarlo a mano; il workflow genera e pubblica una build nuova. La sua rimozione verrà fatta soltanto dopo aver verificato la nuova sorgente Pages.
- I test di qualità non sostituiscono il test di autenticazione e CRUD con un utente Supabase di staging. Non eseguire test distruttivi sul database con dati reali.
- La sincronizzazione alla release applicativa 1.3.0 resta un'attività separata: questa PR mette in piedi i gate sul codice presente ora in main e non deve essere interpretata come aggiornamento di tutti i moduli dell'app.
