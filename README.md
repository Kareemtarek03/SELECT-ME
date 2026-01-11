# SELECT ME - Mechatronics Fan Selection Desktop Application

![Electron](https://img.shields.io/badge/Electron-22.0.0-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

## Project Overview

SELECT ME is a professional desktop application designed for industrial fan selection and specification. The application enables engineers, HVAC professionals, and technical stakeholders to select optimal axial and centrifugal fans based on precise performance requirements including airflow, static pressure, temperature, and motor specifications.

**Application Type:** Desktop application built with Electron framework  
**Target Users:** Mechanical engineers, HVAC designers, industrial equipment specifiers, sales engineers  
**Core Purpose:** Streamline fan selection workflow by automating performance calculations, motor matching, and technical datasheet generation

The desktop version maintains functional parity with the web version, ensuring consistent calculation logic, data flow, and user experience across platforms.

---

## Key Features

### Fan Selection Workflow
- **Dual Fan Type Support**: Complete selection workflow for both axial and centrifugal fans
- **Multi-Parameter Input**: Configure airflow rate, static pressure, RPM, temperature, number of phases, safety factors, and static pressure factors
- **Unit Flexibility**: Support for multiple unit systems (CFM, m³/s, Pa, kPa, bar, kW, HP, etc.)
- **Real-Time Filtering**: Filter results by impeller diameter, blade configuration, and material specifications
- **Performance Ranking**: Automatic sorting by total efficiency to prioritize optimal selections

### Axial & Centrifugal Fan Handling
- **Axial Fans**: 10 fan types (AF-S, AF-L, WF, ARTF, SF, ABSF-C, ABSF-S, SWF, SARTF, AJF)
- **Centrifugal Fans**: 9 fan types (CF-SIB-B, CF-SIB-F, CF-DIB-B, CF-DIB-F, CF-AF-B, CF-AF-F, CF-RB-B, CF-RB-F, CF-PL)
- **Affinity Laws**: Automatic recalculation of performance curves based on speed and density changes
- **Blade Configurations**: Multiple impeller configurations (5-5, 6-3, 6-6, 9-3, 9-9, 12-6, 12-12, 16-8, 16-16)
- **Material Options**: Aluminum (A) and Plastic (P) blade materials with symbol variations

### Performance Calculations
- **Cubic Spline Interpolation**: Accurate performance prediction using piecewise cubic interpolation
- **Density Correction**: Automatic air density calculation from temperature input
- **Fan Affinity Laws**: Speed and density-based performance scaling (Q∝N, P∝N²ρ, Power∝N³ρ)
- **Efficiency Metrics**: Both static and total efficiency calculations
- **Motor Matching**: Automatic selection of appropriate motors based on power requirements and pole count

### PDF Datasheet Generation
- **Professional Layout**: Multi-page PDF datasheets with company branding and technical specifications
- **Performance Data Tables**: Comprehensive tables showing airflow, pressure, power, efficiency at operating point
- **Fan Curves**: Embedded performance curve graphs (static pressure, power, efficiency vs. airflow)
- **Noise Data**: Sound power level (LW) and sound pressure level (LP) calculations with octave band analysis
- **Motor Specifications**: Complete motor details including efficiency, insulation class, power rating, poles, phase
- **Custom Naming**: PDF filenames use Fan Unit No. for easy identification and organization

### Catalog & Download Behavior
- **Catalog Browser**: Browse available product catalogs organized by fan series
- **Direct File Opening**: Catalog PDFs open directly in browser/viewer instead of triggering save dialog
- **Search Functionality**: Filter catalogs by series name or product ID
- **File Size Display**: Shows catalog file sizes for user reference



---

## Application Architecture

### High-Level Architecture

The application follows a three-tier architecture:

1. **Presentation Layer (React UI)**: Handles user interaction, form inputs, data visualization, and result presentation
2. **Business Logic Layer (Express + Services)**: Processes fan selection logic, performance calculations, motor matching, and PDF generation
3. **Data Layer (JSON files)**: Stores fan specifications, motor data, and performance curves

### Component Separation

**UI Components (`client/src/pages/`)**
- Landing page and navigation
- Fan type selection pages (axial/centrifugal)
- Input forms for user requirements
- Results pages with performance data, curves, and noise graphs
- Catalog browser and unit converter

**Data Logic (`server/Newmodules/`)**
- `axial/AxialFanData/`: Axial fan selection service with cubic spline interpolation
- `centrifugal/CentrifugalFanData/`: Centrifugal fan selection with multi-phase processing
- Motor matching algorithms based on power requirements and pole count
- Performance recalculation using fan affinity laws

**PDF Generation (`server/Newmodules/*/PDF/`)**
- `axial/AxialPDF/`: Axial fan datasheet generator
- `centrifugal/CentrifugalPDF/`: Centrifugal fan datasheet generator
- PDFKit-based document creation with embedded SVG charts
- Noise spectrum bar charts and performance tables

**Desktop Framework (Electron)**
- `electron-main.cjs`: Main process managing window creation, embedded Express server, and API routing
- Embedded server runs on `http://127.0.0.1:5001`
- File-based data loading (no database dependency in production build)
- Dynamic window sizing based on screen resolution

---

## Project Structure

```
Mechtronics-Fans-V2-Desktop/
├── client/                          # React frontend application
│   ├── public/
│   │   ├── fan-data.json           # Axial fan performance data
│   │   ├── motor-data.json         # Motor specifications
│   │   ├── icon-*.png              # Application icons (16-256px)
│   │   └── logo.svg                # Company logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── HamburgerMenu.jsx   # Navigation menu
│   │   │   └── slectors.jsx        # Unit selection dropdowns
│   │   ├── pages/
│   │   │   ├── axial/
│   │   │   │   ├── AxialFanTypesPage.jsx        # Axial fan type selection
│   │   │   │   ├── AxialFanSelectionPage.jsx    # Axial input form
│   │   │   │   └── AxialResultsPage.jsx         # Axial results with tabs
│   │   │   ├── centrifugal/
│   │   │   │   ├── CentrifugalFanTypesPage.jsx  # Centrifugal type selection
│   │   │   │   ├── CentrifugalFanSelectionPage.jsx
│   │   │   │   ├── CentrifugalFanSecondInputPage.jsx
│   │   │   │   └── CentrifugalFanFinalResultPage.jsx
│   │   │   ├── LandingPage.jsx     # Application home
│   │   │   ├── FanCategories.jsx   # Axial vs Centrifugal selection
│   │   │   ├── CatalogPage.jsx     # Product catalog browser
│   │   │   └── UnitConverter.jsx   # Unit conversion tool
│   │   ├── context/
│   │   │   └── FormContext.js      # Global state management
│   │   └── App.js
│   └── package.json
├── server/                          # Express backend services
│   ├── Newmodules/
│   │   ├── axial/
│   │   │   ├── AxialFanData/
│   │   │   │   └── axialFanData.service.js    # Axial selection logic
│   │   │   └── AxialPDF/
│   │   │       ├── axialPdfGenerator.service.js
│   │   │       └── PDF/assets/                # PDF templates & images
│   │   └── centrifugal/
│   │       ├── CentrifugalFanData/
│   │       │   └── centrifugalFanData.service.js  # Centrifugal logic
│   │       └── CentrifugalPDF/
│   │           ├── centrifugalPdfGenerator.service.js
│   │           └── assets/                    # PDF assets
│   └── index.js                     # Express server (web version only)
├── Catologs/                        # Product catalog PDFs
├── scripts/
│   ├── generate-circular-icon.cjs   # Icon generation script
│   └── create-ico-file.cjs          # Icon configuration script
├── electron-main.cjs                # Electron main process
├── package.json                     # Root dependencies & build config
└── README.md
```

### Key Directories

**Axial Modules (`server/Newmodules/axial/`)**
- Fan data processing with cubic spline interpolation
- Motor matching based on power and pole count
- PDF generation with performance curves and noise data

**Centrifugal Modules (`server/Newmodules/centrifugal/`)**
- Multi-phase fan selection workflow (Phase 3-20)
- Fan affinity law calculations
- Comprehensive PDF datasheets with sound spectrum analysis

**Result Pages (`client/src/pages/*/Results*.jsx`)**
- Tabbed interface: Performance Data, Fan Curve, Noise Graph
- Interactive charts using Recharts library
- Real-time filtering by diameter, configuration, material

**PDF Generators (`server/Newmodules/*/PDF/`)**
- PDFKit-based document creation
- SVG-to-PDF conversion for charts
- Multi-page layouts with headers, footers, and branding

---

## Data Flow & Logic

### Fan Data Loading

**Development Mode:**
- Fan data loaded from `client/public/fan-data.json`
- Motor data loaded from `client/public/motor-data.json`
- Files read synchronously on server startup

**Production Mode (Desktop):**
- Data files bundled into `client/build/` during React build
- Electron main process loads data from bundled files
- No external database required

### User Input Processing

1. **Input Collection**: User provides airflow, pressure, RPM, temperature, phases, safety factors
2. **Unit Conversion**: All inputs converted to base units (m³/s, Pa, kW)
3. **Density Calculation**: Air density computed from temperature using ideal gas law
4. **Fan Type Filtering**: Database filtered by selected fan type (e.g., AF-L, CF-SIB-B)

### Result Generation

**Axial Fan Selection:**
1. Load all fans matching selected type
2. For each fan:
   - Calculate RPM ratio and density ratio
   - Scale performance curves using affinity laws
   - Interpolate static pressure at input airflow using cubic spline
   - Check if predicted pressure falls within SPF tolerance
3. Match motor based on required power + safety factor
4. Sort results by total efficiency (descending)

**Centrifugal Fan Selection:**
1. Multi-phase processing (Phase 3-20)
2. Phase 3-16: Fan filtering and performance calculation
3. Phase 17: Sound data calculation
4. Phase 18: Motor matching and affinity law application
5. Phase 19: Fan curve data generation
6. Phase 20: Noise spectrum analysis

### UI Presentation vs Backend Logic

**UI Responsibilities:**
- Display formatted results in cards and tables
- Render interactive charts (Recharts)
- Handle user interactions (filtering, tab switching)
- Format numbers and units for display

**Backend Responsibilities:**
- All performance calculations
- Motor matching algorithms
- Noise level computations
- PDF document generation
- Data validation and error handling

**Web Version as Source of Truth:**
- Desktop calculation logic imported from web version services
- Identical formulas for efficiency, power, noise
- Same interpolation methods (cubic spline)
- Consistent motor efficiency handling (efficiency50Hz, effCurve)

---

## Axial & Centrifugal Logic Parity

### Performance Data Parity

**Axial Fans:**
- Cubic spline interpolation for performance prediction
- Affinity laws: `Q_new = Q * (RPM_new/RPM)`, `P_new = P * (RPM_new/RPM)² * (ρ_new/ρ)`
- Static and total efficiency calculations
- Velocity pressure computation

**Centrifugal Fans:**
- Same affinity law formulas
- Multi-phase calculation pipeline
- Identical interpolation methods
- Consistent efficiency metrics

### Motor Data Parity

**Desktop Schema:**
- Motor efficiency stored as JSON string `effCurve: "[93.6, 92.5, 91.0]"`
- Parsed to array `[efficiency50Hz, efficiency375Hz, efficiency25Hz]`

**Web Schema:**
- Separate fields: `efficiency50Hz`, `efficiency375Hz`, `efficiency25Hz`

**Harmonization:**
- Desktop service parses JSON and populates individual fields
- Both versions use `efficiency50Hz` for calculations
- Percentage vs decimal handling (values >1 converted to decimal)

### Noise Data Parity

**Sound Power Level (LW):**
```
LW(A) = 62 + 10*log10(motorInputPower) + 10*log10(staticPressure)
```

**Sound Pressure Level (LP):**
```
LP(A) = LW(A) - 10*log10(4π*distance²) - 10*log10(directivityFactor)
```

**Octave Band Analysis:**
- Both versions use identical frequency bands (63Hz - 8000Hz)
- Same attenuation factors per band
- Consistent A-weighting corrections

### Efficiency Parity

**Motor Efficiency:**
- Desktop: `motor.efficiency50Hz` or `motor.effCurve[0]`
- Web: `motor.efficiency50Hz`
- Both handle percentage (93.6) and decimal (0.936) formats

**Fan Efficiency:**
- Static: `η_static = (P_static * Q) / (Power * 1000)`
- Total: `η_total = (P_total * Q) / (Power * 1000)`
- Identical formulas across platforms

---

## PDF Datasheet Generation

### Generation Process

**Axial PDFs:**
1. Service: `server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js`
2. Endpoint: `POST /api/axial/pdf/datasheet`
3. Input: `{ fanData, userInput, units }`
4. Output: PDF stream with `Content-Disposition: inline`

**Centrifugal PDFs:**
1. Service: `server/Newmodules/centrifugal/CentrifugalPDF/centrifugalPdfGenerator.service.js`
2. Endpoint: `POST /api/centrifugal/pdf/datasheet`
3. Same input/output structure

### Data Included

**Performance Section:**
- Operating point: Airflow, static pressure, total pressure, velocity pressure
- Fan input power and motor input power
- Static efficiency and total efficiency
- Fan speed (RPM) and air density

**Noise Section:**
- Sound power level LW(A) in dB
- Sound pressure level LP(A) in dB at specified distance
- Octave band spectrum (63Hz - 8000Hz)
- Bar charts for LW and LP spectra

**Motor Details:**
- Motor model and manufacturer
- Power rating (kW and HP)
- Number of poles and phases
- Voltage and frequency
- Motor efficiency (percentage)
- Insulation class

**Fan Specifications:**
- Fan model designation
- Impeller diameter and configuration
- Blade count, angle, and material
- Design density vs input density

### Naming Logic

**Filename Format:**
```
{FanUnitNo}_datasheet.pdf
```

**Fan Unit No. Source:**
- Primary: `userInput.fanUnitNo` (user-provided identifier)
- Fallback: `fanData.FanModel` (auto-generated model string)
- Default: `"DataSheet"`

**Sanitization:**
- Invalid filename characters (`/\:*?"<>|`) replaced with `_`
- Example: `AF-L-500-6\45\AM-4T-2.2` → `AF-L-500-6_45_AM-4T-2.2_datasheet.pdf`

### Opening vs Downloading

**Inline Display (Default):**
```javascript
res.setHeader('Content-Disposition', 'inline; filename="{name}.pdf"');
```
- Opens PDF in browser/viewer
- No save dialog

**Download Prompt:**
```javascript
res.setHeader('Content-Disposition', 'attachment; filename="{name}.pdf"');
```
- Triggers save dialog
- Used by `/api/pdf/datasheet/download` endpoint

---

## UI & UX Design Principles

### Card-Based Layout

**Performance Data Cards:**
- Two-column grid layout (`gridTemplateColumns: "1fr 1fr"`)
- Light background (`#f8fafc`) with subtle borders (`#e2e8f0`)
- Rounded corners (`borderRadius: 12px`)
- Consistent padding (`1.25rem`)

**Card Headers:**
- Icon + title format (⚙ Fan Specifications, ⚡ Motor Details)
- Font size `0.9375rem`, weight `600`
- Color `#1e293b`

**Data Rows:**
- Flex layout with space-between justification
- Label color `#64748b`, value color `#1e293b`
- Bottom border separator (`1px solid #e2e8f0`)
- Padding `0.625rem 0`

### Tabs (Performance, Fan Curve, Noise)

**Tab Navigation:**
- Horizontal button group
- Active tab: Blue background (`#3b82f6`), white text
- Inactive tab: White background, gray text (`#64748b`)
- Hover effects: Background color transition

**Tab Content:**
- Performance: Two-column card grid
- Fan Curve: Interactive line chart with legend
- Noise: Summary cards + octave band bar charts

### Responsive Behavior

**Desktop Window:**
- Dynamic sizing: `85%` of screen width/height
- Minimum: 900px width, 600px height
- No maximum constraints (scales with screen resolution)

**Layout Adaptation:**
- Padding adjusts based on viewport: `px={{ base: 4, md: 8, lg: 12 }}`
- Font sizes scale: `fontSize={{ base: "xl", md: "2xl" }}`
- Grid columns collapse on smaller screens

### Hover and Interaction

**Buttons:**
- Color transition on hover (e.g., `#3b82f6` → `#2563eb`)
- Box shadow elevation
- Cursor pointer

**Cards:**
- Border color change on hover (`#e2e8f0` → `#cbd5e1`)
- Subtle shadow increase

**Charts:**
- Tooltip on data point hover
- Legend item highlighting
- Crosshair cursor

---

## Desktop-Specific Behavior

### Dynamic Window Sizing

**Configuration (`electron-main.cjs`):**
```javascript
const windowWidth = Math.max(Math.floor(screenWidth * 0.85), 900);
const windowHeight = Math.max(Math.floor(screenHeight * 0.85), 600);
```

- Scales to 85% of primary display work area
- Minimum constraints prevent unusable small windows
- No maximum limits for large/high-resolution displays

### Desktop Icon Configuration

**Icon Asset:**
- Format: PNG with transparency
- Sizes: 16×16, 32×32, 48×48, 64×64, 128×128, 256×256
- Design: White circular background with logo, transparent corners
- Location: `client/public/icon-256.png`

**Electron Configuration:**
```javascript
const iconPath = isDev
  ? path.join(__dirname, "client", "public", "icon-256.png")
  : path.join(resourcesPath, "client", "build", "icon-256.png");
```

**Build Configuration (`package.json`):**
```json
"win": {
  "icon": "client/public/icon-256.png"
}
```

### File Opening vs File Saving

**Catalog PDFs:**
```javascript
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
window.open(url, "_blank");  // Opens directly, no save dialog
```

**Datasheet PDFs:**
- Default: `Content-Disposition: inline` (opens in viewer)
- Download endpoint: `Content-Disposition: attachment` (save dialog)

### Platform Considerations (Windows)

**NSIS Installer:**
- Non-silent install (user can choose directory)
- Desktop shortcut creation
- Start menu shortcut creation
- Uninstaller included

**File Paths:**
- Windows-style paths handled by Node.js `path` module
- Resources path: `process.resourcesPath` in production
- Development path: `__dirname`

**Icon Rendering:**
- Windows requires proper transparency handling
- White circular background prevents black rendering
- Multiple resolutions for different UI contexts (taskbar, desktop, explorer)

---

## Installation & Build

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Operating System**: Windows 10/11 (for building .exe)

### Local Development Setup

**1. Install Dependencies**
```bash
# Install root and client dependencies
npm run install-all
```

**2. Build React Application**
```bash
npm run build
```

**3. Run Desktop Application**
```bash
npm run electron
```

### Development Mode

**Option 1: Separate Processes**
```bash
# Terminal 1: Start Express server with auto-reload
npm run dev

# Terminal 2: Start Electron (after server is running)
npm run electron
```

**Option 2: Concurrent Execution**
```bash
npm run electron:dev
```
This command starts the server and waits for it to be ready before launching Electron.

### Production Build

**Build Windows Installer**
```bash
npm run dist
```

Output location: `dist/SELECT ME Setup 1.0.0.exe`

**Optimized Build (Smaller Size)**
```bash
npm run dist:prod
```
Disables source maps for reduced file size.

**Portable Build (No Installer)**
```bash
npm run electron:pack
```
Output location: `dist/win-unpacked/SELECT ME.exe`

### Environment Setup

**No Database Required:**
- Desktop version uses JSON files instead of SQLite
- Data bundled into application during build
- No Prisma setup needed for desktop deployment

**Data Files:**
- `client/public/fan-data.json` (1308 fan records)
- `client/public/motor-data.json` (165 motor records)
- Automatically copied to `client/build/` during React build

---

## Known Limitations / Notes

### Data Constraints
- Fan data limited to pre-loaded JSON files (no dynamic database updates)
- Motor data fixed at build time
- Catalog PDFs must be manually added to `Catologs/` folder before building

### Performance Considerations
- Large fan datasets (1000+ records) may cause initial load delay
- Cubic spline interpolation is CPU-intensive for large arrays
- PDF generation with charts can take 2-3 seconds for complex datasheets

### Platform Limitations
- Currently supports Windows only (NSIS installer)
- macOS and Linux builds not configured
- Icon optimization focused on Windows rendering

### UI Assumptions
- Minimum screen resolution: 1280×720
- Charts require sufficient width for readability
- Some text may truncate on very small displays

### Calculation Notes
- Cubic spline extrapolation used when input airflow exceeds curve range
- Motor matching assumes standard pole counts (2, 4, 6, 8)
- Noise calculations use empirical formulas (not CFD-based)

### Web Version Dependency
- Desktop logic mirrors web version
- Updates to web calculation logic require manual sync to desktop
- Schema changes in web version may require desktop updates

---

## Future Improvements

### Performance Optimizations
- Implement worker threads for heavy calculations
- Cache interpolated performance curves
- Lazy-load fan data by type to reduce initial memory footprint
- Optimize PDF generation with image compression

### Feature Extensions
- Multi-language support (English, Arabic)
- Custom fan curve import from CSV
- Comparison mode (side-by-side fan analysis)
- Export results to Excel
- Project management (save/load selection sessions)

### UI Refinements
- Dark mode theme
- Customizable chart colors
- Printable summary reports
- Advanced filtering (multi-select, range sliders)
- Keyboard shortcuts for power users

### Data Expansion
- Larger motor database with more manufacturers
- Additional fan types and configurations
- Historical performance data tracking
- Integration with external pricing databases

### Platform Support
- macOS build configuration
- Linux AppImage/deb packages
- Auto-update mechanism for desktop app
- Cloud sync for user preferences

---

## Technologies Used

### Frontend
- **React 18** - UI framework with hooks and context API
- **Chakra UI** - Component library for consistent design
- **Recharts** - Chart visualization library
- **React Router v6** - Client-side routing

### Backend
- **Express.js 4** - Web server framework
- **PDFKit 0.17** - PDF document generation
- **svg-to-pdfkit** - SVG chart embedding in PDFs
- **cubic-spline** - Interpolation library

### Desktop
- **Electron 22** - Cross-platform desktop framework
- **electron-builder 24** - Application packaging and installer creation

### Development Tools
- **Nodemon** - Auto-reload for development server
- **Sharp** - Image processing for icon generation
- **Concurrently** - Run multiple npm scripts simultaneously

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run install-all` | Install root and client dependencies |
| `npm run build` | Build React app for production |
| `npm run electron` | Start Electron desktop app |
| `npm run electron:dev` | Start server + Electron concurrently |
| `npm run dist` | Build Windows installer (.exe) |
| `npm run dist:prod` | Build optimized installer (no source maps) |
| `npm run electron:pack` | Build portable app (no installer) |
| `npm run clean` | Remove dist and build folders |
| `npm run dev` | Start Express server with nodemon |
| `npm start` | Start Express server (production mode) |

---

## Authors

**Kareem Tarek** - Lead Developer  
GitHub: [@Kareemtarek03](https://github.com/Kareemtarek03)

---

## License

This project is licensed under the ISC License.

