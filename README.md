# Media Ranking App

A modern web application for discovering, ranking, and organizing your favorite media across multiple categories including movies, TV shows, books, and video games.

## Features

- **Multi-Media Search**: Search across movies, TV shows, books, and video games using integrated APIs
- **Personal Rankings**: Create and manage your own ranked lists of media
- **User Authentication**: Secure login system with Firebase Authentication
- **Dark/Light Theme**: Toggle between dark and light themes for comfortable viewing
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI components
- **Real-time Data**: Live search results from multiple media APIs

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd media-ranking-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_MOVIES_API_KEY=your_tmdb_api_key
VITE_GAMES_API_KEY=your_games_api_key
VITE_GAMES_API_BASE_URL=your_games_api_base_url
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── Header.tsx      # App header with theme toggle
│   ├── Navigation.tsx  # Tab navigation
│   ├── SearchTab.tsx   # Media search functionality
│   ├── RankingsTab.tsx # User rankings display
│   ├── ProfileTab.tsx  # User profile management
│   └── ...
├── contexts/           # React contexts
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── lib/                # Library configurations
└── styles/             # Global styles
```

## API Integration

The app integrates with multiple APIs to provide comprehensive media search:

- **Movies & TV Shows**: The Movie Database (TMDB) API
- **Books**: Google Books API
- **Video Games**: IGDB API (via Vercel serverless function)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Updates

Outlines improvements that are on the roadmap for future releases. These updates are intended to enhance user experience, expand media coverage, and introduce new ways to interact with your rankings and profile.

1. Music (track, albums, artist) search and Rankings
2. Drag & Drop ranking changes (move rankings around manually)
3. Family Profiles
4. User settings
5. Unit & Integration Tests

## License

This project is licensed under the MIT License - see the LICENSE file for details.
