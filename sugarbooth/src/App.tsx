import React from "react";
import PhotoBooth from "./components/PhotoBooth";
import styles from './styles/App.module.css';

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <img src="/icon-192.png" alt="Kawaii Booth" className={styles.logo} />
        <h1>Kawaii Booth</h1>
        <p className={styles.subtitle}>Cute photo strips • pastel filters • all in your browser</p>
      </header>
      <main className={styles.main}>
        <PhotoBooth />
      </main>
      <footer className={styles.footer}>
        <small>All processing stays on your device • PWA offline ready</small>
      </footer>
    </div>
  )
}