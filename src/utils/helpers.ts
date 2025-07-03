import { Film, Tv, Book, Gamepad2, Music } from 'lucide-react';
import { GameBoxart } from '@/types';

export const getMediaIcon = (type: string) => {
  switch (type) {
    case 'movie': return Film;
    case 'tv': return Tv;
    case 'book': return Book;
    case 'game': return Gamepad2;
    case 'song': return Music;
    default: return Film;
  }
};

export const getGameBoxart = (
  gameId?: string,
  boxart?: GameBoxart,
) => {
  if (!gameId || !boxart || !boxart.base_url || !boxart.data) return false;
  const { base_url, data } = boxart;

  return `${base_url.medium}${data[gameId][0].filename}`;
};

export const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).getFullYear().toString();
};
