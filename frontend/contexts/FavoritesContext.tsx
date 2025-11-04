'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  addFavorite,
  removeFavorite,
  fetchUserFavorites,
  checkIsFavorite,
  type Favorite,
} from '@/lib/supabase/queries';

interface FavoritesContextType {
  favorites: string[]; // youtube_id 배열
  isLoading: boolean;
  isFavorite: (youtubeId: string) => boolean;
  toggleFavorite: (youtubeId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const favoritesList = await fetchUserFavorites(user.id);
      setFavorites(favoritesList.map((fav) => fav.youtube_id));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const isFavorite = (youtubeId: string): boolean => {
    return favorites.includes(youtubeId);
  };

  const toggleFavorite = async (youtubeId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      if (isFavorite(youtubeId)) {
        await removeFavorite(user.id, youtubeId);
        setFavorites(favorites.filter((id) => id !== youtubeId));
      } else {
        await addFavorite(user.id, youtubeId);
        setFavorites([...favorites, youtubeId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('즐겨찾기 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
