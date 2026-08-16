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
          {variant === "cpu" ? (
            <>
              Attenzione: se scarti una carta quando invece potevi giocarla, il CPU
              grida &quot;Ti vitti!&quot; e ti penalizza con 3 carte in più. Se invece è il
              CPU a sbagliare, puoi gridarlo tu cliccando il bottone che appare — le
              3 carte di penalità passeranno a lui.
            </>
          ) : (
            <>
              Attenzione: se scarti una carta quando invece potevi giocarla, e{" "}
              {opponentLabel} se ne accorge per primo, può gridare &quot;Ti vitti!&quot;
              cliccando il bottone che appare — a te tocca 3 carte di penalità.
              Vale anche al contrario: se ti accorgi tu di una sua svista, gridalo
              prima di pescare la tua prossima carta.
            </>
          )}
        </li>
        <li>Vince chi esaurisce per primo il proprio mazzo.</li>
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
