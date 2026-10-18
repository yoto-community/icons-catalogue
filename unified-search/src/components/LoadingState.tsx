export function LoadingState() {
  return (
    <div className="app loading">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon" aria-hidden="true">🔍</span>
            Yoto Icons Catalogue
          </h1>
        </div>
      </header>
      <main className="main">
        <div className="loading-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Chargement de l'index des icônes…</p>
          <p className="loading-hint">Première visite ? L'index (~50KB) se charge une seule fois.</p>
        </div>
      </main>
    </div>
  );
}