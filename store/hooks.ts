// store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Хук для диспатча с типами
export const useAppDispatch: () => AppDispatch = useDispatch;

// Хук для селекторов с типами
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
