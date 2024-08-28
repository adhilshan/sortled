'use client'

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';

const OurProducts = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  const filterOptions = [
    { id: 'new', label: 'New Arrivals' },
    { id: 'featured', label: 'Featured' },
    { id: 'sale', label: 'On Sale' },
    { id: 'trending', label: 'Trending' },
    { id: 'all', label: 'All' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products: ', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.tags.includes(activeFilter)));
    }
  }, [activeFilter, products]);

  return (
    <div className="flex justify-center items-center flex-col p-8 mt-12 w-full">
      <div className="flex justify-center items-center flex-col">
        <h2 className={`heading-bold text-3xl lg:text-5xl md:text-5xl mb-2 ${t('txt-align')}`}>{t('our_products')}</h2>
        <p className={`text-gray-800 text-lg ${t('txt-align')}`}>{t("our_products2")}</p>
        
      </div>
      
      {/* New Tab Design */}
      <div className="w-full max-w-3xl mt-10 mb-8">
        <div className="flex flex-wrap justify-center border-b border-gray-200">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out
                ${activeFilter === option.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }
                focus:outline-none focus:text-blue-600 focus:border-blue-500`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-12 p-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            imageUrl={product.images[0]}
            productName={product.name}
            price={product.price}
            id={product.id}
          />
        ))}
      </div>
    </div>
  );
};

export default OurProducts;