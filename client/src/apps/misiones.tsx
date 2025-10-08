import { Router } from 'express';
import styles from "./misiones.module.css"
import ProgressBarSteps from "../components/misionesComponents/progressBar"
import OptionGrid, { OptionItem } from "../components/misionesComponents/optionGrid"
import Carousel from "../components/misionesComponents/carousel"
const router = Router();

const dataFromDB: OptionItem[] = [
    { id: 1, text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: true },
    { id: 2, text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
    { id: 3, text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: true },
    { id: 4, text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
    { id: 5, text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
    { id: 6, text: "Una tienda online completa desarrollada con Next.js y Stripe para pagos.", active: false },
];

export default function Misiones() {
    return (
        <div className="min-h-screen bg-gray-50">
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

                        <div style={{ padding: 24 }}>
                            <OptionGrid
                                items={dataFromDB}
                                columns={2}
                                checkColor="#22c55e"
                                ringColor="#ffffff"
                            />
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