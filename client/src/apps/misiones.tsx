import styles from "./misiones.module.css"

export default function Misiones() {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                Misiones
                <div className={styles.parent}>
                    <div className={styles.div6}>6</div>
                    <div className={styles.div7}>7</div>
                    <div className={styles.div8}>8</div>
                </div>
            </main>
        </div>
    )
}