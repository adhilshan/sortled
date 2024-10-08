'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineHeart, AiFillHeart, AiOutlineShoppingCart } from 'react-icons/ai';
import { doc, getDoc } from 'firebase/firestore';
import { ref, get, set, update } from 'firebase/database';
import { database, db as firestore } from '../firebase';
import { useTranslation } from 'react-i18next';

const ProductCard = ({ id }) => {
  const [productData, setProductData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const { t , i18n} = useTranslation();
  const currentLocale = i18n.language;

  function getOrCreateDeviceId() {
    if (typeof window !== 'undefined') {
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
    }
    return null;
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const uniqueDeviceId = getOrCreateDeviceId();

  useEffect(() => {
    const fetchProductData = async () => {
      const productRef = doc(firestore, 'products', id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const product = productSnap.data();
        const firstImageUrl = product.images?.[0] || ''; // Get the first image URL from the images array
        const firstWattOption = product.wattOptions?.[0] || { price: product.price, oldprice: product.oldPrice };
        setProductData({
          ...product,
          imageUrl: firstImageUrl, // Set the imageUrl in the productData state
          price: firstWattOption.price,
          oldprice: firstWattOption.oldprice,
          firstWattOption,
        });
      }
    };

    fetchProductData();
  }, [id]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!uniqueDeviceId || !productData) return;
      const wishlistRef = ref(database, `users/${uniqueDeviceId}/wishlist`);
      const snapshot = await get(wishlistRef);
      if (snapshot.exists()) {
        const wishlist = snapshot.val();
        setIsInWishlist(wishlist.some(item => item.id === id && item.watt === productData.firstWattOption.watts));
      }
    };
    checkWishlistStatus();
  }, [uniqueDeviceId, id, productData]);

  const handleAddToWishlist = async (e) => {
    e.stopPropagation();
    await updateUserProduct('wishlist');
    setIsInWishlist(!isInWishlist);
  };

const updateUserProduct = async (type) => {
  if (!uniqueDeviceId || !productData) return;

  const userRef = ref(database, `users/${uniqueDeviceId}`);
  const snapshot = await get(userRef);

  const productDetails = {
    id,
    name: productData.name || 'Unknown Product',  // Add a fallback
    watt: productData.firstWattOption?.watts || 'N/A',   // Add a fallback
    price: productData.price || 0,                       // Add a fallback
    oldprice: productData.oldprice || 0,                 // Add a fallback
  };

  if (!snapshot.exists()) {
    const initialData = {
      [type]: type === 'cart' ? [{ id, quantity: 1, price: productData.price }] : [productDetails],
    };
    await set(userRef, initialData);
  } else {
    const userData = snapshot.val();
    let products = userData[type] || [];

    products = Array.isArray(products) ? products : Object.values(products);

    if (type === 'cart') {
      const existingProductIndex = products.findIndex(product => product.id === id);
      if (existingProductIndex > -1) {
        products[existingProductIndex].quantity += 1;
      } else {
        products.push({ id, quantity: 1, price: productData.price });
      }
    } else {
      const existingProductIndex = products.findIndex(product => product.id === id && product.watt === productData.firstWattOption.watts);
      if (existingProductIndex > -1) {
        products = products.filter(product => !(product.id === id && product.watt === productData.firstWattOption.watts));
      } else {
        products.push(productDetails);
      }
    }

    await update(userRef, { [type]: products });
  }
};

  const handleCardClick = () => {
    router.push(`/products/${id}`);
  };

  if (!productData) {
    return <div>Loading...</div>; // or a skeleton loader
  }

  return (
    <div
      className="flex flex-col items-center cursor-pointer relative"
      style={{ width: "auto" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      <div
        className="relative bg-cover bg-center shadow-lg overflow-hidden"
        style={{ width: "38vw", minWidth: "120px", maxWidth: "250px", aspectRatio: "1/1.3" }}
      >
        <img src={productData.imageUrl} alt={productData.productName} className='relative rounded-md' style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          className="absolute bg-white p-2 rounded-full shadow-lg cursor-pointer"
          style={{ top: "10px", left: "10px" }}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToWishlist(e);
          }}
        >
          {isInWishlist ? (
            <AiFillHeart className="text-red-600 w-2 h-2 lg:w-5 lg:h-5" />
          ) : (
            <AiOutlineHeart className="text-gray-600 w-3 h-3 lg:w-5 lg:h-5" />
          )}
        </div>

        <div className='w-full flex justify-center items-center' onClick={handleCardClick}>
          <button
            className={`absolute bottom-4 bg-white text-gray-800 font-semibold py-1 px-3 sm:py-2 sm:px-4 rounded-md shadow-lg border border-gray-300 flex items-center space-x-1 sm:space-x-2 transition-all duration-300 hover:bg-black hover:text-white group lg:${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-100'} opacity-100 translate-y-0`}
          >
            
            <span className='text-xs sm:text-sm'>{t('viewmore')}</span>
          </button>
        </div>
      </div>
      <div className="text-center mt-2">
        <h3 className="text-[16px] font-medium text-gray-900">{(currentLocale == 'en')?productData.name:productData.namea}</h3>
        <span className='flex' style={{width:"100%", flexWrap:"wrap", justifyContent:"center"}}>
          <p className="font-bold ml-2" style={{flex:"none"}}>AED : {productData.price}</p>
          <p className="text-[#D32F2F] text-xs pt-1 line-through ml-2" style={{flex:"none"}}>AED : {productData.oldprice}</p>
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
