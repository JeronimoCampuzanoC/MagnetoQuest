import styles from "./misiones.module.css"
import ProgressBarSteps from "../components/perfilComponents/progressBar"

export default function Misiones() {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className={styles.parent}>
                    <div className={styles.progressBar}>
                        <div style={{ maxWidth: 480, padding: 16 }}>

                            <div style={{ height: 20 }} />

                            {/* 55%, color personalizado y altura mayor */}
                            <ProgressBarSteps
                                percent={55}
                                steps={[20, 55, 97]}
                                color="#22c55e"
                                bgColor="#e5e7eb"
                                height={26}
                            />
                        </div>
                    </div>
                    <div className={styles.div7}>7</div>
                    <div className={styles.div8}>8</div>
                </div>
            </main>
        </div>
    )
}