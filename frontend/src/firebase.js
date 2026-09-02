import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyA6s2I7WLaTy0zJ3dCzP5iPc-MJF5tZPLo',
  authDomain:        'tiki-topple-game.firebaseapp.com',
  projectId:         'tiki-topple-game',
  storageBucket:     'tiki-topple-game.firebasestorage.app',
  messagingSenderId: '767028601941',
  appId:             '1:767028601941:web:7d6f86c2dca409270120dc',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Offline persistence — Firestore cache works even without network so the
// profile screen still shows stats when the user reopens the app offline.
// Ignore "failed-precondition" (multiple tabs) and "unimplemented" (Safari private).
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
      console.warn('[firestore] persistence disabled:', err.code)
    }
  })
}
