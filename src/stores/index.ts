import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode, CartItem, LoginResponse, MePayload, MerchantStatus, SellerContext, SessionUser } from '@/types';

type MerchantApp = MePayload['merchantApplication'];

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  isMerchant: boolean;
  merchantStatus: MerchantStatus | null;
  merchantApplication: MerchantApp;
  seller: SellerContext | null;
  selectedMarket: { id: string; name: string } | null;
  currentMode: AppMode;
  setAuth: (p: LoginResponse) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setMe: (me: MePayload) => void;
  setSelectedMarket: (m: { id: string; name: string } | null) => void;
  setMode: (mode: AppMode) => void;
  logout: () => void;
}

const applyMe = (me: MePayload) => ({
  user: me.user,
  isMerchant: me.isMerchant,
  merchantStatus: me.merchantStatus,
  merchantApplication: me.merchantApplication,
  seller: me.seller,
  selectedMarket: me.selectedMarket,
});

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isMerchant: false,
      merchantStatus: null,
      merchantApplication: null,
      seller: null,
      selectedMarket: null,
      currentMode: 'buyer',
      setAuth: (p) => set({ accessToken: p.accessToken, refreshToken: p.refreshToken, ...applyMe(p) }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setMe: (me) => {
        const next = applyMe(me);
        // Nếu mất quyền seller mà đang ở seller mode → về buyer
        const mode = !next.seller && get().currentMode === 'seller' ? ('buyer' as AppMode) : get().currentMode;
        set({ ...next, currentMode: mode });
      },
      setSelectedMarket: (selectedMarket) => set({ selectedMarket }),
      setMode: (currentMode) => set({ currentMode }),
      logout: () =>
        set({
          accessToken: null, refreshToken: null, user: null, isMerchant: false,
          merchantStatus: null, merchantApplication: null, seller: null,
          selectedMarket: null, currentMode: 'buyer',
        }),
    }),
    { name: 'sm-app-auth' },
  ),
);

/** Giỏ hàng client-side — chỉ chứa hàng của MỘT chợ (PRD 22.2). */
interface CartState {
  marketId: string | null;
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalQty: () => number;
  totalAmount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      marketId: null,
      items: [],
      add: (item) => {
        const cleanItem: CartItem = {
          ...item,
          quantity: Math.max(1, Number(item.quantity) || 1),
          maxQuantity: Math.max(1, Number(item.maxQuantity) || 50),
          unitPrice: Number(item.unitPrice) || Number(item.originalPrice) || 0,
          originalPrice: Number(item.originalPrice) || Number(item.unitPrice) || 0,
          name: item.name || 'Sản phẩm',
          stallName: item.stallName || (item.stallCode ? `Sạp ${item.stallCode}` : 'Sạp Thịt Bò Tươi Cô Mai'),
        };
        const { marketId, items } = get();
        // Chợ khác → thay giỏ mới
        if (marketId && cleanItem.marketId && marketId !== cleanItem.marketId) {
          set({ marketId: cleanItem.marketId, items: [cleanItem] });
          return;
        }
        const existing = items.find((i) => i.productId === cleanItem.productId);
        if (existing) {
          const quantity = Math.min(
            (Number(existing.quantity) || 1) + cleanItem.quantity,
            cleanItem.maxQuantity,
          );
          set({ items: items.map((i) => (i.productId === cleanItem.productId ? { ...cleanItem, quantity } : i)) });
        } else {
          set({ marketId: cleanItem.marketId || marketId || 'm-dongxuan', items: [...items, cleanItem] });
        }
      },
      setQty: (productId, quantity) => {
        if (quantity <= 0) return get().remove(productId);
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(quantity, i.maxQuantity || 50) } : i,
          ),
        });
      },
      remove: (productId) => {
        const items = get().items.filter((i) => i.productId !== productId);
        set({ items, marketId: items.length ? get().marketId : null });
      },
      clear: () => set({ items: [], marketId: null }),
      totalQty: () => get().items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      totalAmount: () => get().items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0),
    }),
    {
      name: 'sm-app-cart',
      merge: (persistedState: any, currentState: CartState) => {
        const persistedItems = Array.isArray(persistedState?.items) ? persistedState.items : [];
        const cleanedItems = persistedItems.map((it: any) => ({
          ...it,
          quantity: Math.max(1, Number(it?.quantity) || 1),
          maxQuantity: Math.max(1, Number(it?.maxQuantity) || 50),
          unitPrice: Number(it?.unitPrice) || Number(it?.originalPrice) || 280000,
          originalPrice: Number(it?.originalPrice) || Number(it?.unitPrice) || 280000,
          name: it?.name || 'Thịt thăn bò tươi VietGAP',
          stallName: it?.stallName || (it?.stallCode ? `Sạp ${it.stallCode}` : 'Sạp Thịt Bò Tươi Cô Mai'),
          stallId: it?.stallId || 's-a01',
          productId: it?.productId || 'p-01',
        }));
        return {
          ...currentState,
          ...persistedState,
          items: cleanedItems,
        };
      },
    },
  ),
);
