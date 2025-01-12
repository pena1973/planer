import styles from "./buttonLoader.module.css";
import icon from  "./images/loader3.webp"
import Image from 'next/image';

export interface ButtonLoader {

}

const ButtonLoader = () => { 
  return (
    <Image src={icon} alt="loader" className={styles.img_loader} />
  );
};

export default ButtonLoader;

