# 🚀 Roadmap Feature - Final Setup Checklist

## Pre-Launch Verification

### ✅ Backend Configuration

- [ ] **Environment Variables** (.env file)
  ```env
  NVIDIA_API_KEY=your_actual_key_here
  FIREBASE_PROJECT_ID=nexus-os-e49a9
  PORT=5000
  NODE_ENV=development
  FRONTEND_URL=http://localhost:5173
  MONGO_URI=your_mongodb_connection_string
  ```

- [ ] **Dependencies Installed**
  ```bash
  cd backend
  npm install
  npm install -g nodemon  # for development
  ```

- [ ] **Server Can Start**
  ```bash
  npm start  # Should see: 🚀 Server running on http://localhost:5000
  ```

- [ ] **Database Connected**
  - Check MongoDB Atlas connection
  - Ensure collections exist or will be created

### ✅ Frontend Configuration

- [ ] **Dependencies Installed**
  ```bash
  cd frontend
  npm install
  ```

- [ ] **API Endpoint Correct** (frontend/src/services/api.js)
  ```javascript
  baseURL: 'http://localhost:5000/api'
  ```

- [ ] **Firebase Configuration** (frontend/src/firebase.js)
  - Valid Firebase project ID
  - Correct authentication domain

- [ ] **Dev Server Can Start**
  ```bash
  npm run dev  # Should see: ✓ ready in XXXms
  ```

### ✅ Database Schema

- [ ] **Career Collection Exists**
  - Can create documents with roadmap structure
  - Indexes created for userUid and domain

### ✅ Authentication

- [ ] **Firebase Authentication Working**
  - User can sign up
  - User can log in
  - Token is generated
  - Token passed in Authorization header

- [ ] **Backend Auth Middleware**
  - Verifies Firebase tokens
  - Extracts user UID correctly

### ✅ AI Integration

- [ ] **NVIDIA API Key Valid**
  ```bash
  # Test with curl
  curl -X POST https://integrate.api.nvidia.com/v1/chat/completions \
    -H "Authorization: Bearer YOUR_NVIDIA_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning","messages":[{"role":"user","content":"Hello"}]}'
  ```

- [ ] **geminiClient.js Configured**
  - Uses NVIDIA_API_KEY
  - Correct model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
  - Temperature: 0.6 for generation, 0.2 for retry

---

## Testing the Feature

### 1️⃣ **Test User Authentication**

```bash
# In browser console after logging in:
localStorage.getItem('nexus_token')  # Should show token
localStorage.getItem('nexus_user')   # Should show user data
```

### 2️⃣ **Test API Endpoints**

```bash
# Get auth token first (from browser localStorage)
TOKEN="your_firebase_token"

# Test 1: Get market insights (public)
curl http://localhost:5000/api/careers/market-insights \
  -H "Content-Type: application/json"

# Test 2: Get user roadmaps (requires auth)
curl http://localhost:5000/api/careers/my-roadmaps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test 3: Generate roadmap (requires auth, takes 30-60 seconds)
curl -X POST http://localhost:5000/api/careers/generate-roadmap \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"Full Stack Developer"}' \
  --max-time 120
```

### 3️⃣ **Test UI Flow**

1. Navigate to http://localhost:5173/roadmap
2. Should see "No roadmaps yet" message
3. Click "New Roadmap" button
4. Enter career (e.g., "Python Backend Developer")
5. Wait for generation (should show "AI is crafting your roadmap...")
6. Should see roadmap with phases
7. Click on phases to expand and view details
8. Try marking phases as complete
9. Try deleting roadmap

### 4️⃣ **Test Error Scenarios**

- [ ] **Without auth token**: Should see "Not authorized" error
- [ ] **Without NVIDIA key**: Should see "AI service is not configured"
- [ ] **Empty career query**: Should see "Career query is required"
- [ ] **AI timeout**: Should show user-friendly timeout message
- [ ] **Malformed AI response**: Should auto-retry with stricter prompt

---

## Performance Benchmarks

| Operation | Expected Time | Status |
|-----------|---------------|--------|
| Generate roadmap | 30-60 sec | ⏳ |
| Fetch user roadmaps | <1 sec | ✅ |
| Get market insights | <1 sec | ✅ |
| Delete roadmap | <1 sec | ✅ |
| Page load | <3 sec | ✅ |

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "AI service not configured" | NVIDIA_API_KEY missing | Add key to .env |
| "Not authorized" | No auth token | Log in first |
| "Empty response" | AI timeout | Retry or check API status |
| "JSON parse error" | Malformed AI response | Auto-retry handles this |
| CORS error | Wrong FRONTEND_URL | Check .env FRONTEND_URL |
| "Roadmap not found" | MongoDB not configured | Start MongoDB connection |

---

## Development Commands

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend (different terminal/tab)
cd frontend
npm run dev

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# Roadmap page: http://localhost:5173/roadmap
```

---

## File Locations Reference

```
backend/
├── controllers/
│   └── careerController.js      ← ✅ FIXED: generateRoadmap()
├── routes/
│   └── careerRoutes.js          ← API endpoints
├── models/
│   └── Career.js                ← Roadmap schema
├── middleware/
│   └── firebaseAuthMiddleware.js ← Auth verification
├── utils/
│   └── geminiClient.js          ← NVIDIA API client
├── server.js                    ← Express app
└── .env                         ← Environment variables

frontend/
├── src/
│   ├── pages/
│   │   └── Roadmap.jsx          ← UI component
│   ├── services/
│   │   ├── adviceService.js     ← API methods
│   │   └── api.js               ← Axios config
│   └── context/
│       └── AuthContext.jsx      ← Auth state
└── .env                         ← Frontend config (optional)
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set on production server
- [ ] NVIDIA_API_KEY is valid and not shared publicly
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Firebase authentication domain includes production URL
- [ ] CORS origin set to production frontend URL
- [ ] Error logging configured
- [ ] Database backups enabled
- [ ] Rate limiting implemented on /generate-roadmap endpoint

---

## Monitoring & Logs

### Check backend logs:
```bash
# In server output, look for:
# 🤖 Calling NVIDIA AI: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning...
# ✅ Roadmap generated successfully
# ❌ Errors will show with 📨 log prefix
```

### Check frontend errors:
```javascript
// Browser console (F12)
// Look for network errors in Network tab
// Check for console.error() messages
```

---

## Success Indicators

Once everything is working:

1. ✅ User can generate roadmap without errors
2. ✅ Roadmap displays all phases with details
3. ✅ User can view resources with correct links
4. ✅ Progress tracking works (mark phases complete)
5. ✅ Deletion works and removes from database
6. ✅ Subsequent same-career queries return cached version
7. ✅ No console errors or warnings
8. ✅ Response times are reasonable (<2 seconds for cached data)
9. ✅ UI is responsive and animations smooth
10. ✅ Error messages are user-friendly

---

## Next Steps

1. ✅ Verify all files are saved correctly
2. ✅ Test backend endpoints with curl
3. ✅ Test frontend UI in browser
4. ✅ Test with different career inputs
5. ✅ Test error scenarios
6. ✅ Monitor performance
7. ✅ Deploy to production when ready

---

**Last Updated**: May 11, 2026  
**Status**: ✅ **READY FOR TESTING**

