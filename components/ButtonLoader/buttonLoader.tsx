import icon from  "./images/loader3.webp"
import Image from 'next/image';

export interface ButtonLoader {
  width: number,
  height:   number,
}

const ButtonLoader = ({
  width = 20,
  height=20}) => { 
  return (
    <Image src={icon} alt="loader" width={width} height={height} />
  );
};

export default ButtonLoader;
