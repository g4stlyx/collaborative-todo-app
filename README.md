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
    // Existing todo rules
    match /todos/{todoId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.friends.hasAny([resource.data.ownerId]));
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.ownerId;
    }
    
    // Existing user rules
    match /users/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         resource.data.friends.hasAny([request.auth.uid]) ||
         request.resource.data.friends.hasAny([request.auth.uid]));
    }

    // Existing friend request rules
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
    
    // New rules for pages
    match /pages/{pageId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         resource.data.sharedWith.hasAny([request.auth.uid]) ||
         (resource.data.public == true));
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         (resource.data.sharedWith.hasAny([request.auth.uid]) && 
          resource.data.permissions == "edit"));
      allow delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
    
    // Rules for content blocks
    match /blocks/{blockId} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/pages/$(resource.data.pageId)) &&
        get(/databases/$(database)/documents/pages/$(resource.data.pageId)).data.ownerId == request.auth.uid ||
        get(/databases/$(database)/documents/pages/$(resource.data.pageId)).data.sharedWith.hasAny([request.auth.uid]) ||
        get(/databases/$(database)/documents/pages/$(resource.data.pageId)).data.public == true;
      
      allow create, update: if request.auth != null &&
        exists(/databases/$(database)/documents/pages/$(request.resource.data.pageId)) &&
        (get(/databases/$(database)/documents/pages/$(request.resource.data.pageId)).data.ownerId == request.auth.uid ||
         (get(/databases/$(database)/documents/pages/$(request.resource.data.pageId)).data.sharedWith.hasAny([request.auth.uid]) &&
          get(/databases/$(database)/documents/pages/$(request.resource.data.pageId)).data.permissions == "edit"));
      
      allow delete: if request.auth != null &&
        exists(/databases/$(database)/documents/pages/$(resource.data.pageId)) &&
        get(/databases/$(database)/documents/pages/$(resource.data.pageId)).data.ownerId == request.auth.uid ||
        (get(/databases/$(database)/documents/pages/$(resource.data.pageId)).data.sharedWith.hasAny([request.auth.uid]) &&
         get(/databases/$(database)/documents/pages/$(resource.data.pageId)).data.permissions == "edit");
    }
  }

  // Storage rules remain the same
  service firebase.storage {
    match /b/{bucket}/o {
      match /profile-photos/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Add rules for page attachments
      match /page-attachments/{pageId}/{fileName} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          exists(/databases/$(database)/documents/pages/$(pageId)) &&
          (get(/databases/$(database)/documents/pages/$(pageId)).data.ownerId == request.auth.uid ||
           (get(/databases/$(database)/documents/pages/$(pageId)).data.sharedWith.hasAny([request.auth.uid]) &&
            get(/databases/$(database)/documents/pages/$(pageId)).data.permissions == "edit"));
      }
    }
  }
}

```