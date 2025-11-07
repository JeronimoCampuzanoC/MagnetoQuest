import { useSwiperSlide } from "swiper/react";
import styles from "./cardSlide.module.css";

type CardSlideProps = {
    title: string;
    type: string;
    description: string;
    image: string;
    href?: string;
    onClick?: (title: string, type: string, description: string) => void; // 👈 Nueva prop: función onClick
};

const CardSlide: React.FC<CardSlideProps> = ({ title, type, description, image, href, onClick }) => {
    const { isActive } = useSwiperSlide();

    const Wrapper = href ? "a" : "div";

    // 👇 Nueva función: maneja el click en la tarjeta
    const handleClick = (e: React.MouseEvent) => {
        // Si hay un onClick definido, lo ejecutamos
        if (onClick) {
            e.preventDefault(); // Evita navegación si hay href
            onClick(title, type, description); // Pasamos title, type y description
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
                {type === 'Especial' ? (
                    // Para tarjetas personalizadas (intereses del usuario), usar template dinámico
                    <p className={styles.cardExtraSubtitle}>
                        ¡Estás a punto de embarcarte en un desafío increíble! Prepárate para poner a prueba tus conocimientos sobre <strong><big>{description}</big></strong>. Responde a los retos que hemos preparado para ti, ¡y demuestra todo lo que sabes! ¿Te atreves a superar cada pregunta?
                    </p>
                ) : (
                    // Para tarjetas predefinidas, mostrar el description tal cual (texto quemado)
                    <p className={styles.cardExtraSubtitle}>{description}</p>
                )}
            </div>
            <img src={image} alt="" className={styles.cardExtraImage} />
        </Wrapper>
    );
};

export default CardSlide;