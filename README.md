# Üzleti Modell Vászon (Business Model Canvas) - AI Támogatással

Ez a projekt egy modern, interaktív **Üzleti Modell Vászon** alkalmazás, amely a **Google Gemini AI** erejét használja fel, hogy segítse a vállalkozókat és üzleti tervezőket ötleteik kidolgozásában és elemzésében. Használható webes alkalmazásként vagy Chrome bővítményként is.

## 🌟 Főbb Jellemzők

- **Interaktív Vászon**: A klasszikus 9 építőkockából álló Business Model Canvas digitális, szerkeszthető változata.
- **AI-Alapú Elemzés**: A Google Gemini mesterséges intelligencia segítségével automatikus összefoglalókat és elemzéseket készíthet üzleti koncepciójáról.
- **Dokumentum Elemzés**: Töltsön fel meglévő üzleti terveket vagy jegyzeteket (.txt, .md, .pdf, .docx formátumban), és az AI segít kinyerni belőlük a lényeget.
- **Vizuális Riportok**: Generáljon látványos grafikonokat és vizualizációkat az üzleti modellje alapján.
- **Ötletgenerálás**: Az AI javaslatokat tesz a vászon egyes elemeinek kitöltésére.
- **Exportálás**: Töltse le kész üzleti modelljét Markdown formátumban.
- **Biztonságos**: Saját Google Gemini API kulcs használata, az adatok a böngészőben maradnak (kivéve az AI elemzést).

## 🛠️ Technológiák

A projekt a legmodernebb webes technológiákra épül:

- **Frontend**: React, TypeScript, Vite
- **Stílus**: Tailwind CSS (Glassmorphism design)
- **AI Integráció**: Google Gemini API (`@google/genai`)
- **Vizualizáció**: Recharts, Mermaid
- **Ikonok**: Heroicons

## 🚀 Telepítés és Futtatás

### Fejlesztői környezet (Webes alkalmazás)

Kövesse az alábbi lépéseket a projekt helyi futtatásához:

1.  **Klónozza a repót:**
    ```bash
    git clone https://github.com/felhasznalonev/uzleti-modell-vaszon.git
    cd uzleti-modell-vaszon
    ```

2.  **Telepítse a függőségeket:**
    ```bash
    npm install
    ```

3.  **Indítsa el a fejlesztői szervert:**
    ```bash
    npm run dev
    ```

4.  Nyissa meg a böngészőben a megjelenő címet (általában `http://localhost:5173`).

### Chrome Bővítményként való telepítés

1.  **Építse fel a projektet:**
    ```bash
    npm run build
    ```
    Ez létrehoz egy `dist` mappát a projekt gyökerében.

2.  **Nyissa meg a Chrome bővítmények kezelőjét:**
    - Írja be a címsorba: `chrome://extensions`
    - Kapcsolja be a **Fejlesztői módot** (Developer mode) a jobb felső sarokban.

3.  **Töltse be a bővítményt:**
    - Kattintson a **Kicsomagolt betöltése** (Load unpacked) gombra.
    - Válassza ki a projekt `dist` mappáját.

4.  Az alkalmazás mostantól elérhető a Chrome bővítmények között, és új lapként vagy felugró ablakban használható (a konfigurációtól függően).

## 🔑 Használat

1.  **API Kulcs Beállítása**: Az alkalmazás indításakor vagy a "Beállítások" (fogaskerék ikon) menüben adja meg Google Gemini API kulcsát. (Ingyenesen igényelhető a [Google AI Studio](https://aistudio.google.com/)-ban).
2.  **Koncepció Megadása**: Írja be röviden üzleti ötletét, vagy töltsön fel egy dokumentumot a gémkapocs ikonnal.
3.  **Vászon Kitöltése**: 
    - Kattintson a "+" gombra a blokkokban új elemek hozzáadásához.
    - Használja az AI javaslatokat az ötleteléshez.
4.  **Elemzés és Export**: 
    - Kattintson az "Összefoglaló" gombra egy szöveges elemzésért.
    - A "Riport" gomb vizuális áttekintést ad.
    - A "Letöltés" gombbal elmentheti munkáját.

## 📄 Licenc

Minden jog fenntartva.
