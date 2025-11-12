### Important Commands

```bash
# Install Firebase SDK
npm install firebase

# Development
npm run dev

# Production build
npm run build:prod

# Preview production build
npm run preview
```


### Firebase Imports Reference

```javascript
// Firestore
import { db } from './lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'

// Authentication (for future use)
import { getAuth } from 'firebase/auth'

// Storage (for future use)
import { getStorage } from 'firebase/storage'