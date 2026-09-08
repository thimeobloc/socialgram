
### Règles de la ligne de titre

- **Structure** : `type(scope): description`
- **description** : à l'impératif présent, en minuscule, **sans point final**,
  72 caractères maximum.
- Le titre doit décrire ce que fait le commit, pas ce que faisait l'ancien code.

### Types autorisés

| Type       | Usage |
|------------|-------|
| `feat`     | nouvelle fonctionnalité |
| `fix`      | correction de bug |
| `refactor` | modification sans changement de comportement |
| `docs`     | documentation uniquement |
| `test`     | ajout ou modification de tests |
| `style`    | formatage, lint, sans impact logique |
| `perf`     | amélioration de performance |
| `chore`    | outillage, config, dépendances |
| `ci`       | intégration continue |

### Scope

Zone touchée par le commit : `backend`, `frontend`, ou un module précis
(`auth`, `posts`, `comments`, `likes`, `follow`, `prisma`, …).
Le scope est recommandé ; il peut être omis si le changement est transverse.

### Exemples

✅ Corrects
