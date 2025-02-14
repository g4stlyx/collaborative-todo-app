# Collaborative Todo App
i saw this and wanted to try it out: https://x.com/usirin/status/1698083797957542147

there is no reason not to convert this into something huge like "notion" btw, firebase's flexibility is insane. i dont think it would be too hard, so i may try to upgrade it.

## to run my demo

navigate to https://collaborative-todo-app-fa611.web.app/ to try it out.

## to run it locally

* clone the repo
* create .env file in the root and add your firebase config (template in env_template file)
* run `npm install`
* run `npm run dev`
* navigate to http://localhost:5173/ to try it out.

## firestore rules:

```

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.friends.hasAny([resource.data.ownerId]));
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.ownerId;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         resource.data.friends.hasAny([request.auth.uid]) ||
         request.resource.data.friends.hasAny([request.auth.uid]));
    }

    match /friendRequests/{requestId} {
      allow read: if request.auth != null &&
        (resource.data.from == request.auth.uid ||
         resource.data.to == request.auth.uid);
      allow create: if request.auth != null &&
        request.resource.data.from == request.auth.uid;
      allow update, delete: if request.auth != null &&
        (resource.data.from == request.auth.uid ||
         resource.data.to == request.auth.uid);
    }
  }
}

service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

```