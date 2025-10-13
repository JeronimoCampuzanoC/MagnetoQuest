import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import styles from "./carousel.module.css";
import CardSlide from "./cardSlide";
import { AuthService } from "../../services/authService";

type Item = {
  id: number;
  title: string;
  description: string;
  image?: string;
};

const DATA: Item[] = [
  { id: 1, title: "Programación Backend", description: 'Genera preguntas avanzadas sobre desarrollo backend, incluyendo arquitecturas de software, patrones de diseño, optimización de bases de datos, APIs RESTful, microservicios, y mejores prácticas de desarrollo.' },
  { id: 2, title: "Habilidades Blandas", description: "Genera preguntas avanzadas y situacionales sobre habilidades blandas, con viñetas realistas que evalúen toma de decisiones, comunicación asertiva, manejo de conflictos, liderazgo, colaboración, empatía, feedback efectivo y priorización bajo presión." },
  { id: 3, title: "Entrevistas", description: "Genera preguntas avanzadas para preparación de entrevistas con énfasis en {ROL_O_TÓPICO} (p. ej., comportamentales, liderazgo, negociación salarial, métricas de impacto, comunicación ejecutiva), usando ejemplos prácticos." },
  { id: 4, title: "Empleo Colombiano", description: "Genera preguntas situacionales sobre temas laborales en Colombia (por ejemplo, cómo pedir vacaciones, qué pasa con la prima, qué hacer si no me afilian), usando casos cotidianos y opciones comprensibles." },
  { id: 5, title: "Práctica", description: "Una tienda online completa con Next.js y Stripe..." }
];

type Props = {
  autoPlayMs?: number;
};

const GameStyleCarousel: React.FC<Props> = ({ autoPlayMs = 2800 }) => {
  const navigate = useNavigate();

  // Función que maneja el click en una tarjeta
  const handleCardClick = (title: string, description: string) => {
    try {
      // Obtener el userId desde AuthService
      const userId = AuthService.getCurrentUserId();

      // Crear el objeto con la configuración
      const triviaConfig = {
        userId,
        title,
        description
      };

      // Guardar en localStorage
      localStorage.setItem('triviaConfig', JSON.stringify(triviaConfig));

      console.log(' Configuración guardada:', triviaConfig);

      // Navegar a /home
      navigate('/home');

    } catch (error) {
      console.error(' Error al guardar configuración:', error);
    }
  };
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Decide un estilo de juego</h2>
      <Swiper
        effect="coverflow"
        grabCursor
        centeredSlides
        loop={true}
        slidesPerView={3}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination]}
        className={styles.container}
      >
        {DATA.map((item) => (
          <SwiperSlide key={item.id} className={styles.slide}>
            <CardSlide
              title={item.title}
              description={item.description}
              image="https://picsum.photos/200/200"
              onClick={handleCardClick}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default GameStyleCarousel;
