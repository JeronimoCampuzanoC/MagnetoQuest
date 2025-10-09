import styles from "./misiones.module.css"
import ProgressBarSteps from "../components/misionesComponents/progressBar"
import OptionGrid, { OptionItem } from "../components/misionesComponents/optionGrid"
import Carousel from "../components/misionesComponents/carousel"
import React, { useEffect, useState } from "react"
import BadgesOffCanvas from "../components/misionesComponents/badgesOffCanvas"

const items: OptionItem[] = [
    { id: "1", text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: true },
    { id: "2", text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
    { id: "3", text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: true },
    { id: "4", text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
    { id: "5", text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
    { id: "6", text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
];

export default function Misiones() {
    // const [items, setItems] = useState<OptionItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // useEffect(() => {
    //     // intenta obtener userId de localStorage, sino usa un default (mismo que en servidor)
    //     const storedUser = localStorage.getItem('userId')
    //     const userId = storedUser || '0b40bf7c-9c93-45d8-87f5-8647730f99b9'

    //     const fetchMissions = async () => {
    //         setLoading(true)
    //         try {
    //             const res = await fetch(`/users/${userId}/missions-in-progress`)
    //             if (!res.ok) throw new Error(`HTTP ${res.status}`)
    //             const data: Array<{ id: string; text: string; active: boolean }> = await res.json()
    //             // mapear directamente al tipo OptionItem
    //             setItems(data.map(d => ({ id: d.id, text: d.text, active: !!d.active })))
    //         } catch (e: any) {
    //             console.error('Error fetching missions', e)
    //             setError(e?.message || 'Error')
    //         } finally {
    //             setLoading(false)
    //         }
    //     }

    //     fetchMissions()
    // }, [])

    
    return (
        <div className="min-h-screen bg-gray-50">
            <BadgesOffCanvas/>
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

                        <div style={{ padding: 24 , height: '100%' }}>
                            {loading ? (
                                <div>Cargando misiones...</div>
                            ) : error ? (
                                <div>Error: {error}</div>
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