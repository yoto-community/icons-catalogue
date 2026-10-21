# Security Policy

## Périmètre

Ce projet est **100 % statique** : aucune donnée utilisateur n'est envoyée à un
serveur, il n'y a ni compte, ni backend, ni base de données. Les seuls points
d'entrée sont :

- le **frontend** publié sur GitHub Pages (`site/`) ;
- les **scripts** de scraping et de build (`scripts/`), exécutés en CI ou en
  local.

## Versions prises en charge

Seule la branche `main` (dernier déploiement) est maintenue.

## Signaler une vulnérabilité

Merci de **ne pas** créer d'issue publique pour une faille de sécurité.

- Utilisez les [GitHub Security Advisories](https://github.com/yoto-community/icons-catalogue/security/advisories/new)
  (« Report a vulnerability »), ou
- contactez les mainteneurs en privé.

Merci d'inclure : description, impact, étapes de reproduction, et si possible une
correction suggérée. Vous recevrez une réponse dès que possible.

## Bonnes pratiques côté contribution

- Ne jamais committer de secrets (le projet n'en requiert aucun).
- Les dépendances sont surveillées par Dependabot (`.github/dependabot.yml`).
- Les entrées provenant des sources scrapées sont traitées comme **non fiables** :
  validation à la frontière (`scripts/lib/`, guards runtime du frontend).
