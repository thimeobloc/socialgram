# Audit backend — Socialgram

## 1. Risques et problèmes de sécurité

| Fichier / ligne | Problème | Correction envisagée |
|---|---|---|
| `account.ts` — `/auth/register` | Les données d'inscription sont vérifiées avec des `typeof`, mais il n'y a pas de schéma Zod complet pour `email`, `username` et `password`. | Utiliser un schéma Zod unique pour valider et normaliser toutes les données entrantes. |
| `account.ts` — `/auth/login` | Les données reçues par le login ne sont pas validées avant d'être utilisées. | Valider `email` et `password` avec Zod avant l'accès à la base. |
| `account.ts` — `/auth/register` | `bcrypt.hashSync()` est synchrone et peut bloquer l'event loop lors de plusieurs inscriptions simultanées. | Utiliser la version asynchrone de bcrypt. |
| `account.ts` — `/auth/register` | Deux recherches (`email` puis `username`) sont effectuées avant la création. Cela ne protège pas complètement contre une condition de concurrence. | Conserver les contraintes `@unique` de Prisma et gérer les erreurs d'unicité lors du `create`. |
| `likes.ts` — `POST /posts/:id/like` | Aucun contrôle n'empêche un utilisateur de liker plusieurs fois le même post si la base n'impose pas d'unicité `(postId, userId)`. | Ajouter une contrainte unique composite `postId + userId` et gérer le conflit. |
| `likes.ts` — `POST /posts/:id/like` | Le post n'est pas vérifié explicitement avant la création du like. | Vérifier l'existence du post ou gérer proprement la contrainte de relation Prisma. |
| `posts.ts` — upload image | Le type MIME fourni par le client est utilisé pour contrôler le fichier. Il peut être falsifié. | Vérifier également la signature réelle du fichier (magic bytes) avec une librairie adaptée. |
| `posts.ts` — upload image | Les fichiers sont stockés directement sur le serveur local. Cette solution devient fragile avec plusieurs instances du backend. | À terme, utiliser un stockage dédié (S3 ou équivalent) et conserver uniquement l'URL en base. |
| `posts.ts` — `handleCreatePost` | La création du post n'est pas entourée d'un `try/catch`. Une erreur Prisma peut provoquer une réponse serveur non maîtrisée. | Centraliser la gestion des erreurs avec un middleware Express. |
| `comments.ts` — création | `content` est contrôlé mais n'a pas de longueur maximale. Un utilisateur peut envoyer un contenu très volumineux. | Ajouter une limite de taille côté backend. |
| `users.ts` — `PATCH /users/:id` | Le contrôle d'accès est correctement réalisé avec `req.userId !== id`, mais la route dépend entièrement de `authenticate`. | Conserver ce contrôle côté backend et ajouter des tests d'autorisation. |
| `posts.ts` — `DELETE /posts/:id` | Le contrôle de propriété est présent et vérifié côté backend (`post.authorId !== userId`). | Conserver ce contrôle et ajouter des tests pour vérifier qu'un utilisateur ne peut pas supprimer le post d'un autre. |

### Données exposées

Les réponses API ne renvoient pas le champ `password` hashé, ce qui est correct.

Cependant, certaines routes renvoient directement des objets Prisma complets :

- `POST /posts` retourne directement `post`.
- `POST /posts/:id/like` retourne directement `like`.
- `GET /users/:id/posts` retourne directement les posts.

Il serait préférable de définir explicitement les champs retournés par chaque endpoint afin d'éviter d'exposer involontairement de nouvelles données si le modèle Prisma évolue.

---

## 2. Ce qui ne tiendra pas à 500 posts

500 posts reste une volumétrie faible pour PostgreSQL/MySQL, mais plusieurs choix actuels peuvent devenir problématiques lorsque le nombre de données augmente.

| Fichier / ligne | Problème | Correction envisagée |
|---|---|---|
| `posts.ts` — `GET /posts` | La pagination utilise `skip` / `take`. Avec beaucoup de pages, `OFFSET` devient progressivement moins performant. | Passer à une pagination par curseur basée sur `createdAt` + `id`. |
| `posts.ts` — `GET /posts` | `prisma.post.count()` est exécuté à chaque récupération du feed. | Éviter le `count` systématique ou le rendre optionnel selon le besoin du frontend. |
| `posts.ts` — `GET /posts` | Le feed charge les posts et leurs compteurs avec `_count`, ce qui augmente le coût de la requête. | Conserver la sélection minimale et optimiser les index/requêtes si le volume augmente. |
| `posts.ts` — `GET /posts/:id` | Les commentaires d'un post sont chargés sans pagination. Un post très commenté peut produire une réponse très importante. | Paginer les commentaires. |
| `users.ts` — `GET /users/:id/posts` | Tous les posts d'un utilisateur sont retournés sans pagination. | Ajouter `page` / `limit` ou une pagination par curseur. |
| `users.ts` — `GET /users/:id/posts` | Les posts sont retournés directement depuis Prisma sans sélection des champs. | Utiliser `select` pour limiter la taille des réponses. |
| `posts.ts` — `GET /posts` | La pagination repose sur `skip`, donc chaque page profonde devient plus coûteuse. | Utiliser un curseur (`createdAt`, `id`). |
| `posts.ts` — images | Les images sont stockées sur le disque local du serveur. | Externaliser les fichiers vers un stockage objet/CDN. |

### Indexation

Avec l'augmentation du volume, les champs utilisés pour rechercher et trier doivent être correctement indexés.

À vérifier / ajouter selon le schéma Prisma :

- `Post.createdAt`
- `Post.authorId`
- `Comment.postId`
- `Like.postId`
- `Like.userId`
- contrainte unique composite `Like(postId, userId)`

À 500 posts, les performances resteront probablement acceptables, mais ces choix évitent de construire une architecture qui devra être entièrement revue lorsque le volume augmentera.

---

## 3. Comment découper le code avec une semaine de plus

Le backend fonctionne actuellement, mais plusieurs responsabilités sont regroupées directement dans les fichiers de routes.

### Découpage envisagé

```text
src/
├── routes/
│   ├── account.routes.ts
│   ├── posts.routes.ts
│   ├── comments.routes.ts
│   ├── likes.routes.ts
│   └── users.routes.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── posts.controller.ts
│   ├── comments.controller.ts
│   ├── likes.controller.ts
│   └── users.controller.ts
│
├── services/
│   ├── auth.service.ts
│   ├── posts.service.ts
│   ├── comments.service.ts
│   ├── likes.service.ts
│   └── users.service.ts
│
├── schemas/
│   ├── auth.schema.ts
│   ├── post.schema.ts
│   ├── comment.schema.ts
│   └── user.schema.ts
│
├── middlewares/
│   ├── authenticate.ts
│   ├── upload.ts
│   └── errorHandler.ts
│
└── config/
    └── prisma.ts
```

### Principales améliorations

| Zone | Problème actuel | Découpage envisagé |
|---|---|---|
| Routes | Les routes contiennent validation, logique métier et accès Prisma. | Routes uniquement responsables du routage. |
| Validation | Validation répartie dans les handlers. | Schémas Zod centralisés. |
| Base de données | Accès Prisma directement dans les routes. | Déplacer la logique métier dans des services. |
| Erreurs | Chaque route gère les erreurs différemment. | Middleware global de gestion des erreurs. |
| Upload | Configuration Multer directement dans `posts.ts`. | Middleware d'upload séparé. |
| Authentification | Logique d'authentification utilisée dans les routes. | Middleware et service d'authentification séparés. |
| Réponses API | Certains endpoints retournent directement les objets Prisma. | DTO / réponses API explicites. |
| Tests | Les contrôles d'accès et validations doivent être vérifiés manuellement. | Ajouter des tests unitaires et d'intégration pour auth, suppression, likes et validation. |

---

## Priorités si une semaine supplémentaire est disponible

### Priorité 1 — Sécurité

1. Centraliser la validation Zod.
2. Ajouter une contrainte unique sur `(postId, userId)` pour les likes.
3. Vérifier les fichiers uploadés avec leur contenu réel.
4. Ajouter des tests sur les contrôles d'accès.
5. Mettre en place un middleware global de gestion des erreurs.

### Priorité 2 — Scalabilité

1. Ajouter la pagination aux posts utilisateur.
2. Paginer les commentaires.
3. Remplacer progressivement `skip/take` par une pagination par curseur.
4. Vérifier les index Prisma.
5. Externaliser le stockage des images.

### Priorité 3 — Architecture

1. Séparer routes / controllers / services.
2. Centraliser les schemas Zod.
3. Définir les réponses API avec des DTO explicites.
4. Ajouter des tests d'intégration.
5. Documenter les endpoints API.

---

## Conclusion

Le backend possède déjà plusieurs bonnes bases : authentification des routes sensibles, contrôle de propriété lors des suppressions, validation de certaines entrées, limitation des images et pagination du feed.

Les principaux risques sont actuellement la **validation incomplète des entrées**, la **gestion des uploads**, l'absence potentielle d'**unicité sur les likes**, ainsi que plusieurs endpoints qui retournent directement des objets Prisma.

À 500 posts, le backend peut fonctionner correctement, mais la pagination sans curseur, les réponses non limitées et le chargement non paginé des commentaires/posts utilisateurs constituent les principaux points à anticiper.

Avec une semaine supplémentaire, la priorité serait de séparer **routes, controllers, services et validation**, puis d'ajouter des tests d'autorisation et d'améliorer la pagination et la gestion des fichiers.