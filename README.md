# Ti Vitti 🃏

Una versione digitale di **Ti Vitti** ("ti ho visto"), il tradizionale gioco di
carte siciliano e calabrese. Si gioca contro il CPU oppure online con un amico
tramite un link/codice condiviso. Costruita con Next.js (App Router),
TypeScript e Tailwind CSS.

Fonte delle regole originali: [Ti vitti – Wikipedia](https://it.wikipedia.org/wiki/Ti_vitti).

## Come si gioca

Il mazzo da 40 carte (Denari, Coppe, Spade, Bastoni) viene diviso a metà, a
faccia in giù, tra te e il CPU.

- Al tuo turno peschi la carta in cima al tuo mazzo.
- Un **Asso** apre una nuova fondazione al centro e ti fa pescare di nuovo.
- Una carta che continua una fondazione dello stesso seme (es. un 5 di Denari
  su un 4 di Denari) si gioca lì e fa pescare di nuovo.
- Una carta di valore adiacente (+1/−1) alla cima della pila di scarti
  dell'avversario si può scaricare lì, con un'altra pescata di bonus.
- Se nessuna di queste mosse è possibile, la carta è "morta" e va scartata
  sulla tua pila: il turno passa all'avversario.
- Vince chi esaurisce per primo il proprio mazzo.

### Niente aiutini

Il cuore del gioco è accorgersi da soli di cosa si può fare, quindi
l'interfaccia non risponde mai al posto tuo:

- **I tre pulsanti sono sempre tutti presenti**, anche quando la mossa non è
  legale. Se piazzi la carta dove non ci sta, non ci arriva — finisce sui tuoi
  scarti — ed è un errore esattamente come scartare una carta ancora giocabile.
- **Nel log le due cose sono indistinguibili da uno scarto normale.** Chi
  guarda deve valutare da sé se quella carta era ancora viva.
- **Il pulsante "Ti vitti!" è sempre disponibile**, anche quando non c'è nulla
  da cogliere: nessuno ti avvisa che l'avversario ha sbagliato. Ma gridare a
  vuoto costa — le 3 carte di penalità le prendi tu.

Contro il CPU la penalità è immediata (non si distrae mai quando tocca a te);
online invece scatta solo se l'avversario se ne accorge in tempo.

Le regole complete sono consultabili anche dentro l'app tramite il pulsante
**Regole**.

## Modalità online

La modalità "Gioca online con un amico" collega due browser via WebRTC
(libreria [PeerJS](https://peerjs.com/), usando il suo broker cloud gratuito
solo per l'handshake iniziale — i dati della partita viaggiano poi
direttamente tra i due browser, senza passare da un backend). Chi crea la
stanza ottiene un codice a 5 caratteri e un link da condividere; l'altro
giocatore inserisce il codice o apre direttamente il link.

Essendo una connessione peer-to-peer diretta, funziona bene sulla maggior
parte delle reti domestiche/mobili ma può occasionalmente non riuscire a
stabilirsi su reti aziendali molto restrittive (senza un server TURN di
fallback). Se la stanza resta bloccata su "connessione in corso" per molto
tempo, è probabile che sia questo il caso.

## Sviluppo

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

Altri comandi utili:

```bash
npm run lint    # ESLint
npm run build   # build di produzione
npm start       # avvia la build di produzione
```

## Deploy su Vercel

Il progetto è un'app Next.js standard, pronta per il deploy su
[Vercel](https://vercel.com/new): basta importare questo repository, Vercel
rileva automaticamente il framework e non servono variabili d'ambiente.
