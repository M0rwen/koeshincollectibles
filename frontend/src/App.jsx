import { useEffect, useState } from 'react'
import './App.css'

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer, } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from 'react-redux'
import { loadUser } from './actions/userActions'



import Header from './Components/Layout/Header'
import Footer from './Components/Layout/Footer'
import Home from './Components/Home'
import ProductDetails from './Components/Product/ProductDetails'
import Register from './Components/User/Register'
import Login from './Components/User/Login'
import NewPassword from './Components/User/NewPassword';
import ForgotPassword from './Components/User/ForgotPassword';
import Profile from './Components/User/Profile';
import UpdateProfile from './Components/User/UpdateProfile';
import UpdatePassword from './Components/User/UpdatePassword';
import Cart from './Components/Cart/Cart';
import Shipping from './Components/Cart/Shipping';
import ConfirmOrder from './Components/Cart/ConfirmOrder';
import Payment from './Components/Cart/Payment';
import OrderSuccess from './Components/Cart/OrderSuccess';
import ListOrders from './Components/Order/ListOrders';
import OrderDetails from './Components/Order/OrderDetails';
import Dashboard from './Components/Admin/Dashboard';
import ProductsList from './Components/Admin/ProductsList';
import NewProduct from './Components/Admin/NewProduct';
import OrdersList from './Components/Admin/OrdersList';
import ProcessOrder from './Components/Admin/ProcessOrder';
import UsersList from './Components/Admin/UsersList';
import UpdateUser from './Components/Admin/UpdateUser';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import ProductReviews from './Components/Admin/ProductReviews';
import UpdateProduct from './Components/Admin/UpdateProduct';

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}

const CatalogPage = () => {
  const { pathname } = useLocation()
  return <Home key={pathname} />
}

function App() {
  const dispatch = useDispatch()
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('koeshin-theme')
    const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = initialTheme
    return initialTheme
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('koeshin-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#1b1621' : '#fbf8f3'
    )
  }, [theme])

  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  // const [state, setState] = useState({
  //   cartItems: localStorage.getItem('cartItems')
  //     ? JSON.parse(localStorage.getItem('cartItems'))
  //     : [],

  //   shippingInfo: localStorage.getItem('shippingInfo')
  //     ? JSON.parse(localStorage.getItem('shippingInfo'))
  //     : {},
  // })

  // const addItemToCart = async (id, quantity) => {
  //   // console.log(id, quantity)
  //   try {
  //     const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
  //     const item = {
  //       product: data.product._id,
  //       name: data.product.name,
  //       price: data.product.price,
  //       image: data.product.images[0].url,
  //       stock: data.product.stock,
  //       quantity: quantity
  //     }

  //     const isItemExist = state.cartItems.find(i => i.product === item.product)

  //     // setState({
  //     //   ...state,
  //     //   cartItems: [...state.cartItems, item]
  //     // })
  //     if (isItemExist) {
  //       setState({
  //         ...state,
  //         cartItems: state.cartItems.map(i => i.product === isItemExist.product ? item : i)
  //       })
  //     }
  //     else {
  //       setState({
  //         ...state,
  //         cartItems: [...state.cartItems, item]
  //       })
  //     }

  //     toast.success('Item Added to Cart', {
  //       position: 'bottom-right'
  //     })


  //   } catch (error) {
  //     toast.error(error, {
  //       position: 'top-left'
  //     });

  //   }

  // }
  // localStorage.setItem('cartItems', JSON.stringify(state.cartItems))
  // const removeItemFromCart = async (id) => {
  //   setState({
  //     ...state,
  //     cartItems: state.cartItems.filter(i => i.product !== id)
  //   })
  //   localStorage.setItem('cartItems', JSON.stringify(state.cartItems))
  // }

  // const saveShippingInfo = async (data) => {
  //   setState({
  //     ...state,
  //     shippingInfo: data
  //   })
  //   localStorage.setItem('shippingInfo', JSON.stringify(data))
  // }
  return (
    <>


      <Router>
        <ScrollToTop />
        {/* <Header cartItems={state.cartItems} /> */}
        <Header
          theme={theme}
          onToggleTheme={() => setTheme(currentTheme => currentTheme === 'light' ? 'dark' : 'light')}
        />
        <Routes>
          <Route path="/" element={<CatalogPage />} exact="true" />
          <Route path="/shop" element={<CatalogPage />} />
          <Route path="/collections" element={<CatalogPage />} />
          <Route path="/collections/:category" element={<CatalogPage />} />
          {/* <Route path="/product/:id" element={<ProductDetails cartItems={state.cartItems} addItemToCart={addItemToCart} />} exact="true" /> */}
          <Route path="/product/:id" element={<ProductDetails />} exact="true" />
          <Route path="/search/:keyword" element={<CatalogPage />} exact="true" />
          <Route path="/login" element={<Login />} exact="true" />
          <Route path="/register" element={<Register exact="true" />} />
          <Route path="/password/forgot" element={<ForgotPassword />} exact="true" />
          <Route path="/password/reset/:token" element={<NewPassword />} exact="true" />
          <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} exact="true" />
          <Route path="/me/update" element={<UpdateProfile />} exact="true" />
          <Route path="/password/update" element={<UpdatePassword />} />
          {/* <Route path="/cart" element={<Cart cartItems={state.cartItems} addItemToCart={addItemToCart} removeItemFromCart={removeItemFromCart} />} exact="true" /> */}
          <Route path="/cart" element={<Cart />} exact="true" />
          {/* <Route path="/shipping" element={<Shipping shipping={state.shippingInfo} saveShippingInfo={saveShippingInfo} />} />
          <Route path="/confirm" element={<ConfirmOrder cartItems={state.cartItems} shippingInfo={state.shippingInfo} />} />
          <Route path="/payment" element={<Payment cartItems={state.cartItems} shippingInfo={state.shippingInfo} />} /> */}


          <Route path="/shipping" element={<Shipping />} />
          <Route path="/confirm" element={<ConfirmOrder />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/orders/me" element={<ListOrders />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          {/* <Route path="/admin/products" element={<ProductsList />} /> */}
          {/* <Route path="/admin/product" element={<NewProduct />} /> */}
          {/* <Route
            path="/admin/orders"
            element={<OrdersList />}

          /> */}
          <Route
            path="/admin/order/:id"
            element={<ProcessOrder />} />
          <Route
            path="/admin/users"
            element={<UsersList />} />
          <Route path="/admin/user/:id" element={<UpdateUser />} />

          <Route
            path="/admin/products"
            element={
              <ProtectedRoute isAdmin={true}>
                <ProductsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/product"
            element={
              <ProtectedRoute isAdmin={true}>
                <NewProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/product/:id"

            element={<ProtectedRoute isAdmin={true}>
              <UpdateProduct />
            </ProtectedRoute>} />

          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute isAdmin={true}>
                <OrdersList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute isAdmin={true} >
                <ProductReviews />
              </ProtectedRoute>} />
        </Routes>
        <Footer />
      </Router>

      <ToastContainer />
    </>
  )
}

export default App
