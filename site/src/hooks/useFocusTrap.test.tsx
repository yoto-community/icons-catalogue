import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { useFocusTrap } from './useFocusTrap';

function Dialog({ onClose, onDetach }: { onClose: () => void; onDetach?: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(true);
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="détail" tabIndex={-1}>
      <button type="button">Premier</button>
      {onDetach && (
        <button type="button" onClick={onDetach}>
          Détacher
        </button>
      )}
      <button type="button">Milieu</button>
      <button type="button" onClick={onClose}>
        Dernier
      </button>
    </div>
  );
}

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <button type="button">Après</button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </>
  );
}

function EmptyDialog() {
  const ref = useFocusTrap<HTMLDivElement>(true);
  return <div ref={ref} role="dialog" aria-label="vide" tabIndex={-1} />;
}

describe('useFocusTrap', () => {
  it('déplace le focus sur le premier élément focusable à l’ouverture', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Premier' }));
  });

  it('piège la tabulation : Tab sur le dernier revient au premier', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    const last = screen.getByRole('button', { name: 'Dernier' });
    const first = screen.getByRole('button', { name: 'Premier' });
    last.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  it('piège la tabulation : Shift+Tab sur le premier va au dernier', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    const last = screen.getByRole('button', { name: 'Dernier' });
    const first = screen.getByRole('button', { name: 'Premier' });
    first.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it('ne détourne pas le focus au milieu de la modale', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    const middle = screen.getByRole('button', { name: 'Milieu' });
    middle.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(middle);
  });

  it('ignore les touches autres que Tab', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    const first = screen.getByRole('button', { name: 'Premier' });
    const last = screen.getByRole('button', { name: 'Dernier' });
    last.focus();

    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(last);
    expect(document.activeElement).not.toBe(first);
  });

  it('restaure le focus sur le déclencheur à la fermeture', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('button', { name: 'Dernier' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('restaure le focus sur le déclencheur remplacé (identité stable)', () => {
    function DetachingHarness() {
      const [open, setOpen] = useState(false);
      const [detached, setDetached] = useState(false);
      return (
        <>
          {detached ? (
            // `key` différent du déclencheur : force React à monter un nouveau
            // nœud (sinon il réutilise le <button> et le cas « détaché » n'est
            // jamais exercé).
            <button key="replacement" type="button" data-focus-restore="item-1">
              Remplacement
            </button>
          ) : (
            <button
              key="trigger"
              type="button"
              data-focus-restore="item-1"
              onClick={() => setOpen(true)}
            >
              Ouvrir
            </button>
          )}
          {open && <Dialog onClose={() => setOpen(false)} onDetach={() => setDetached(true)} />}
        </>
      );
    }

    render(<DetachingHarness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    fireEvent.click(trigger);

    // Un re-render (ex. chargement progressif) remplace le déclencheur pendant
    // que la modale est ouverte.
    fireEvent.click(screen.getByRole('button', { name: 'Détacher' }));
    expect(screen.queryByRole('button', { name: 'Ouvrir' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dernier' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remplacement' }));
  });

  it('tolère un déclencheur détaché sans marqueur de restauration', () => {
    function NoMarkerHarness() {
      const [open, setOpen] = useState(false);
      const [detached, setDetached] = useState(false);
      return (
        <>
          {detached ? (
            <button key="replacement" type="button">
              Remplacement
            </button>
          ) : (
            <button key="trigger" type="button" onClick={() => setOpen(true)}>
              Ouvrir
            </button>
          )}
          {open && <Dialog onClose={() => setOpen(false)} onDetach={() => setDetached(true)} />}
        </>
      );
    }

    render(<NoMarkerHarness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('button', { name: 'Détacher' }));
    expect(screen.queryByRole('button', { name: 'Ouvrir' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dernier' }));

    // Le déclencheur est détaché et ne porte aucun marqueur : rien n'est
    // focusable, la fermeture ne doit pas lever d'erreur.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(trigger);
  });

  it('retombe sur le déclencheur si aucun remplaçant ne porte le marqueur', () => {
    function WrongMarkerHarness() {
      const [open, setOpen] = useState(false);
      const [detached, setDetached] = useState(false);
      return (
        <>
          {detached ? (
            <span key="replacement" data-focus-restore="autre">
              Remplacement
            </span>
          ) : (
            <button
              key="trigger"
              type="button"
              data-focus-restore="item-1"
              onClick={() => setOpen(true)}
            >
              Ouvrir
            </button>
          )}
          {open && <Dialog onClose={() => setOpen(false)} onDetach={() => setDetached(true)} />}
        </>
      );
    }

    render(<WrongMarkerHarness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('button', { name: 'Détacher' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dernier' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(screen.getByText('Remplacement'));
  });

  it('ramène le focus dans le piège depuis un élément hors conteneur', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    const first = screen.getByRole('button', { name: 'Premier' });
    const last = screen.getByRole('button', { name: 'Dernier' });
    // Bouton hors du conteneur de la modale.
    const outside = screen.getByRole('button', { name: 'Après' });

    // Focus hors du conteneur : Tab doit ramener au premier élément.
    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    // Idem en sens inverse : Shift+Tab ramène au dernier.
    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('ne fait rien tant que le piège est inactif', () => {
    function InactiveDialog() {
      const ref = useFocusTrap<HTMLDivElement>(false);
      return (
        <div ref={ref} role="dialog" aria-label="inactif" tabIndex={-1}>
          <button type="button">Bouton</button>
        </div>
      );
    }

    render(<InactiveDialog />);
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Bouton' }));
  });

  it('ne fait rien si le conteneur n’est pas monté', () => {
    function NoContainer() {
      useFocusTrap<HTMLDivElement>(true);
      return <p>sans conteneur</p>;
    }

    render(<NoContainer />);
    // Aucun conteneur attaché : la fermeture du cycle ne doit rien tenter.
    expect(screen.getByText('sans conteneur')).toBeInTheDocument();
  });

  it('focus le conteneur quand aucun élément n’est focusable', () => {
    const { getByRole } = render(<EmptyDialog />);
    const dialog = getByRole('dialog');

    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(dialog);
  });
});
