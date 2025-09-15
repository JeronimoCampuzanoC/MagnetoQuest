import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import styles from "./carousel.module.css";
import CardSlide from "./cardSlide";

type Item = {
  id: number;
  title: string;
  subtitle: string;
  image?: string; // opcional si después quieres meter imágenes
};

const DATA: Item[] = [
  { id: 1, title: "Perfiles", subtitle: "Una tienda online completa con Next.js y Stripe..." },
  { id: 2, title: "Conceptos", subtitle: "Una tienda online completa con Next.js y Stripe..." },
  { id: 3, title: "Preparemonos", subtitle: "A través de preguntas, reforzarás..." },
  { id: 4, title: "Retos", subtitle: "Una tienda online completa con Next.js y Stripe..." },
  { id: 5, title: "Práctica", subtitle: "Una tienda online completa con Next.js y Stripe..." }
];

type Props = {
  autoPlayMs?: number; // tiempo entre slides
};

const GameStyleCarousel: React.FC<Props> = ({ autoPlayMs = 2800 }) => {
  // const [index, setIndex] = useState(0); // índice del item activo (centro)

  // // bucle infinito
  // const next = () => setIndex((i) => (i + 1) % DATA.length);
  // const prev = () => setIndex((i) => (i - 1 + DATA.length) % DATA.length);

  // // autoplay
  // useEffect(() => {
  //   const t = setInterval(next, autoPlayMs);
  //   return () => clearInterval(t);
  // }, [autoPlayMs]);

  // // para render fácil: tomamos 5 items en orden rotado (siempre son 5)
  // const ring = useMemo(() => {
  //   const arr = [...DATA];
  //   return arr.map((_, i) => arr[(index + i) % arr.length]);
  // }, [index]);

  // const varName = "swiper-slide"

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Decide un estilo de juego</h2>
      <Swiper
        effect="coverflow"
        grabCursor
        centeredSlides
        loop={true}
        slidesPerView = {3}              // 👈 Swiper mide el ancho del slide
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
              subtitle={item.subtitle}
              image="https://picsum.photos/200/200" // 👈 puedes reemplazar por item.image
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default GameStyleCarousel;
