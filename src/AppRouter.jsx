import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/authentication/Auth';
import Login from './pages/authentication/Login';
import Signup from './pages/authentication/Signup';
import Home from './pages/customer/Home';
import CustomerLayout from './layouts/customer/CustomerLayout';
import Products from './pages/customer/Products';
import CategoryDetails from './pages/customer/CategoryDetails';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import { URLS } from './constants/urls';
import AdminLayout from './layouts/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Product from './pages/admin/product/Product';
import AddProduct from './pages/admin/product/AddProduct';
import EditProduct from './pages/admin/product/EditProduct';
import ProductVariants from './pages/admin/product/ProductVariants';
import Inventory from './pages/admin/inventory/Inventory';
import AddGoodReceivedNote from './pages/admin/inventory/AddGoodReceivedNote';
import EditGoodReceivedNote from './pages/admin/inventory/EditGoodReceivedNote';
import CategoryAndPlacement from './pages/admin/application/CategoryAndPlacement';
import ProductAttribute from './pages/admin/application/ProductAttribute';
import Order from './pages/admin/order/Order';
import PrintOrder from './pages/admin/order/PrintOrder';
import Customers from './pages/admin/customers/Customers';
import EditCustomer from './pages/admin/customers/EditCustomer';
import Promotions from './pages/admin/promotion/Promotions';
import UserProfile from './pages/personalization/UserProfile';
import VerifyPayment from './pages/customer/VerifyPayment';
import OrderTracking from './pages/customer/OrderTracking';
import ReviewOrder from './pages/customer/ReviewOrder';
import ProductDetails from './pages/customer/ProductDetails';
import VRPlacement from './pages/customer/VRPlacement';


const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Auth routes */}
        <Route path={URLS.AUTH.LOGIN} element={<Auth />} />
        <Route path={URLS.AUTH.REGISTER} element={<Auth />} />
        <Route path={URLS.AUTH.SIGNUP} element={<Signup />} />
        <Route path={URLS.AUTH.RESET_PASSWORD} element={<Auth />} />
        
        {/* Standalone routes */}
        <Route path={URLS.CUSTOMER.VERIFY_PAYMENT} element={<VerifyPayment />} />
        <Route path={URLS.CUSTOMER.VR_PLACEMENT} element={<VRPlacement />} />
        <Route path={URLS.ADMIN.PRINT_ORDER(':id')} element={<PrintOrder />} />

        {/* Admin Routes */}
        <Route path='/admin' element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path='dashboard' element={<Dashboard />} />
            
            {/* Product management */}
            <Route path='products'>
                <Route index element={<Product />} />
                <Route path='add' element={<AddProduct />} />
                <Route path=':id' element={<EditProduct />} />
                <Route path=':id/variants' element={<ProductVariants />} />
            </Route>
            
            {/* Inventory management */}
            <Route path='inventory'>
                <Route index element={<Inventory />} />
                <Route path='add-good-received-note' element={<AddGoodReceivedNote />} />
                <Route path='edit-good-received-note/:id' element={<EditGoodReceivedNote />} />
            </Route>
            
            {/* Application settings */}
            <Route path='application'>
                <Route path='categories' element={<CategoryAndPlacement />} />
                <Route path='attributes' element={<ProductAttribute />} />
            </Route>
            
            {/* Order management */}
            <Route path='orders'>
                <Route index element={<Order />} />
            </Route>
            
            {/* Customer management */}
            <Route path='customers'>
                <Route index element={<Customers />} />
                <Route path=':id' element={<EditCustomer />} />
                <Route path=':id/edit' element={<EditCustomer />} />
            </Route>
            
            {/* Promotions */}
            <Route path='promotions'>
                <Route index element={<Promotions />} />
            </Route>
            
            {/* Admin profile */}
            <Route path='profile' element={<UserProfile />} />
        </Route>

        {/* Customer Routes (within CustomerLayout) */}
        <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path='products' element={<Products />} />
            <Route path='product/:id' element={<ProductDetails />} />
            <Route path='cart' element={<Cart />} />
            <Route path='checkout' element={<Checkout />} />
            <Route path='profile' element={<UserProfile />} />
            <Route path='category/:slug' element={<CategoryDetails />} />
            <Route path='category/:parentSlug/:slug' element={<CategoryDetails />} />
            <Route path='order-tracking' element={<OrderTracking />} />
            <Route path='review-order/:id' element={<ReviewOrder />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default AppRouter;
