interface TutorialDialogProps {
  onClose: () => void;
  onStart: () => void;
}

export default function TutorialDialog({
  onClose,
  onStart,
}: TutorialDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="tutorial-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="dialog-close"
          type="button"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>
        <p className="eyebrow">prise en main</p>
        <h2 id="tutorial-title">Trois marchés pour apprendre</h2>
        <ol className="tutorial-steps">
          <li>
            <strong>Explorez</strong>
            <span>Déplacez-vous dans Street View et cherchez des indices.</span>
          </li>
          <li>
            <strong>Placez votre repère</strong>
            <span>Cliquez sur la carte à l’endroit qui vous semble juste.</span>
          </li>
          <li>
            <strong>Comparez</strong>
            <span>La distance avec le marché détermine votre score.</span>
          </li>
        </ol>
        <button
          className="button button--primary"
          type="button"
          onClick={onStart}
        >
          Lancer le tutoriel
        </button>
      </section>
    </div>
  );
}
