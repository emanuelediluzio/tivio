# Ti Vitti 🃏

Una versione digitale di **Ti Vitti** ("ti ho visto"), il tradizionale gioco di
carte siciliano e calabrese, giocata contro il CPU. Costruita con Next.js (App
Router), TypeScript e Tailwind CSS.

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
- Se scarti una carta quando invece potevi giocarla, il CPU grida **"Ti
  vitti!"** e ti penalizza con 3 carte in più. Se è il CPU a sbagliare, puoi
  gridarlo tu cliccando il pulsante che appare.
- Vince chi esaurisce per primo il proprio mazzo.

Le regole complete sono consultabili anche dentro l'app tramite il pulsante
**Regole**.

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
