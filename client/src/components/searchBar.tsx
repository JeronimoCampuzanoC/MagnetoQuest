import React, { useState, FormEvent } from "react";
import styles from "./searchBar.module.css";

type Props = {
  placeholder?: string;
  onSearch?: (query: string) => void; // opcional: callback al buscar
  className?: string;
};

const SearchBar: React.FC<Props> = ({
  placeholder = "Busca empleo por cargo o profesión",
  onSearch,
  className,
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.(value.trim());
  };

  return (
    <form className={`${styles.container} ${className ?? ""}`} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />

      {/* botón con ícono (SVG inline) */}
      <button type="submit" className={styles.iconBtn} aria-label="Buscar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.icon}
        >
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </form>
  );
};

export default SearchBar;
