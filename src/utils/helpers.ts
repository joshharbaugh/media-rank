import { Film, Tv, Book, Gamepad2, Music } from 'lucide-react';

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

export const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).getFullYear().toString();
};