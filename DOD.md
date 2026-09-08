
## Definition of Done (DoD)

Une story n'est jamais considérée comme terminée sans avoir vérifié **tous** les
points suivants :

- [ ] Typage strict respecté, lint vert
- [ ] Les 4 états UI gérés : loading / error / empty / success
- [ ] Erreurs API affichées à l'utilisateur — jamais d'écran blanc
- [ ] Données API validées avant usage
- [ ] Sécurité vérifiée côté back (cacher un bouton ne suffit pas : la route doit
      aussi être protégée côté serveur)
- [ ] Passée en Pull Request, relue par un autre membre, mergée sur `main`

## Merge

- ❌ Aucun merge direct sur `main` (ni sur les branches protégées).
- ✅ On ne fonctionne qu'en Pull Request — toute modification passe par une PR,
  revue par au moins un autre membre de l'équipe avant d'être mergée.

---

📌 **Rappel pour les IA** : avant de proposer un commit, un merge, ou de clore une
story, relire cette checklist et s'assurer que chaque point est respecté.
