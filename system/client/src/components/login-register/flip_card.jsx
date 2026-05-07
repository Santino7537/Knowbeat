import { useState } from "react";
import Login_card from "./login_card";
import Register_card from "./register_card";
import styles from "./flip_card.module.css";

export default function FlipCard({ onLoginSuccess }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={styles.card3d}>
      <div className={`${styles.cardInner} ${flipped ? styles.flipped : ""}`}>
        
        <div className={styles.cardFront}>
          <Login_card
            onLoginSuccess={onLoginSuccess}
            switchToRegister={() => setFlipped(true)}
          />
        </div>

        <div className={styles.cardBack}>
          <Register_card
            switchToLogin={() => setFlipped(false)}
          />
        </div>

      </div>
    </div>
  );
}