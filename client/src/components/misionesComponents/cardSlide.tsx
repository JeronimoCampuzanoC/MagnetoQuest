import { useSwiperSlide } from "swiper/react";
import styles from "./cardSlide.module.css";

type CardSlideProps = {
    title: string;
    subtitle: string;
    image: string;
    href?: string;
};

const CardSlide: React.FC<CardSlideProps> = ({ title, subtitle, image, href }) => {
    const { isActive } = useSwiperSlide();

    const Wrapper = href ? "a" : "div";

    return (
        <Wrapper
            className={`${styles.cardExtra} ${isActive ? styles.active : ""}`}
            {...(href ? { href } : {})}
        >
            <div className={styles.cardExtraText}>
                <h3 className={styles.cardExtraTitle}>{title}</h3>
                <p className={styles.cardExtraSubtitle}>{subtitle}</p>
            </div>
            <img src={image} alt="" className={styles.cardExtraImage} />
        </Wrapper>
    );
};

export default CardSlide;
