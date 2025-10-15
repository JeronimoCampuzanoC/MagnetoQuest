import styles from "./misiones.module.css"
import ProgressBarSteps from "../components/misionesComponents/progressBar"
import OptionGrid, { OptionItem } from "../components/misionesComponents/optionGrid"
import Carousel from "../components/misionesComponents/carousel"
import React, { useEffect, useState } from "react"
import BadgesOffCanvas from "../components/misionesComponents/badgesOffCanvas"
import { AuthService } from "../services/authService";

// 👉 util: toma los primeros 6 y rellena con placeholders si faltan
function padToSix(items: OptionItem[], max = 6, msg = "Más adelante aparecerán más misiones."): OptionItem[] {
  const first = items.slice(0, max)
  const padsNeeded = Math.max(0, max - first.length)
  const pads = Array.from({ length: padsNeeded }, (_, i): OptionItem => ({
    id: `placeholder-${i}`,
    text: msg,
    active: false, // se ve como “bloqueado”
  }))
  return [...first, ...pads]
}

export default function Misiones() {
  const [items, setItems] = useState<OptionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magnetoPoints, setMagnetoPoints] = useState<number>(0)
  const [loadingPoints, setLoadingPoints] = useState(true)

  useEffect(() => {
    const storedUser = AuthService.getCurrentUserId()
    const userId = storedUser || null

    const fetchMissions = async () => {
      setLoading(true)
      try {
        if (!userId) throw new Error("No user ID found")
        const res = await fetch(`/users/${userId}/missions-in-progress`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Array<{ id: string; text: string; active: boolean }> = await res.json()

        const mapped: OptionItem[] = data.map(d => ({
          id: d.id,
          text: d.text,
          active: !!d.active,
        }))

        setItems(padToSix(mapped)) // 👈 aquí aplicamos el relleno a 6
      } catch (e: any) {
        console.error("Error fetching missions", e)
        setError(e?.message || "Error")
        // incluso con error, muestra 6 placeholders para no romper el layout
        setItems(padToSix([]))
      } finally {
        setLoading(false)
      }
    }

    const fetchUserProgress = async () => {
      setLoadingPoints(true)
      try {
        if (!userId) throw new Error("No user ID found")
        const res = await fetch(`/api/users/${userId}/progress`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setMagnetoPoints(data.magento_points || 0)
      } catch (e: any) {
        console.error("Error fetching user progress", e)
        setMagnetoPoints(0)
      } finally {
        setLoadingPoints(false)
      }
    }

    fetchMissions()
    fetchUserProgress()
  }, [])

  // Calcular el porcentaje de progreso (tope: 500 puntos)
  const maxPoints = 500;
  const progressPercent = Math.min((magnetoPoints / maxPoints) * 100, 100);

  // Calcular los steps de la barra (hitos en 100, 250 y 400 puntos)
  const step1 = (100 / maxPoints) * 100; // 20%
  const step2 = (250 / maxPoints) * 100; // 50%
  const step3 = (400 / maxPoints) * 100; // 80%

  return (
    <div className="min-h-screen bg-gray-50">
      <BadgesOffCanvas />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className={styles.parent}>
          <div className={styles.progressBar}>
            <div>
              <div className={styles.points}>
                Has obtenido <b>{loadingPoints ? '...' : magnetoPoints}</b> MagnetoPoints
                {!loadingPoints && <span style={{ color: '#6b7280', fontSize: '0.9em' }}> / {maxPoints}</span>}
              </div>
              <div style={{ maxWidth: 480, padding: 0, marginTop: 15, marginLeft: 20 }}>
                <ProgressBarSteps
                  percent={progressPercent}
                  steps={[step1, step2, step3]}
                  color="#22c55e"
                  bgColor="#e5e7eb"
                  height={30}
                />
              </div>
            </div>
            <div className={styles.divCircle}>
              <div className={styles.circule}>
                <div className={styles.triangleRight}></div>
                <img src="../static/m.png" alt="MagnetoPoints" className={styles.mIcon} />
              </div>
            </div>
            <div className={styles.divInsignias}>
              <h2>Tienes <b>tantas</b> insignias</h2>
              <img src="../static/insignia.png" alt="MagnetoPoints" className={styles.mIconInsignia} />
            </div>
          </div>

          <div className={styles.misiones}>
            <div style={{ padding: 24, height: "100%" }}>
              {loading ? (
                <div>Cargando misiones...</div>
              ) : error ? (
                <div>Error: {error}</div>
              ) : (
                <OptionGrid
                  items={items}       // siempre tendrá 6 elementos
                  columns={2}
                  checkColor="#22c55e"
                  ringColor="#ffffff"
                />
              )}
            </div>
          </div>

          <div className={styles.div7}>
            <div style={{ maxWidth: 2000 }}>
              <Carousel autoPlayMs={2800} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}