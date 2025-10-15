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

        fetchMissions()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <BadgesOffCanvas />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className={styles.parent}>
                    <div className={styles.progressBar}>
                        <div>
                            <div className={styles.points}>Haz obtenido <b>{20}</b> MagnetoPoints</div>
                            <div style={{ maxWidth: 480, padding: 0, marginTop: 15, marginLeft: 20 }}>
                                <ProgressBarSteps percent={55} steps={[20, 55, 95]} color="#22c55e" bgColor="#e5e7eb" height={30} />
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