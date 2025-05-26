import { createSlice } from '@reduxjs/toolkit';
import { addToCart, updateQuantity, removeFromCart, clearCart } from '../actions/CartAction';

const cartReducer = createSlice({
    name: 'cart',
    initialState: {
        items: localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [],
        totalQuantity: 0,
        totalPrice: 0,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addToCart, (state, action) => {
                // Check if item with same variant ID already exists in cart
                const existingItemIndex = state.items.findIndex(
                    item => item.item?.selectedVariant?.id === action.payload.item.selectedVariant.id
                );
                
                if (existingItemIndex !== -1) {
                    // Update existing item quantity
                    state.items[existingItemIndex].quantity += action.payload.quantity;
                } else {
                    // Add new item to cart
                    state.items.push({
                        ...action.payload,
                    });
                }
                
                // Update total quantity and price
                state.totalQuantity += action.payload.quantity;
                const itemPrice = action.payload.item.product.price + 
                    (action.payload.item.selectedVariant.priceAdjustment || 0);
                state.totalPrice += itemPrice * action.payload.quantity;

                // Save to localStorage
                localStorage.setItem('cart', JSON.stringify(state.items));
            })
            .addCase(updateQuantity, (state, action) => {
                try {
                    // Find the item index using the variant ID
                    const itemIndex = state.items.findIndex(
                        item => item.item?.selectedVariant?.id === action.payload.item.selectedVariant.id
                    );
                    
                    if (itemIndex === -1) {
                        console.warn(`Item with variant ID ${action.payload.item.selectedVariant.id} not found in cart`);
                        return;
                    }
                    
                    const cartItem = state.items[itemIndex];
                    const quantityDifference = action.payload.quantity - cartItem.quantity;
                    
                    // Update item quantity
                    cartItem.quantity = action.payload.quantity;
                    
                    // Calculate and update totals
                    const itemPrice = cartItem.item.product.price + 
                        (cartItem.item.selectedVariant.priceAdjustment || 0);
                    
                    state.totalQuantity += quantityDifference;
                    state.totalPrice += itemPrice * quantityDifference;
                    
                    // If quantity is 0 or negative, remove item
                    if (cartItem.quantity <= 0) {
                        state.items.splice(itemIndex, 1);
                    }
                    
                    // Save updated cart to localStorage
                    localStorage.setItem('cart', JSON.stringify(state.items));
                } catch (error) {
                    console.error("Error updating quantity:", error);
                }
            })
            .addCase(removeFromCart, (state, action) => {
                // Find item by ID
                const itemIndex = state.items.findIndex(
                    item => item.item?.selectedVariant?.id === action.payload.id
                );
                
                if (itemIndex !== -1) {
                    const cartItem = state.items[itemIndex];
                    
                    // Update totals
                    state.totalQuantity -= cartItem.quantity;
                    const itemPrice = cartItem.item.product.price + 
                        (cartItem.item.selectedVariant.priceAdjustment || 0);
                    state.totalPrice -= itemPrice * cartItem.quantity;
                    
                    // Remove item
                    state.items.splice(itemIndex, 1);
                    
                    // Save to localStorage
                    localStorage.setItem('cart', JSON.stringify(state.items));
                }
            })
            .addCase(clearCart, (state) => {
                state.items = [];
                state.totalQuantity = 0;
                state.totalPrice = 0;

                localStorage.removeItem('cart');
            });  
    },
});

export default cartReducer.reducer;