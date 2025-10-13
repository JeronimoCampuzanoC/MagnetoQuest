import { useSwiperSlide } from "swiper/react";
import styles from "./cardSlide.module.css";

type CardSlideProps = {
    title: string;
    description: string;
    image: string;
    href?: string;
    onClick?: (title: string, description: string) => void; // 👈 Nueva prop: función onClick
};

const CardSlide: React.FC<CardSlideProps> = ({ title, description, image, href, onClick }) => {
    const { isActive } = useSwiperSlide();

    const Wrapper = href ? "a" : "div";

    // 👇 Nueva función: maneja el click en la tarjeta
    const handleClick = (e: React.MouseEvent) => {
        // Si hay un onClick definido, lo ejecutamos
        if (onClick) {
            e.preventDefault(); // Evita navegación si hay href
            onClick(title, description); // Pasamos title y description
        }
    };

    return (
        <Wrapper
            className={`${styles.cardExtra} ${isActive ? styles.active : ""}`}
            {...(href ? { href } : {})}
            onClick={handleClick} // 👈 Agregamos el evento onClick
            style={{ cursor: onClick ? 'pointer' : 'default' }} // 👈 Cambiamos el cursor si es clickeable
        >
            <div className={styles.cardExtraText}>
                <h3 className={styles.cardExtraTitle}>{title}</h3>
                <p className={styles.cardExtraSubtitle}>{description}</p>
            </div>
            <img src={image} alt="" className={styles.cardExtraImage} />
        </Wrapper>
    );
};

export default CardSlide;