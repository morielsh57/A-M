import type { ActionReducerMapBuilder, Draft } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../../shared/api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../../../shared/store/utils';
import type {
  CartProductId,
  IAddCartItemRequest,
  ICart,
  IRemoveCartItemRequest,
  IUpdateCartItemRequest,
} from './cart.types';
import {
  emptyCart,
  getGuestCartRequestConfig,
  getStoredGuestCartId,
  isCustomerAuthenticated,
  saveGuestCartId,
} from './cart.utils';

export interface CartStoreState extends ApiDataStateType {
  isCartOpen: boolean;
  keepNextCartSyncUnselected: boolean;
  selectedCartProductIds: CartProductId[];
  knownCartProductIds: CartProductId[];
  getCartReq: IAPIRequestState<ICart>;
  createGuestCartReq: IAPIRequestState<ICart>;
  addCartItemReq: IAPIRequestState<ICart>;
  updateCartItemReq: IAPIRequestState<ICart>;
  removeCartItemReq: IAPIRequestState<ICart>;
}

const initialState: CartStoreState = {
  isCartOpen: false,
  keepNextCartSyncUnselected: false,
  selectedCartProductIds: [],
  knownCartProductIds: [],
  getCartReq: APIRequestState.create<ICart>(),
  createGuestCartReq: APIRequestState.create<ICart>(),
  addCartItemReq: APIRequestState.create<ICart>(),
  updateCartItemReq: APIRequestState.create<ICart>(),
  removeCartItemReq: APIRequestState.create<ICart>(),
};

export const openCart = createAction('cart/openCart');
export const closeCart = createAction('cart/closeCart');
export const toggleCart = createAction('cart/toggleCart');
export const toggleCartItemSelected = createAction<CartProductId>('cart/toggleCartItemSelected');
export const setAllCartItemsSelected = createAction<boolean>('cart/setAllCartItemsSelected');
export const keepNextCartSyncUnselected = createAction('cart/keepNextCartSyncUnselected');

const syncCartState = (state: Draft<CartStoreState>, cart: ICart) => {
  state.getCartReq.data = cart;

  const previousKnownIds = new Set(state.knownCartProductIds.map(String));
  const previousSelectedIds = new Set(state.selectedCartProductIds.map(String));
  const cartItemIds = cart.items.map((item) => item.cart_product_id);

  if (state.keepNextCartSyncUnselected) {
    state.selectedCartProductIds = [];
    state.keepNextCartSyncUnselected = false;
  } else {
    state.selectedCartProductIds = cartItemIds.filter((cartProductId) => {
      const normalizedId = String(cartProductId);
      return previousSelectedIds.has(normalizedId) || !previousKnownIds.has(normalizedId);
    });
  }
  state.knownCartProductIds = cartItemIds;
};

const getOrCreateGuestCartId = async (): Promise<string | null> => {
  if (isCustomerAuthenticated()) return null;

  const storedGuestCartId = getStoredGuestCartId();
  if (storedGuestCartId) return storedGuestCartId;

  const cart = await apiService.post<ICart>(API_ROUTES.CART.GUEST);
  saveGuestCartId(cart.guest_cart_id);

  return cart.guest_cart_id || null;
};

export const createGuestCart = createApiThunk<ICart>(
  'cart/createGuestCart',
  async () => {
    const cart = await apiService.post<ICart>(API_ROUTES.CART.GUEST);
    saveGuestCartId(cart.guest_cart_id);
    return cart;
  },
);

export const getCart = createApiThunk<ICart>(
  'cart/getCart',
  async () => {
    if (isCustomerAuthenticated()) {
      return apiService.get<ICart>(API_ROUTES.CART.DETAIL);
    }

    const guestCartId = getStoredGuestCartId();
    if (!guestCartId) return emptyCart;

    return apiService.get<ICart>(
      API_ROUTES.CART.DETAIL,
      getGuestCartRequestConfig(guestCartId),
    );
  },
);

export const addCartItem = createApiThunk<ICart, IAddCartItemRequest>(
  'cart/addCartItem',
  async (payload) => {
    const guestCartId = await getOrCreateGuestCartId();
    return apiService.post<ICart, IAddCartItemRequest>(
      API_ROUTES.CART.ITEMS,
      payload,
      getGuestCartRequestConfig<IAddCartItemRequest>(guestCartId),
    );
  },
);

export const updateCartItem = createApiThunk<ICart, IUpdateCartItemRequest>(
  'cart/updateCartItem',
  async ({ cart_product_id, quantity }) => {
    const guestCartId = getStoredGuestCartId();
    return apiService.patch<ICart, Pick<IUpdateCartItemRequest, 'quantity'>>(
      API_ROUTES.CART.ITEM_DETAIL(cart_product_id),
      { quantity },
      getGuestCartRequestConfig<Pick<IUpdateCartItemRequest, 'quantity'>>(guestCartId),
    );
  },
);

export const removeCartItem = createApiThunk<ICart, IRemoveCartItemRequest>(
  'cart/removeCartItem',
  async ({ cart_product_id }) => {
    const guestCartId = getStoredGuestCartId();
    return apiService.delete<ICart>(
      API_ROUTES.CART.ITEM_DETAIL(cart_product_id),
      getGuestCartRequestConfig(guestCartId),
    );
  },
);

export const cartStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getCart, 'getCartReq', apiBuilder, {
    onFulfilled: (state, cart) => syncCartState(state as Draft<CartStoreState>, cart),
  });
  createAPIReducerCases(createGuestCart, 'createGuestCartReq', apiBuilder, {
    onFulfilled: (state, cart) => syncCartState(state as Draft<CartStoreState>, cart),
  });
  createAPIReducerCases(addCartItem, 'addCartItemReq', apiBuilder, {
    onFulfilled: (state, cart) => syncCartState(state as Draft<CartStoreState>, cart),
  });
  createAPIReducerCases(updateCartItem, 'updateCartItemReq', apiBuilder, {
    onFulfilled: (state, cart) => syncCartState(state as Draft<CartStoreState>, cart),
  });
  createAPIReducerCases(removeCartItem, 'removeCartItemReq', apiBuilder, {
    onFulfilled: (state, cart) => syncCartState(state as Draft<CartStoreState>, cart),
  });

  builder
    .addCase(openCart, (state) => {
      state.isCartOpen = true;
    })
    .addCase(closeCart, (state) => {
      state.isCartOpen = false;
    })
    .addCase(toggleCart, (state) => {
      state.isCartOpen = !state.isCartOpen;
    })
    .addCase(toggleCartItemSelected, (state, action) => {
      const cartProductId = action.payload;
      const selectedIds = new Set(state.selectedCartProductIds.map(String));

      if (selectedIds.has(String(cartProductId))) {
        state.selectedCartProductIds = state.selectedCartProductIds.filter(
          (selectedCartProductId) => String(selectedCartProductId) !== String(cartProductId),
        );
        return;
      }

      state.selectedCartProductIds.push(cartProductId);
    })
    .addCase(setAllCartItemsSelected, (state, action) => {
      state.selectedCartProductIds = action.payload
        ? state.getCartReq.data?.items.map((item) => item.cart_product_id) || []
        : [];
    })
    .addCase(keepNextCartSyncUnselected, (state) => {
      state.keepNextCartSyncUnselected = true;
    });
});
