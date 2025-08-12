import { Box } from '@mui/material';
import styles from './PresentedProduct.module.scss';
import CustomTypography from '../../customTypography/CustomTypography';
//import CustomTypography1 from '../../customTypography/CustomTypography';
//import CustomTypography2 from '../../customTypography/CustomTypography';
//import ProductPNG from '../../../assets/product.png';
import { ReactComponent as CloseIcon} from '../../../assets/blackAddIcon.svg';
import { useState } from 'react';

type Product = {
  imageSrc: string;
  title: string;
  description: string;
  tabList?: string[] | null; 
};

// const productsList = [
//   {
//     imageSrc: 'path/to/image1.png',  // lub importowany obraz
//     title: "Produkt 1",
//     description: "Lorem ipsum dolor sit amet..."
//   },
//   {
//     imageSrc: 'path/to/image2.png',
//     title: "Produkt 2",
//     description: "Opis drugiego produktu..."
//   }
// ];

type PresentedProductProps = {
  products: Product[];
};


function PresentedProduct({ products }: PresentedProductProps) {
    
  const [expanded, setExpanded] = useState<boolean[]>(() => products.map(() => false));

  const toggleExpand = (index: number) => {
    setExpanded(prev => prev.map((val, i) => i === index ? !val : val));
  };


 return (
    <>
      {products.map((product, index) => (
        <Box className={styles.productLine} key={index}>
          <Box className={styles.productIcon}>
            <img
              src={product.imageSrc}
              alt={`img produktu: ${product.title}`}
              width={35}
              height={35}
              style={{ display: 'block' }}
            />
          </Box>

          <Box className={styles.productInfo}>
            <CustomTypography className={styles.productTitle}>{product.title}</CustomTypography>

            {/* Opis z możliwością skrócenia */}
            <CustomTypography
              className={`${styles.productDescription} ${!expanded[index] ? styles.collapsed : ''}`}
            >
              {product.description}
            </CustomTypography>

            <Box className={styles.productTabWrapper}>
              {/* Przycisk trzy kropki */}
              <button
                className={styles.dotsButton}
                onClick={() => toggleExpand(index)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

              {/* Box z tagami widoczny tylko gdy expanded */}
              {/* {expanded[index] && (
                <Box className={styles.productTabBox}>
                  <CustomTypography className={styles.productTagLabe}>Tagi produktowe</CustomTypography>
                  <Box className={styles.tagsWrapper}>
                    <Box className={styles.tag}>
                      <CustomTypography className={styles.tagName}>tag numer 1</CustomTypography>
                      <CloseIcon className={styles.closeIcon}/>
                    </Box>
                  </Box>
                </Box>
              )} */}
                  <Box className={styles.productTabBox}>
                  <CustomTypography className={styles.productTagLabe}>Tagi produktowe</CustomTypography>
                  <Box className={styles.tagsWrapper}>
                     {Array.isArray(product.tabList) && product.tabList.length > 0 ? (
                        product.tabList.map((tag, tagIndex) => (
                            <Box className={styles.tag} key={tagIndex}>
                            <CustomTypography className={styles.tagName}>{tag}</CustomTypography>
                            <CloseIcon className={styles.closeIcon} />
                            </Box>
                        ))
                        ) : (
                        <CustomTypography className={styles.tagNameUnavailable}>
                            Brak tagów
                        </CustomTypography>
                        )}
                  </Box>
                </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </>
  );
}

export default PresentedProduct;