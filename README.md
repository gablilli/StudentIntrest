# StudentIntrest - ClasseViva Dashboard

A complete ClasseViva client with **grades**, **agenda**, **noticeboard**, **didactics**, **notes**, **absences**, and **Google Calendar sync**.

Integrates:
- 🎨 Frontend from [sysregister-reborn](https://github.com/gablilli/sysregister-reborn)
- 🔐 Authentication methods from [chemediaho](https://github.com/gablilli/chemediaho)
- 📡 API endpoints from [Classeviva-Official-Endpoints](https://github.com/Lioydiano/Classeviva-Official-Endpoints)
- 📅 Calendar sync from [CVVCalendarSync](https://github.com/LucaCraft89/CVVCalendarSync)

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](./DOCKER.md)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](./proxy/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## ✨ Features

### Core Features
- ✅ **Grades & Averages** - View all grades with calculated averages per subject and period
- ✅ **Goal Calculator** - Calculate what grade you need to reach your target average
- ✅ **Agenda** - View all school events, homework, and appointments
- ✅ **Noticeboard (Bacheca)** - Read school announcements and circulars
- ✅ **Notes (Note)** - View disciplinary notes and warnings
- ✅ **Absences (Assenze)** - Track absences, late arrivals, and early exits
- ✅ **Didactics (Didattica)** - Access teaching materials shared by teachers

### Export & Sync
- 📥 **Export Grades to CSV** - Download all grades in CSV format
- 📅 **Export Agenda to ICS** - Download agenda as iCalendar file
- 🔄 **Google Calendar Sync** - Sync agenda directly to Google Calendar

### Technical Features
- ✅ **100% Client-Side** - Your credentials stay on your device
- ✅ **Cross-Platform** - Works on Chrome extension + Web app (iOS compatible)
- ✅ **PWA Support** - Add to home screen on mobile devices
- ✅ **Docker Ready** - One command deployment
- ✅ **Session Persistence** - Stay logged in for 24 hours

## 🚀 Quick Start

### Option 1: 🐳 Docker (Recommended)

```bash
cp .env.example .env
docker compose up -d
# Access at http://localhost:8080
```

### Option 2: ☁️ Cloudflare Workers

```bash
npm install -g wrangler
wrangler login
cd proxy && wrangler deploy
# Deploy web to GitHub Pages
```

### Option 3: Local Development

```bash
npm install
npm run dev:proxy-node  # Start proxy server
npm run dev:web         # Start web server (http://localhost:8080)
```

## 📱 Mobile Support

Works perfectly on iOS and Android! Can be added to home screen as a PWA:

1. Open website in Safari/Chrome
2. Tap Share → "Add to Home Screen"
3. Works like a native app!

## 📁 Project Structure

```
├── browser-extension/   # Chrome/Firefox extension
├── shared/             # Shared code
│   ├── api.js          # All ClasseViva API functions
│   ├── calculator.js   # Grade calculations & statistics
│   ├── calendar-sync.js # Google Calendar integration
│   ├── config.js       # Environment configuration
│   └── ui-bootstrap.js # UI components & logic
├── web/                # Website (iOS compatible)
├── proxy/              # CORS proxy server
└── docker-compose.yml  # Docker orchestration
```

## 🔌 API Endpoints

Based on [Classeviva-Official-Endpoints](https://github.com/Lioydiano/Classeviva-Official-Endpoints):

### Authentication
- `POST /auth/login` - Login and get token
- `GET /auth/status` - Check auth status
- `GET /auth/avatar` - Get user avatar

### Student Data
- `GET /students/{id}/grades` - Get all grades
- `GET /students/{id}/periods` - Get school periods
- `GET /students/{id}/agenda/all/{begin}/{end}` - Get agenda events
- `GET /students/{id}/noticeboard` - Get noticeboard items
- `GET /students/{id}/notes/all` - Get disciplinary notes
- `GET /students/{id}/absences/details` - Get absences
- `GET /students/{id}/didactics` - Get teaching materials
- `GET /students/{id}/lessons/{day}` - Get lessons
- `GET /students/{id}/subjects` - Get subjects
- `GET /students/{id}/calendar/all` - Get calendar
- `GET /students/{id}/card` - Get student info
- `GET /students/{id}/schoolbooks` - Get schoolbooks

## 📊 Features from Integrated Projects

### From chemediaho
- Goal calculator (calculate needed grade for target average)
- CSV export functionality
- Session management
- Grade statistics

### From CVVCalendarSync
- ICS file generation
- Google Calendar API integration
- Event ID generation for sync tracking
- Bidirectional sync support

### From sysregister-reborn
- Modern UI design patterns
- Mobile-first responsive layout
- Bottom navigation for app-like experience
- Card-based interface

## 🐳 Docker Deployment

```bash
# Start services
docker compose up -d

# With custom ports
PROXY_PORT=3001 WEB_PORT=8081 docker compose up -d

# Scale proxy for high traffic
docker compose up -d --scale proxy=3

# View logs
docker compose logs -f

# Stop
docker compose down
```

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
- **[DOCKER.md](DOCKER.md)** - Docker deployment & production setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Compare deployment options
- **[proxy/README.md](proxy/README.md)** - Proxy configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test Docker deployment: `./test-docker.sh`
4. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## Credits

- [sysregister-reborn](https://github.com/gablilli/sysregister-reborn) - Frontend design
- [chemediaho](https://github.com/gablilli/chemediaho) - Authentication & calculations
- [Classeviva-Official-Endpoints](https://github.com/Lioydiano/Classeviva-Official-Endpoints) - API documentation
- [CVVCalendarSync](https://github.com/LucaCraft89/CVVCalendarSync) - Calendar sync functionality

**Note:** This project is not affiliated with or endorsed by Spaggiari Group.
