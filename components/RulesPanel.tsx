import { SuitIcon } from "./SuitIcon";

export function RulesPanel({
  onClose,
  opponentLabel = "il CPU",
  variant = "cpu",
}: {
  onClose: () => void;
  opponentLabel?: string;
  variant?: "cpu" | "online";
}) {
  return (
    <div className="rounded-xl bg-black/40 border border-white/15 p-4 text-sm leading-relaxed space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base">Come si gioca</h2>
        <button onClick={onClose} className="text-amber-100/60 hover:text-amber-100">
          Chiudi
        </button>
      </div>
      <p>
        <strong>Ti Vitti</strong> (&quot;ti ho visto&quot;) è un tradizionale gioco di carte
        siciliano e calabrese, giocato con un mazzo da 40 carte. In questa versione
        digitale affronti {opponentLabel} seguendo un adattamento fedele delle regole
        classiche.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Il mazzo viene diviso a metà, a faccia in giù, tra te e {opponentLabel}. Non
          conosci le tue carte finché non le giri.
        </li>
        <li>
          Al tuo turno peschi la carta in cima al tuo mazzo. Se è un <strong>Asso</strong>,
          apri una nuova fondazione al centro e peschi di nuovo.
        </li>
        <li>
          Se la carta continua una fondazione dello stesso seme (es. un 5 di Denari
          su un 4 di Denari), puoi giocarla lì e pescare ancora.
        </li>
        <li>
          Se la carta è di un valore adiacente (+1 o −1) alla carta in cima alla
          pila di scarti dell&apos;avversario, puoi scaricarla lì e pescare ancora.
        </li>
        <li>
          Se non puoi fare nessuna di queste mosse, la carta è &quot;morta&quot; e va
          scartata sulla tua pila: il turno passa all&apos;avversario.
        </li>
        <li>
          <strong>La cima della tua pila resta viva</strong>: quando ti serve
          puoi anche giocarla, non solo la carta appena girata. Se combacia
          con una fondazione o è adiacente alla cima della pila
          dell&apos;avversario, spostala lì e continua il turno.
        </li>
        <li>
          <strong>Quando finisce il mazzo, non è finita</strong>: se hai
          ancora carte sulla tua pila, la giri tutta com&apos;è (senza
          rimescolare) e torna a essere il tuo mazzo da pescare. Si continua
          così finché quella pila non si svuota per davvero.
        </li>
        <li>
          <strong>I tre pulsanti restano sempre disponibili</strong>: sta a te
          capire dove la carta può andare davvero. Se la piazzi dove non ci
          sta, non ci arriva — finisce sui tuoi scarti — ed è un errore come
          gli altri.
        </li>
        <li>
          {variant === "cpu" ? (
            <>
              Il CPU non perdona: ogni tuo errore — carta giocabile scartata
              oppure piazzata dove non poteva andare — se lo becca subito e ti
              costa 3 carte di penalità.
            </>
          ) : (
            <>
              Nessuno viene penalizzato in automatico: se {opponentLabel}{" "}
              sbaglia, la penalità scatta solo se te ne accorgi e gridi
              &quot;Ti vitti!&quot; prima di pescare la tua carta successiva. E
              vale anche al contrario.
            </>
          )}
        </li>
        <li>
          <strong>Il pulsante &quot;Ti vitti!&quot; è sempre lì</strong>, anche
          quando non c&apos;è niente da cogliere: nessuno ti avvisa che
          {variant === "cpu" ? " il CPU " : ` ${opponentLabel} `}
          ha sbagliato, devi vederlo tu. Ma occhio — se gridi a vuoto, le 3
          carte di penalità te le prendi tu.
        </li>
        <li>
          Vince chi esaurisce per primo <strong>tutte</strong> le proprie
          carte — mazzo e pila, entrambi a zero.
        </li>
      </ul>
      <div className="flex items-center gap-2 pt-1 text-amber-100/60 text-xs">
        <SuitIcon suit="denari" className="w-4 h-4" />
        <SuitIcon suit="coppe" className="w-4 h-4" />
        <SuitIcon suit="spade" className="w-4 h-4" />
        <SuitIcon suit="bastoni" className="w-4 h-4" />
        <span>Denari, Coppe, Spade, Bastoni — Fante=8, Cavallo=9, Re=10.</span>
      </div>
    </div>
  );
}
