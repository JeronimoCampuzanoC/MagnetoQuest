import styles from "./misiones.module.css"
import ProgressBarSteps from "../components/misionesComponents/progressBar"
import OptionGrid from "../components/misionesComponents/optionGrid"
import Carousel from "../components/misionesComponents/carousel"
import React, { useEffect, useState } from "react"
import BadgesOffCanvas from "../components/misionesComponents/badgesOffCanvas"
import { AuthService } from "../services/authService"

// Interfaz actualizada
interface MissionItem {
    id: string
    title?: string
    description?: string
    category?: string
    progress?: number
    objective?: number
    ends_at?: string
    active: boolean
}

// Función para rellenar a 6
function padToSix(items: MissionItem[], max = 6, msg = "Más adelante aparecerán más misiones."): MissionItem[] {
    const first = items.slice(0, max)
    const padsNeeded = Math.max(0, max - first.length)
    const pads = Array.from({ length: padsNeeded }, (_, i): MissionItem => ({
        id: `placeholder-${i}`,
        description: msg,
        active: false,
    }))
    return [...first, ...pads]
}

export default function Misiones() {
    const [items, setItems] = useState<MissionItem[]>([])
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
                const data: MissionItem[] = await res.json()
                console.log('📦 Datos recibidos del backend:', data)
                console.log('📦 Primer item:', data[0])
                setItems(padToSix(data))
            } catch (e: any) {
                console.error("Error fetching missions", e)
                setError(e?.message || "Error")
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
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', fontSize: '18px', color: '#6b7280' }}>
                                    Cargando misiones...
                                </div>
                            ) : error ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', fontSize: '18px', color: '#ef4444' }}>
                                    Error: {error}
                                </div>
                            ) : (
                                <OptionGrid
                                    items={items}
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