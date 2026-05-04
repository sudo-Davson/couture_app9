# Couture App

PWA mobile-first pour couturieres professionnelles. Donnees sauvegardees dans Firebase Auth + Firestore avec cache offline.

## Structure Firestore

```text
users/{userId}/clients/{clientId}
users/{userId}/orders/{orderId}
```

Chaque utilisateur lit et ecrit uniquement dans son espace.

## Configuration Firebase

1. Creez un projet sur Firebase Console.
2. Activez Authentication > Sign-in method > Phone.
3. Activez Firestore Database.
4. Copiez `.env.example` vers `.env.local`.
5. Collez les valeurs de configuration Web Firebase.
6. Dans Authentication > Settings > Authorized domains, ajoutez `localhost`.

## Regles Firestore conseillees

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrez `http://localhost:3000`.
