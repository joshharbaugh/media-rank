import { Media, MediaType, SearchResultsMovies, SearchResultsShows, SearchResultsBooks, SearchResultsGames } from "@/types";
import { searchBooks, searchGames, searchMovies, searchShows } from "@/lib/api";
import { useState } from "react";
import { getGameBoxart } from "@/utils/helpers";

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchMedia = async (mediaType: MediaType, query: string) => {
    setIsLoading(true);

    if (mediaType === 'movie') {
      const response: SearchResultsMovies = await searchMovies(query);
      const filteredResults = response.results.filter(movie =>
        movie.title.toLowerCase().includes(query.toLowerCase()) &&
        movie.original_language?.toLowerCase() === 'en'
      );

      setSearchResults(
        filteredResults.map(movie => ({
          ...movie,
          type: 'movie',
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : `https://placehold.co/400x600?text=${movie.title}`,
          rating: (movie.vote_average && movie.vote_average > 0) ? movie.vote_average : undefined,
          releaseDate: movie.release_date,
        }))
      );
    }

    if (mediaType === 'tv') {
      const response: SearchResultsShows = await searchShows(query);
      const filteredResults = response.results.filter(show =>
        show.name.toLowerCase().includes(query.toLowerCase()) &&
        show.original_language?.toLowerCase() === 'en'
      );

      setSearchResults(
        filteredResults.map(show => ({
          ...show,
          type: 'tv',
          title: show.name,
          poster: show.poster_path ? `https://image.tmdb.org/t/p/w400${show.poster_path}` : `https://placehold.co/400x600?text=${show.name}`,
          rating: (show.vote_average && show.vote_average > 0) ? show.vote_average : undefined,
          releaseDate: show.first_air_date,
        }))
      );
    }

    if (mediaType === 'book') {
      const response: SearchResultsBooks = await searchBooks(query);
      const filteredResults = response.items.filter(item =>
        item.volumeInfo.title.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(
        filteredResults.map(item => ({
          ...item,
          type: 'book',
          title: item.volumeInfo.title,
          poster: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || `https://placehold.co/400x600?text=${item.volumeInfo.title}`,
          rating: item.volumeInfo.averageRating,
          overview: item.volumeInfo.description || item.searchInfo?.textSnippet || '',
          releaseDate: item.volumeInfo.publishedDate,
        }))
      );
    }

    if (mediaType === 'game') {
      const response: SearchResultsGames = await searchGames(query);
      const filteredResults = response.data.games.filter(game =>
        game.game_title.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(
        filteredResults.map(game => ({
          ...game,
          type: 'game',
          title: game.game_title,
          poster: getGameBoxart(game.id, response.include?.boxart) || `https://placehold.co/400x600?text=${encodeURIComponent(game.game_title)}`,
          releaseDate: game.release_date,
        }))
      );
    }

    setIsLoading(false);

    return;
  }

  return {
    searchMedia,
    searchResults,
    setSearchResults,
    isLoading,
    setIsLoading
  }

}
