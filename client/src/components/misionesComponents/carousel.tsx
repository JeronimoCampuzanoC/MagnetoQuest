import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import styles from "./carousel.module.css";
import CardSlide from "./cardSlide";
import { AuthService } from "../../services/authService";
import Modal from "./modal";

type Item = {
  id: number;
  title: string;
  type: string;
  description: string;
  image?: string;
};

const DATA: Item[] = [
  { id: 1, title: "Habilidades Blandas", type :"Habilidades", description: "Situacionales sobre habilidades blandas, con viñetas realistas que evalúen toma de decisiones, comunicación asertiva, manejo de conflictos, liderazgo, colaboración, empatía, feedback efectivo y priorización bajo presión." },
  { id: 2, title: "Entrevistas", type :"Entrevistas", description: "Preparación de entrevistas con énfasis en {ROL_O_TÓPICO} (p. ej., comportamentales, liderazgo, negociación salarial, métricas de impacto, comunicación ejecutiva), usando ejemplos prácticos." },
  { id: 3, title: "Empleo Colombiano", type :"Empleo", description: "Genera preguntas situacionales sobre temas laborales en Colombia (por ejemplo, cómo pedir vacaciones, qué pasa con la prima, qué hacer si no me afilian), usando casos cotidianos y opciones comprensibles." },
];



type Props = {
  autoPlayMs?: number;
  hasDoneToday?: boolean | null;
};

const GameStyleCarousel: React.FC<Props> = ({ autoPlayMs = 2800, hasDoneToday = null }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  // items rendered in the carousel (base DATA + up to 3 interest-driven cards)
  const [items, setItems] = useState<Item[]>(DATA);

  useEffect(() => {
    let mounted = true;
    async function loadPersonalizedCards() {
      try {
        const userId = AuthService.getCurrentUserId();
        if (!userId) return;
        const r = await fetch(`/api/users/${userId}/interests`);
        if (!r.ok) return;
        const json = await r.json();
        const interests: string[] = Array.isArray(json?.interests) ? json.interests : [];
        const sector: string | null = json?.sector ?? null;

        if (!mounted) return;

        if (interests.length === 0) return;

        // Create up to 3 cards from interests (title = sector, description = interest)
        const extra = interests.slice(0, 3).map((interest, idx) => ({
          id: 1000 + idx,
          title: sector || 'Tu sector',
          type: 'Especial',
          description: interest
        }));

        setItems(prev => {
          // Avoid adding duplicates if already added
          const alreadyAdded = prev.some(it => it.type === 'Especial');
          if (alreadyAdded) return prev;
          return [...prev, ...extra];
        });
      } catch (err) {
        console.warn('Error loading personalized cards', err);
      }
    }
    loadPersonalizedCards();
    return () => { mounted = false; };
  }, []);

  // Función que maneja el click en una tarjeta
  const handleCardClick = async (title: string, description: string) => {
    // Si ya hizo la trivia hoy, mostramos un popup y no dejamos continuar
    if (hasDoneToday === true) {
      setShowModal(true);
      return;
    }
    try {
      // Obtener el userId desde AuthService
      const userId = AuthService.getCurrentUserId();

      // Intentar obtener intereses desde el backend endpoint (si hay userId)
      let interests: string[] = [];
      if (userId) {
        try {
          const r = await fetch(`/api/users/${userId}/interests`);
          if (r.ok) {
            const data = await r.json();
            interests = Array.isArray(data?.interests) ? data.interests : [];
            console.log("Intereses del Usuario:  ",interests)
          } else {
            console.warn('No se pudieron obtener intereses del usuario', r.status);
          }
        } catch (err) {
          console.warn('Error fetching user interests', err);
        }
      }

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
        {items.map((item) => (
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Trivia diaria completada"
      >
        <p>Ya hiciste tu trivia diaria. ¡Vuelve mañana para más desafíos! 🎯</p>
      </Modal>
    </div>
  );
};

export default GameStyleCarousel;
