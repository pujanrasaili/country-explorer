# 🌍 Country Explorer

> A beautifully designed world atlas — search, filter, and explore every nation on Earth.

![alt text](Screenshot_26-5-2026_154017_127.0.0.1.jpeg)

🔗 **Live Demo → [pujanrasaili.github.io/country-explorer](https://pujanrasaili.github.io/country-explorer)**

---

## ✨ Features

- 🔍 **Smart Search** — instant results with dropdown suggestions and highlighted matches
- 🌐 **Region Filter** — Africa, Americas, Asia, Europe, Oceania
- 🔃 **Sort** — by name A→Z, Z→A, population, or area
- ❤️ **Favorites** — save countries and view them in a dedicated tab (persisted in localStorage)
- 🗺️ **Neighboring Countries** — click any border country chip in the modal to explore it
- 🌙 **Dark / Light Mode** — toggle with one click, preference saved
- 💀 **Skeleton Loading** — smooth loading animation while data fetches
- 📱 **Fully Responsive** — works great on mobile and desktop

---

## 🖥️ Preview

| Dark Mode | Light Mode |
|-----------|------------|
| ![Dark](preview.png) | Toggle with ☀️ button |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic structure |
| **CSS3** | Custom properties, animations, responsive grid |
| **Vanilla JavaScript** | Fetch, filter, sort, modal, localStorage |
| **[REST Countries API](https://restcountries.com)** | Live country data |
| **[Fraunces](https://fonts.google.com/specimen/Fraunces)** + **[Outfit](https://fonts.google.com/specimen/Outfit)** | Typography |

Zero frameworks. Zero dependencies. Pure HTML/CSS/JS.

---

## 📁 Project Structure

```
country-explorer/
├── index.html      # App structure and markup
├── style.css       # All styles — dark/light themes, animations, layout
├── script.js       # Fetch, filter, sort, modal, favorites, suggestions
├── preview.png     # Screenshot for README
└── README.md       # You're reading it!
```

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/pujanrasaili/country-explorer.git
cd country-explorer

# Start a local server (required for API fetch)
npx serve .
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> ⚠️ Always use a local server. Opening `index.html` directly as a `file://` URL will block the API fetch due to browser security restrictions.

---

## 🌐 API

Data is fetched from the free **[REST Countries API v3.1](https://restcountries.com)**:

```
GET https://restcountries.com/v3.1/all?fields=name,flags,population,capital,region,subregion,area,languages,currencies,cca2,cca3,borders
```

No API key required.

Made with ❤️ by **[Pujan Rasaili](https://github.com/pujanrasaili)**