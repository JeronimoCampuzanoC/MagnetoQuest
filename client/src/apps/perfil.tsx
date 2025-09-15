import styles from "./perfil.module.css";
import ProfileCard from "../components/perfilComponents/profileCard";
import ProfileTabs from "../components/perfilComponents/profileTabs";
import TriviaButton from "../components/perfilComponents/triviaButton";
import CvUploader from "../components/misionesComponents/cvUploader";

export default function Perfil() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className={styles.parent}>
                <div className={styles.div2}>
                    <div className="p-3 d-flex justify-content-center">
                        <ProfileCard
                            firstName="Laura"
                            lastName="Castrillon Fajardo"
                            lastUpdated="2025-08-09"
                            isActiveSearch={true}
                            onToggleActive={(val) => console.log("toggle:", val)}
                            onAddPhoto={() => console.log("Añadir foto")}
                        // photoUrl="https://..." // si tienes foto, descomenta
                        />
                    </div>

                    <div className={styles.triviaButtonContainer}>
                        <TriviaButton
                            title="¡Aumenta tus posibilidades de ser contratado!"
                            subtitle="Completa misiones y mejora tus habilidades"
                            imageSrc="/static/user.png"
                            onClick={() => console.log("Ir a trivia")}
                            className="m-3"
                        />
                    </div>

                    <div style={{ maxWidth: 420, marginTop: -20 }}>
                        <CvUploader onFileSelected={(file) => console.log("Archivo:", file)} />
                    </div>
                </div>
                <div className={styles.div3}><ProfileTabs /></div>
            </div>
        </div>
    )
}