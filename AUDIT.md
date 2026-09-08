# Audit du backend 

## 1. Ce qui est dangereux

- `src/routes.ts:156` — `DELETE /posts/:id` ne vérifie jamais que l'utilisateur
  connecté est l'auteur du post. N'importe quel compte peut supprimer le post
  de n'importe qui. Il faut comparer `post.authorId` au `userId` du token et
  renvoyer 403 sinon.
- `src/routes.ts:195` — même problème sur `DELETE /comments/:id`, aucun contrôle
  d'auteur.
- `src/routes.ts:248` — `GET /users/:id` fait `res.json(user)` sur l'objet Prisma
  complet, donc renvoie le hash du mot de passe et l'email. Ne renvoyer que
  `id`, `username`, `createdAt`.
- `src/auth.ts:8` — le token est signé sans `expiresIn` (le commentaire au dessus
  dit d'ailleurs "no expiration"). Un token volé reste valable indéfiniment.
- `src/auth.ts:4` — `JWT_SECRET` a une valeur par défaut en dur si la variable
  d'environnement est absente. Le serveur devrait refuser de démarrer sans secret.
- `src/routes.ts:24` et `src/routes.ts:49` — `register` et `login` ne valident
  aucun champ. Si `password` est absent, `bcrypt` lève et on part en 500.
- `src/routes.ts:28` — les erreurs métier (email déjà pris, identifiants faux...)
  sont renvoyées en HTTP 200 avec `{ error: "..." }`. Le front ne peut pas se
  fier au status. Renvoyer 409 / 401 selon le cas.
- `src/routes.ts:16` — le fichier uploadé est enregistré sous
  `Date.now() + "-" + file.originalname` sans nettoyage du nom ni contrôle de
  type / taille.

## 2. Ce qui ne tiendra pas à 500 posts

- `src/routes.ts:85` — `GET /posts` boucle sur tous les posts et fait, pour
  chacun, 3 requêtes SQL séparées (auteur, nombre de likes, nombre de
  commentaires). Avec 500 posts ça fait environ 1500 requêtes par appel. Et il
  n'y a aucune pagination. À refaire avec un seul `findMany` + `include` +
  `_count`, plus `take` / `skip` ou un curseur.
- `src/routes.ts:255` — `GET /users/:id/posts` renvoie tous les posts de
  l'utilisateur, pas de pagination non plus.
- `src/routes.ts:143` — `GET /posts/:id` : si l'id n'existe pas, `post` vaut
  `null` et la ligne `post.id` plante. On tombe en 500 au lieu d'un 404 propre.
- `prisma/schema.prisma` — la table `Like` n'a pas de contrainte d'unicité sur
  `(postId, userId)`. Rien n'empêche de liker plusieurs fois le même post, le
  compteur devient faux. Même chose pour `Follow`.
- `src/routes.ts:99` vs `src/routes.ts:146` — le feed renvoie `created_at`, le
  détail renvoie `createdAt`. Deux noms pour la même donnée, le front doit gérer
  les deux.

## 3. Comment je découperais ce code

- `tsconfig.json` a `"strict": false`, et `src/auth.ts` utilise `any` et
  `(req as any).userId`. Je passerais en strict et j'ajouterais une déclaration
  de type pour `req.userId` / `req.userRole`.
- `src/routes.ts` fait 266 lignes : la config multer, tous les handlers et le
  routing sont dans le même fichier. Je séparerais par domaine (auth, posts,
  comments, likes, users) avec les handlers dans des fonctions à part.
- Aucune couche de validation. J'ajouterais des schémas (zod) pour valider les
  bodies reçus avant de toucher à la base.
- Nommage incohérent : `fetch_user` en snake_case alors que le reste est en
  camelCase. `login` est écrit en `.then/.catch`, le reste en `async/await`.
- Aucun test, aucune documentation d'API (pas de Swagger, pas de contrat).
