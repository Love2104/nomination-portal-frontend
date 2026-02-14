# IITK Election Commission - Frontend

Modern, responsive frontend for the IITK Election Commission Nomination Portal built with React and Vite.

## Features

- ✅ Role-based dashboards (Student, Candidate, Reviewer, Superadmin)
- ✅ OTP-based registration with email verification
- ✅ Secure JWT authentication
- ✅ Nomination filing and management
- ✅ Supporter request system
- ✅ Manifesto upload (PDF)
- ✅ Multi-phase review system
- ✅ Superadmin control panel
- ✅ Responsive design
- ✅ Modern dark theme UI

## Prerequisites

- Node.js (v16 or higher)
- Backend API running on port 5000

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

## Running the Application

### Development mode:
```bash
npm run dev
```

The app will run on `http://localhost:5173`

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/              # Page components
│   │   ├── Register.jsx
│   │   ├── Login.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── CandidateDashboard.jsx
│   │   ├── ReviewerLogin.jsx
│   │   ├── ReviewerDashboard.jsx
│   │   └── SuperadminDashboard.jsx
│   ├── components/         # Reusable components
│   ├── utils/             # Utility functions
│   │   ├── api.js         # Axios instance
│   │   └── auth.js        # Auth helpers
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## User Flows

### Student Registration
1. Navigate to `/register`
2. Enter IITK email (@iitk.ac.in)
3. Receive OTP via email
4. Enter OTP and complete profile
5. Login and access student dashboard

### Candidate Nomination
1. Login as student
2. Upgrade to candidate role
3. Fill nomination form
4. Select positions
5. Upload manifestos (Phase 1, 2, Final)
6. Manage supporter requests

### Supporter Request
1. Login as student
2. Browse candidates
3. Request supporter role (Proposer/Seconder/Campaigner)
4. Wait for candidate approval

### Reviewer Access
1. Navigate to `/reviewer/login`
2. Enter phase-specific credentials (provided by superadmin)
3. View manifestos for assigned phase
4. Add comments

### Superadmin Control
1. Login with superadmin account
2. Access `/superadmin`
3. Configure deadlines
4. Set supporter limits
5. Manage reviewer credentials
6. View statistics
7. Export data

## API Integration

The frontend communicates with the backend API using Axios. All API calls are made through the `src/utils/api.js` module which handles:

- Authentication token injection
- Error handling
- Token expiration redirect

## Styling

The application uses a custom CSS design system with:
- CSS variables for theming
- Dark mode by default
- Glassmorphism effects
- Smooth animations
- Responsive grid system
- Utility classes

## Authentication

Authentication is handled via JWT tokens stored in localStorage:
- Token is automatically attached to API requests
- Expired tokens trigger automatic logout
- Role-based route protection

## Development Tips

1. **Hot Module Replacement**: Vite provides instant HMR for fast development
2. **API Proxy**: Vite proxies `/api` requests to `http://localhost:5000`
3. **Environment Variables**: Use `import.meta.env.VITE_*` for env vars

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
