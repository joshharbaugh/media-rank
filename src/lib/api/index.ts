import {
  BOOKS_API_KEY,
  BOOKS_API_BASE_URL,
  MOVIES_API_KEY,
  MOVIES_API_BASE_URL,
} from '@/lib/constants';

export const searchBooks = async (query: string) => {
  const response = await fetch(
    `${BOOKS_API_BASE_URL}/books/v1/volumes?q=${query}&key=${BOOKS_API_KEY}`
  );
  return response.json();
};

export const searchMovies = async (query: string) => {
  const response = await fetch(
    `${MOVIES_API_BASE_URL}/search/movie?api_key=${MOVIES_API_KEY}&query=${query}&region=US`
  );
  return response.json();
};

export const searchShows = async (query: string) => {
  const response = await fetch(
    `${MOVIES_API_BASE_URL}/search/tv?api_key=${MOVIES_API_KEY}&query=${query}&region=US`
  );
  return response.json();
};

export const searchGames = async (query: string) => {
  const response = await fetch(
    `/api/games?query=${encodeURIComponent(query)}`
  );
  return response.json();
};

// TODO: Implement music search
export const searchMusic = async () => {
  // const response = await fetch(
  //   `/api/music?query=${encodeURIComponent(query)}`
  // );
  // return response.json();
};
