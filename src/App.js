import React, { useState, useEffect, useMemo } from "react";
import {
  Lock,
  ArrowLeft,
  Map as MapIcon,
  ClipboardList,
  CarFront,
  CheckCircle2,
  X,
  ArrowRightLeft,
  Check,
  Search,
  MapPin,
  Filter,
  RefreshCw,
  Database,
  UploadCloud,
  PieChart,
  Download,
  Lightbulb,
  AlertTriangle,
  Clock,
  History,
  FileText,
  Settings,
  Image as ImageIcon,
  SlidersHorizontal,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";

// --- CONFIGURARE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC8y6ajC7lvKAg1Jl1C8EfB1k9B7Kqcew",
  authDomain: "carpark-ait.firebaseapp.com",
  projectId: "carpark-ait",
  storageBucket: "carpark-ait.firebasestorage.app",
  messagingSenderId: "365544281433",
  appId: "1:365544281433:web:4dd31459e1b161374332c8",
  measurementId: "G-Y2YQQJ11PY",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- SETARI ACCES ---
const PAROLA_USER = process.env.REACT_APP_PAROLA_USER || "AIT2026";
const PAROLA_ADMIN = process.env.REACT_APP_PAROLA_ADMIN || "adminAIT2026";

// --- BAZA DE DATE LOGO-URI DEFAULT ---
const logoMasiniDefault = {
  "Alfa Romeo": "/logos/alfaromeo.png",
  "ALFA ROMEO": "/logos/alfaromeo.png",
  Audi: "/logos/audi.png",
  AUDI: "/logos/audi.png",
  BMW: "/logos/bmw.png",
  CHERY: "/logos/chery.png",
  CITROEN: "/logos/citroen.png",
  DACIA: "/logos/dacia.png",
  FIAT: "/logos/fiat.png",
  FORD: "/logos/ford.png",
  IVECO: "/logos/iveco.png",
  JEEP: "/logos/jeep.png",
  KIA: "/logos/kia.png",
  LEAPMOTOR: "/logos/leapmotor.png",
  Maserati: "/logos/maserati.png",
  MASERATI: "/logos/maserati.png",
  "MERCEDES-BENZ": "/logos/mercedes.png",
  MERCEDES: "/logos/mercedes.png",
  Nissan: "/logos/nissan.png",
  NISSAN: "/logos/nissan.png",
  OPEL: "/logos/opel.png",
  PEUGEOT: "/logos/peugeot.png",
  RENAULT: "/logos/renault.png",
  SKODA: "/logos/skoda.png",
  SSANGYONG: "/logos/ssangyong.png",
  TOYOTA: "/logos/toyota.png",
  Volkswagen: "/logos/volkswagen.png",
  VOLKSWAGEN: "/logos/volkswagen.png",
};

const masinaGoala = () => ({
  marca: "",
  model: "",
  culoare: "",
  detalii: "",
  idMasina: "",
  sasiu: "",
  timestamp: null,
});

const creeazaLocParcare = (zona, numar) => ({
  id: `${zona}${numar}`,
  zona,
  ocupat: false,
  masina: masinaGoala(),
});

const LOCURI_INITIALE = [
  ...Array.from({ length: 36 }, (_, index) => creeazaLocParcare("A", index + 1)),
  ...Array.from({ length: 50 }, (_, index) => creeazaLocParcare("B", index + 1)),
];

const normalizeazaLocuri = (locuri = []) => {
  const locuriPrimite = Array.isArray(locuri) ? locuri : [];
  const locuriDupaId = new Map(locuriPrimite.map((loc) => [loc?.id, loc]));
  const locuriNormalizate = LOCURI_INITIALE.map((locDefault) => {
    const locSalvat = locuriDupaId.get(locDefault.id);
    return {
      ...locDefault,
      ...locSalvat,
      masina: {
        ...masinaGoala(),
        ...(locSalvat?.masina || {}),
      },
    };
  });
  const locuriExtra = locuriPrimite.filter(
    (loc) =>
      loc?.id && !LOCURI_INITIALE.some((defaultLoc) => defaultLoc.id === loc.id)
  );

  return [...locuriNormalizate, ...locuriExtra];
};

const csvCell = (valoare) =>
  `"${String(valoare ?? "").replaceAll('"', '""')}"`;

// ==========================================
// BAZA DE DATE STOC MASTER
// Am lăsat 3 mașini demonstrative pentru a nu bloca codul.
// După ce pornești aplicația, intră din contul de admin la ACTUALIZARE CLOUD și dă paste la lista completă!
// ==========================================
const BAZA_DATE_STOC_MASTER = [
  {
    idIntern: "145678",
    sasiu: "ZFA25000002V02102",
    locatie: "Parc AI",
    marca: "FIAT",
    model: "E Ducato",
    culoare: "Bianco",
    documente: { carte: false, service: false, civ: false, itp: false },
  },
  {
    idIntern: "145020",
    sasiu: "ZACPJFDW5NPR88291",
    locatie: "Parc AI",
    marca: "JEEP",
    model: "Compass 4xe",
    culoare: "Blue Shade",
    documente: { carte: false, service: false, civ: false, itp: false },
  },
  {
    idIntern: "149964",
    sasiu: "ZARPATDW4N3029167",
    locatie: "AITSR SH Vest",
    marca: "ALFA ROMEO",
    model: "TONALE PHEV",
    culoare: "Nuovo Bianco",
    documente: { carte: false, service: false, civ: false, itp: false },
  },
];

// --- COMPONENTA LOC PARCARE ---
const LocDeParcare = React.memo(
  ({
    loc,
    onClick,
    isRearrangeMode,
    sourceLoc,
    isHighlighted,
    onClearHighlight,
    agingMode,
    logoSettings,
  }) => {
    if (!loc) {
      return (
        <div className="w-[120px] h-[120px] bg-slate-900 border border-dashed border-slate-700 opacity-40" />
      );
    }

    const hasTimestamp = loc.ocupat && loc.masina.timestamp;
    const zileParked = hasTimestamp
      ? Math.floor((Date.now() - loc.masina.timestamp) / (1000 * 3600 * 24))
      : 0;
    const isOld = hasTimestamp && zileParked >= 10;

    const stareOcupat =
      "bg-gradient-to-br from-red-800 via-red-950 to-red-950 shadow-inner border border-red-700/50";
    const stareLiber =
      "bg-gradient-to-br from-green-500 to-green-700 shadow-inner border border-green-400/50 animate-pulse-slow hover:animate-none";
    let stilBaza = loc.ocupat ? stareOcupat : stareLiber;

    const isSelectedForMove = sourceLoc && sourceLoc.id === loc.id;
    const wiggleClass =
      isRearrangeMode && loc.ocupat && !isSelectedForMove
        ? "animate-wiggle"
        : "";

    if (isHighlighted) {
      stilBaza =
        "bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-white shadow-[0_0_40px_15px_rgba(234,179,8,0.8)] scale-110 z-50 animate-pulse";
    } else if (isSelectedForMove) {
      stilBaza =
        "bg-blue-600 border-2 border-blue-300 shadow-[0_0_25px_5px_rgba(59,130,246,0.9)] scale-110 z-30 ring-4 ring-blue-500/50";
    } else if (isRearrangeMode && !loc.ocupat && sourceLoc) {
      stilBaza =
        "bg-gradient-to-br from-slate-800 to-slate-900 border-dashed border-2 border-yellow-400 hover:bg-yellow-900/50 hover:scale-105 z-20";
    } else if (agingMode && loc.ocupat && isOld) {
      stilBaza =
        "bg-gradient-to-br from-orange-500 to-red-600 border-2 border-yellow-400 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.8)]";
    }

    let styleExtra = "";
    if (loc.zona === "A") {
      if (loc.id.match(/^A(17|18|19|20)$/))
        styleExtra = "w-[84px] h-[72px] border-r";
      else if (parseInt(loc.id.slice(1)) >= 21)
        styleExtra = "w-[84px] h-[54px] border-r border-b";
      else styleExtra = "w-24 h-[54px] border-b";
    }
    if (loc.zona === "B") {
      if (loc.id === "B1") styleExtra = "w-[120px] h-[120px] border-2";
      if (parseInt(loc.id.slice(1)) >= 2 && parseInt(loc.id.slice(1)) <= 13)
        styleExtra = "w-[120px] h-[65px] -rotate-[15deg] origin-right border-b";
      if (parseInt(loc.id.slice(1)) >= 14 && parseInt(loc.id.slice(1)) <= 28)
        styleExtra = "w-[120px] h-[60px] rotate-[15deg] origin-left border-b";
      if (parseInt(loc.id.slice(1)) >= 29 && parseInt(loc.id.slice(1)) <= 44)
        styleExtra = "w-24 h-[56px] border-l border-b";
      if (parseInt(loc.id.slice(1)) >= 45)
        styleExtra = "flex-grow h-36 text-3xl border-r last:border-r-0";
    }

    const masinaMarca =
      loc.ocupat && loc.masina.marca
        ? String(loc.masina.marca).toUpperCase()
        : "";
    const customLogoData =
      logoSettings && masinaMarca ? logoSettings[masinaMarca] : null;
    const defaultLogoKey =
      loc.ocupat && loc.masina.marca
        ? Object.keys(logoMasiniDefault).find(
            (k) => k.toLowerCase() === String(loc.masina.marca).toLowerCase()
          )
        : null;
    const defaultUrl = defaultLogoKey
      ? logoMasiniDefault[defaultLogoKey]
      : null;

    const logoUrl = customLogoData?.url || defaultUrl;
    const customOpacity =
      customLogoData?.opacity !== undefined
        ? customLogoData.opacity / 100
        : 0.4;
    const finalOpacity = isSelectedForMove || isHighlighted ? 1 : customOpacity;

    return (
      <div
        onClick={() => {
          if (isHighlighted) onClearHighlight();
          onClick(loc);
        }}
        className={`relative overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:brightness-110 hover:z-20 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] ${stilBaza} ${styleExtra} ${wiggleClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

        {logoUrl && !agingMode && (
          <img
            src={logoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-contain p-[8px] pointer-events-none transition-opacity duration-300"
            style={{ opacity: finalOpacity }}
            onError={(e) => (e.target.style.display = "none")}
          />
        )}

        <span
          className={`relative z-10 text-xs font-black drop-shadow-[0_2px_3px_rgba(0,0,0,1)] uppercase tracking-wider ${
            isHighlighted || (agingMode && isOld)
              ? "text-black drop-shadow-none"
              : "text-white"
          }`}
        >
          {loc.ocupat && loc.masina.idMasina ? loc.masina.idMasina : loc.id}
        </span>

        {agingMode && loc.ocupat ? (
          <span
            className={`relative z-10 text-[10px] md:text-sm font-black px-2 w-full text-center mt-1 ${
              isOld
                ? "text-black drop-shadow-none"
                : "text-yellow-400 drop-shadow-[0_2px_3px_rgba(0,0,0,1)]"
            }`}
          >
            {hasTimestamp ? `${zileParked} ZILE` : "? ZILE"}
          </span>
        ) : (
          <span
            className={`relative z-10 text-[9px] md:text-sm font-bold truncate px-2 w-full text-center drop-shadow-[0_2px_3px_rgba(0,0,0,1)] ${
              isHighlighted ? "text-black drop-shadow-none" : "text-white/90"
            }`}
          >
            {loc.ocupat
              ? loc.masina.model
              : isRearrangeMode && sourceLoc
              ? "MUTĂ AICI"
              : "●"}
          </span>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.loc !== nextProps.loc) return false;
    if (prevProps.isRearrangeMode !== nextProps.isRearrangeMode) return false;
    if (prevProps.sourceLoc?.id !== nextProps.sourceLoc?.id) return false;
    if (prevProps.isHighlighted !== nextProps.isHighlighted) return false;
    if (prevProps.agingMode !== nextProps.agingMode) return false;
    if (prevProps.logoSettings !== nextProps.logoSettings) return false;
    return true;
  }
);

// --- APLICAȚIA PRINCIPALĂ ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [currentScreen, setCurrentScreen] = useState("home");

  const [locuri, setLocuri] = useState(LOCURI_INITIALE);
  const [stocMaster, setStocMaster] = useState(BAZA_DATE_STOC_MASTER);
  const [istoricLog, setIstoricLog] = useState([]);
  const [logoSettings, setLogoSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [locSelectat, setLocSelectat] = useState(null);
  const [tempModel, setTempModel] = useState("");
  const [tempCuloare, setTempCuloare] = useState("");
  const [tempDetalii, setTempDetalii] = useState("");
  const [tempIdMasina, setTempIdMasina] = useState("");
  const [tempSasiu, setTempSasiu] = useState("");
  const [tempMarca, setTempMarca] = useState("");

  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [sourceLoc, setSourceLoc] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchSasiu, setSearchSasiu] = useState("");
  const [filterMarca, setFilterMarca] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterLocatie, setFilterLocatie] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [highlightedLocId, setHighlightedLocId] = useState(null);

  const [showSfaturiModal, setShowSfaturiModal] = useState(false);
  const [agingMode, setAgingMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [importText, setImportText] = useState("");

  const [adminSelectedBrand, setAdminSelectedBrand] = useState("");
  const [adminUploadBase64, setAdminUploadBase64] = useState("");
  const [adminOpacity, setAdminOpacity] = useState(40);

  useEffect(() => {
    if (!isAuthenticated) return;
    const docParcare = doc(db, "parcari", "stare_curenta");
    const unsubParcare = onSnapshot(
      docParcare,
      async (docSnap) => {
        if (docSnap.exists()) {
          setLocuri(normalizeazaLocuri(docSnap.data().locuri));
        } else {
          setLocuri(LOCURI_INITIALE);
          try {
            await setDoc(
              docParcare,
              { locuri: LOCURI_INITIALE },
              { merge: true }
            );
          } catch (error) {
            console.warn("Nu am putut initializa parcarea in cloud.", error);
          }
        }
        setLoading(false);
      },
      () => {
        setLocuri(LOCURI_INITIALE);
        setLoading(false);
      }
    );

    const docStoc = doc(db, "parcari", "stoc_master");
    const unsubStoc = onSnapshot(docStoc, (docSnap) => {
      if (
        docSnap.exists() &&
        docSnap.data().masini &&
        docSnap.data().masini.length > 0
      ) {
        setStocMaster(docSnap.data().masini);
      }
    });

    const docIstoric = doc(db, "parcari", "istoric");
    const unsubIstoric = onSnapshot(docIstoric, (docSnap) => {
      if (docSnap.exists() && docSnap.data().loguri) {
        setIstoricLog(docSnap.data().loguri);
      }
    });

    const docSetari = doc(db, "parcari", "setari_ui");
    const unsubSetari = onSnapshot(docSetari, (docSnap) => {
      if (docSnap.exists() && docSnap.data().logos) {
        setLogoSettings(docSnap.data().logos);
      }
    });

    return () => {
      unsubParcare();
      unsubStoc();
      unsubIstoric();
      unsubSetari();
    };
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === PAROLA_USER) {
      setIsAuthenticated(true);
      setUserRole("user");
    } else if (passwordInput === PAROLA_ADMIN) {
      setIsAuthenticated(true);
      setUserRole("admin");
    } else {
      alert("Parolă incorectă!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole("");
    setPasswordInput("");
    setCurrentScreen("home");
  };

  const adaugaInIstoric = async (mesaj) => {
    const timestamp = Date.now();
    const dataFormatata = new Date().toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const logNou = { id: timestamp, mesaj, data: dataFormatata };
    let istoricActualizat = [logNou, ...istoricLog].slice(0, 50);
    setIstoricLog(istoricActualizat);
    await runTransaction(db, async (transaction) => {
      const docIstoric = doc(db, "parcari", "istoric");
      const snap = await transaction.get(docIstoric);
      const loguriCurente =
        snap.exists() && Array.isArray(snap.data().loguri)
          ? snap.data().loguri
          : istoricLog;
      istoricActualizat = [logNou, ...loguriCurente].slice(0, 50);
      transaction.set(docIstoric, { loguri: istoricActualizat }, { merge: true });
    });
    setIstoricLog(istoricActualizat);
  };

  const actualizeazaLocuri = async (mutator) => {
    const docParcare = doc(db, "parcari", "stare_curenta");
    let locuriActualizate = LOCURI_INITIALE;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docParcare);
      const locuriCurente = normalizeazaLocuri(
        snap.exists() ? snap.data().locuri : locuri
      );
      locuriActualizate = mutator(locuriCurente);
      transaction.set(
        docParcare,
        { locuri: locuriActualizate, updatedAt: Date.now() },
        { merge: true }
      );
    });

    setLocuri(locuriActualizate);
    return locuriActualizate;
  };

  const handleAutoFill = (idIntrodus) => {
    setTempIdMasina(idIntrodus);
    const cautare = String(idIntrodus || "").trim().toLowerCase();
    const gasit = stocMaster.find(
      (m) =>
        cautare &&
        (String(m.idIntern || "").toLowerCase() === cautare ||
        String(m.sasiu || "")
          .slice(-6)
          .toLowerCase() === cautare)
    );
    if (gasit) {
      setTempMarca(gasit.marca);
      setTempModel(`${gasit.marca} ${gasit.model}`);
      setTempCuloare(gasit.culoare);
      setTempSasiu(gasit.sasiu);
      setTempDetalii((prev) =>
        prev.trim() === "" ? `Sursa Excel: ${gasit.locatie}` : prev
      );
    } else {
      setTempMarca("");
      setTempModel("");
      setTempCuloare("");
      setTempSasiu("");
      setTempDetalii((prev) => (prev.startsWith("Sursa Excel") ? "" : prev));
    }
  };

  const handleLocClick = async (loc) => {
    if (!loc) return;

    if (!isRearrangeMode) {
      setLocSelectat(loc);
      setTempMarca(loc.masina.marca || "");
      setTempModel(loc.masina.model || "");
      setTempCuloare(loc.masina.culoare || "");
      setTempDetalii(loc.masina.detalii || "");
      setTempIdMasina(loc.masina.idMasina || "");
      setTempSasiu(loc.masina.sasiu || "");
    } else {
      if (!sourceLoc) {
        if (loc.ocupat) setSourceLoc(loc);
      } else {
        if (sourceLoc.id === loc.id) {
          setSourceLoc(null);
          return;
        }
        let masinaMutataId = sourceLoc.masina?.idMasina || "Necunoscută";
        let mutareReusita = false;
        const acum = Date.now();
        await actualizeazaLocuri((locuriCurente) => {
          const newLocuri = locuriCurente.map((l) => ({
            ...l,
            masina: { ...masinaGoala(), ...(l.masina || {}) },
          }));
          const indexSource = newLocuri.findIndex((l) => l.id === sourceLoc.id);
          const indexDest = newLocuri.findIndex((l) => l.id === loc.id);
          if (indexSource === -1 || indexDest === -1) return newLocuri;

          const tempOcupat = newLocuri[indexDest].ocupat;
          const tempMasina = { ...newLocuri[indexDest].masina };
          masinaMutataId =
            newLocuri[indexSource].masina.idMasina || "Necunoscută";

          newLocuri[indexDest].ocupat = newLocuri[indexSource].ocupat;
          newLocuri[indexDest].masina = {
            ...newLocuri[indexSource].masina,
            timestamp: acum,
          };
          newLocuri[indexSource].ocupat = tempOcupat;
          newLocuri[indexSource].masina = tempOcupat
            ? { ...tempMasina, timestamp: acum }
            : masinaGoala();

          mutareReusita = true;
          return newLocuri;
        });
        if (mutareReusita) {
          await adaugaInIstoric(
            `Mașina ${masinaMutataId} a fost mutată de pe locul ${sourceLoc.id} pe locul ${loc.id}`
          );
        }
        setSourceLoc(null);
      }
    }
  };

  const salveaza = async () => {
    if (!locSelectat) return;
    const timpOriginal = locSelectat.masina?.timestamp;
    const areMasina = tempModel.trim() !== "";

    if (!locSelectat.ocupat && tempModel.trim() !== "") {
      await adaugaInIstoric(
        `S-a parcat mașina ${tempIdMasina || tempModel} pe locul ${
          locSelectat.id
        }`
      );
    } else if (locSelectat.ocupat && tempModel.trim() !== "") {
      await adaugaInIstoric(
        `Locul ${locSelectat.id} a fost editat (Nou: ${
          tempIdMasina || tempModel
        })`
      );
    }
    await actualizeazaLocuri((locuriCurente) =>
      locuriCurente.map((l) =>
      l.id === locSelectat.id
        ? {
            ...l,
            ocupat: areMasina,
            masina: {
              marca: tempMarca,
              model: tempModel,
              culoare: tempCuloare,
              detalii: tempDetalii,
              idMasina: tempIdMasina,
              sasiu: tempSasiu,
              timestamp: areMasina ? timpOriginal || Date.now() : null,
            },
          }
        : l
      )
    );
    setLocSelectat(null);
  };

  const stergeLoc = async () => {
    if (!locSelectat) return;
    await adaugaInIstoric(
      `S-a șters/eliberat mașina de pe locul ${locSelectat.id}`
    );
    await actualizeazaLocuri((locuriCurente) =>
      locuriCurente.map((l) =>
        l.id === locSelectat.id
          ? {
              ...l,
              ocupat: false,
              masina: masinaGoala(),
            }
          : l
      )
    );
    setLocSelectat(null);
  };

  const toggleDocument = async (idIntern, docType) => {
    const updatedStoc = stocMaster.map((car) => {
      if (car.idIntern === idIntern) {
        const currentDocs = car.documente || {
          carte: false,
          service: false,
          civ: false,
          itp: false,
        };
        return {
          ...car,
          documente: { ...currentDocs, [docType]: !currentDocs[docType] },
        };
      }
      return car;
    });
    setStocMaster(updatedStoc);
    await setDoc(doc(db, "parcari", "stoc_master"), { masini: updatedStoc });
  };

  const exportRaport = () => {
    let csvContent =
      "\uFEFF--- SITUATIE MASINI PARCATE (TEREN) ---\nLoc Parcare,Zile Parcata,ID Intern,Marca,Model,Sasiu,Culoare\n";
    locuri
      .filter((l) => l.ocupat)
      .forEach((l) => {
        const zile = l.masina.timestamp
          ? Math.floor((Date.now() - l.masina.timestamp) / (1000 * 3600 * 24))
          : 0;
        csvContent += [
          l.id,
          zile,
          l.masina.idMasina,
          l.masina.marca,
          l.masina.model,
          l.masina.sasiu,
          l.masina.culoare,
        ]
          .map(csvCell)
          .join(",");
        csvContent += "\n";
      });
    csvContent +=
      "\n\n--- SITUATIE STOC TOTAL (CLOUD) ---\nID Intern,Marca,Model,Sasiu,Culoare,Locatie Sistem\n";
    stocMaster.forEach((m) => {
      csvContent += [
        m.idIntern,
        m.marca,
        m.model,
        m.sasiu,
        m.culoare,
        m.locatie,
      ]
        .map(csvCell)
        .join(",");
      csvContent += "\n";
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    );
    link.download = `Raport_Parcare_AIT_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // --- LOGICĂ ACTUALIZARE CLOUD (MERGE INTELIGENT - Fără Ștergere) ---
  const proceseazaImport = async () => {
    if (!importText.trim()) return;
    const linii = importText.trim().split("\n");
    if (linii.length < 2)
      return alert(
        "Date incomplete. Te rog copiază tabelul complet din Excel."
      );

    const header = linii[0].toLowerCase().split("\t");
    const idxSasiu = header.findIndex(
      (h) => h.includes("sasiu") || h.includes("vin")
    );
    const idxLocatie = header.findIndex((h) => h.includes("locatie"));
    const idxBrand = header.findIndex(
      (h) => h.includes("brand") || h.includes("marca")
    );
    const idxModel = header.findIndex((h) => h.includes("model"));
    const idxCuloare = header.findIndex((h) => h.includes("culoare"));
    const idxId = header.findIndex(
      (h) => h.includes("id") || h.includes("intern")
    );

    if (idxSasiu === -1 && idxBrand === -1)
      return alert(
        "Format nerecunoscut. Asigură-te că ai copiat și capul de tabel cu titlurile coloanelor."
      );

    const masiniNoiMap = new Map();

    // 1. Încărcăm MAȘINILE VECHI din Cloud în memorie ca să nu le pierdem
    stocMaster.forEach((car) => {
      masiniNoiMap.set(car.idIntern, car);
    });

    // 2. Trecem prin fișierul Excel NOU și actualizăm sau adăugăm
    for (let i = 1; i < linii.length; i++) {
      const coloane = linii[i].split("\t");
      if (coloane.length < 3) continue;

      let idSalvator = "";
      if (idxId !== -1 && coloane[idxId]) idSalvator = coloane[idxId].trim();
      else if (idxSasiu !== -1 && coloane[idxSasiu])
        idSalvator = coloane[idxSasiu].trim().slice(-6);

      if (!idSalvator) continue;

      // Verificam daca masina era deja in sistem ca sa ii pastram bifele (documentele)
      const masinaExistenta = masiniNoiMap.get(idSalvator);
      const docsImplicite = {
        carte: false,
        service: false,
        civ: false,
        itp: false,
      };

      masiniNoiMap.set(idSalvator, {
        idIntern: idSalvator,
        marca:
          idxBrand !== -1 && coloane[idxBrand]
            ? coloane[idxBrand].trim()
            : masinaExistenta?.marca || "Necunoscut",
        model:
          idxModel !== -1 && coloane[idxModel]
            ? coloane[idxModel].trim()
            : masinaExistenta?.model || "-",
        sasiu:
          idxSasiu !== -1 && coloane[idxSasiu]
            ? coloane[idxSasiu].trim()
            : masinaExistenta?.sasiu || "-",
        culoare:
          idxCuloare !== -1 && coloane[idxCuloare]
            ? coloane[idxCuloare].trim()
            : masinaExistenta?.culoare || "-",
        locatie:
          idxLocatie !== -1 && coloane[idxLocatie]
            ? coloane[idxLocatie].trim()
            : masinaExistenta?.locatie || "-",
        documente: masinaExistenta?.documente || docsImplicite,
      });
    }

    // Transformam inapoi in lista si salvam in Cloud
    const masiniFinale = Array.from(masiniNoiMap.values());
    await setDoc(doc(db, "parcari", "stoc_master"), { masini: masiniFinale });

    adaugaInIstoric(
      `Baza de date a fost sincronizată incremental. Total actualizat: ${masiniFinale.length} mașini.`
    );
    setImportText("");
    alert(
      `Sincronizare Reușită! Mașinile noi au fost adăugate, iar cele vechi au fost păstrate. Total sistem: ${masiniFinale.length} mașini.`
    );
    setCurrentScreen("admin_menu");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) {
        alert(
          "Imaginea e prea mare! Te rugăm să încarci poze sub 500KB (ideal format PNG fără fundal) pentru a nu îngreuna aplicația."
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminUploadBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectAdminBrand = (val) => {
    setAdminSelectedBrand(val);
    const setariExistente = logoSettings[val];
    if (setariExistente) {
      setAdminUploadBase64(setariExistente.url || "");
      setAdminOpacity(
        setariExistente.opacity !== undefined ? setariExistente.opacity : 40
      );
    } else {
      setAdminUploadBase64("");
      setAdminOpacity(40);
    }
  };

  const salveazaSetariLogo = async () => {
    if (!adminSelectedBrand) return;
    let finalUrl = adminUploadBase64;
    if (
      !finalUrl &&
      logoMasiniDefault[
        Object.keys(logoMasiniDefault).find(
          (k) => k.toLowerCase() === adminSelectedBrand.toLowerCase()
        )
      ]
    ) {
      finalUrl =
        logoMasiniDefault[
          Object.keys(logoMasiniDefault).find(
            (k) => k.toLowerCase() === adminSelectedBrand.toLowerCase()
          )
        ];
    }
    const noileSetari = {
      ...logoSettings,
      [adminSelectedBrand]: { url: finalUrl, opacity: adminOpacity },
    };
    setLogoSettings(noileSetari);
    await setDoc(
      doc(db, "parcari", "setari_ui"),
      { logos: noileSetari },
      { merge: true }
    );
    alert(
      `Setările pentru marca ${adminSelectedBrand} au fost salvate și aplicate pe hartă!`
    );
  };

  const stergeSetariLogo = async () => {
    if (!adminSelectedBrand) return;
    const noileSetari = { ...logoSettings };
    delete noileSetari[adminSelectedBrand];
    setLogoSettings(noileSetari);
    await setDoc(doc(db, "parcari", "setari_ui"), { logos: noileSetari });
    setAdminUploadBase64("");
    setAdminOpacity(40);
    alert(
      `Setările personalizate pentru ${adminSelectedBrand} au fost șterse (s-a revenit la default).`
    );
  };

  const uniceMarci = useMemo(
    () =>
      [
        ...new Set(
          stocMaster
            .filter((c) => c && c.marca)
            .map((c) => String(c.marca).toUpperCase())
        ),
      ].sort(),
    [stocMaster]
  );
  const uniceLocatii = useMemo(
    () =>
      [
        ...new Set(
          stocMaster
            .filter((c) => c && c.locatie)
            .map((c) => String(c.locatie).toUpperCase())
        ),
      ].sort(),
    [stocMaster]
  );
  const modeleDisponibile = useMemo(
    () =>
      [
        ...new Set(
          stocMaster
            .filter(
              (c) =>
                c &&
                c.model &&
                (!filterMarca ||
                  String(c.marca).toUpperCase() === filterMarca.toUpperCase())
            )
            .map((c) => String(c.model).toUpperCase())
        ),
      ].sort(),
    [stocMaster, filterMarca]
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSearchSasiu("");
    setFilterMarca("");
    setFilterModel("");
    setFilterLocatie("");
    setSortBy("default");
  };

  const searchResults = useMemo(() => {
    let filtered = stocMaster.filter((car) => {
      if (!car) return false;

      const termId = searchTerm.toLowerCase();
      const termSasiu = searchSasiu.toLowerCase();

      const sId = String(car.idIntern || "").toLowerCase();
      const sMarca = String(car.marca || "").toLowerCase();
      const sModel = String(car.model || "").toLowerCase();
      const sSasiu = String(car.sasiu || "").toLowerCase();
      const sLocatie = String(car.locatie || "").toUpperCase();

      const matchesSearch =
        !termId ||
        sId.includes(termId) ||
        sMarca.includes(termId) ||
        sModel.includes(termId);
      const matchesSasiu = !termSasiu || sSasiu.includes(termSasiu);

      const matchesMarca =
        !filterMarca || sMarca.toUpperCase() === filterMarca.toUpperCase();
      const matchesModel =
        !filterModel || sModel.toUpperCase() === filterModel.toUpperCase();
      const matchesLocatie =
        !filterLocatie || sLocatie === filterLocatie.toUpperCase();

      return (
        matchesSearch &&
        matchesSasiu &&
        matchesMarca &&
        matchesModel &&
        matchesLocatie
      );
    });

    filtered.sort((a, b) => {
      if (sortBy === "marca_az")
        return String(a.marca || "").localeCompare(String(b.marca || ""));
      if (sortBy === "marca_za")
        return String(b.marca || "").localeCompare(String(a.marca || ""));
      if (sortBy === "id_asc")
        return String(a.idIntern || "").localeCompare(
          String(b.idIntern || ""),
          undefined,
          { numeric: true }
        );
      if (sortBy === "id_desc")
        return String(b.idIntern || "").localeCompare(
          String(a.idIntern || ""),
          undefined,
          { numeric: true }
        );
      return 0;
    });

    return filtered;
  }, [
    stocMaster,
    searchTerm,
    searchSasiu,
    filterMarca,
    filterModel,
    filterLocatie,
    sortBy,
  ]);

  const getParkedLocation = (idIntern) => {
    const found = locuri.find(
      (l) =>
        l.ocupat && l.masina && String(l.masina.idMasina) === String(idIntern)
    );
    return found ? found.id : null;
  };

  const parcateGlobal = useMemo(() => locuri.filter((l) => l.ocupat), [locuri]);
  const locuriA = useMemo(() => locuri.filter((l) => l.zona === "A"), [locuri]);
  const locuriB = useMemo(() => locuri.filter((l) => l.zona === "B"), [locuri]);
  const brandData = useMemo(
    () =>
      parcateGlobal.reduce((acc, curr) => {
        const m = String(curr.masina.marca || "").toUpperCase();
        acc[m] = (acc[m] || 0) + 1;
        return acc;
      }, {}),
    [parcateGlobal]
  );
  const topBrands = useMemo(
    () =>
      Object.entries(brandData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [brandData]
  );
  const masiniAtentie = useMemo(
    () =>
      parcateGlobal
        .map((l) => ({
          ...l,
          zile: l.masina.timestamp
            ? Math.floor((Date.now() - l.masina.timestamp) / (1000 * 3600 * 24))
            : 0,
        }))
        .filter((l) => l.zile >= 10)
        .sort((a, b) => b.zile - a.zile),
    [parcateGlobal]
  );

  // --- ECRAN LOGIN ---
  if (!isAuthenticated)
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-700/50 shadow-[0_0_60px_-15px_rgba(37,99,235,0.3)] w-full max-w-sm text-center transform transition-all duration-500 hover:border-blue-500/50"
        >
          <div className="bg-gradient-to-b from-blue-600 to-blue-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg border-2 border-blue-400">
            <Lock className="text-white w-10 h-10 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            SYSTEM ACCESS
          </h1>
          <p className="text-slate-400 mb-8 text-sm">
            Autentificare Securizată Parcare AIT
          </p>
          <input
            type="password"
            className="w-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4 rounded-xl text-white mb-6 text-center tracking-[10px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-2xl font-bold placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm"
            placeholder="INTRODU PAROLA"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black p-4 rounded-xl transition-all active:scale-95 shadow-lg tracking-wider"
          >
            LOGARE SISTEM
          </button>
        </form>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white italic animate-pulse gap-4">
        <CarFront className="w-16 h-16 text-blue-500 animate-spin-slow" />
        <span className="text-2xl font-black tracking-widest">
          AIT SYSTEM STARTING...
        </span>
      </div>
    );

  // --- ECRAN HOME ---
  if (currentScreen === "home")
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 bg-slate-800/50 hover:bg-red-900/50 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all z-50 shadow-lg backdrop-blur-sm"
        >
          <LogOut className="w-4 h-4" />{" "}
          <span className="hidden md:inline">DECONECTARE</span>
        </button>

        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="relative group mb-12 p-2 rounded-3xl transform transition-transform duration-500 hover:scale-105 mt-8 md:mt-0">
          <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative w-56 h-56 md:w-64 md:h-64 bg-gradient-to-b from-[#002a54] to-[#001f3f] rounded-3xl flex flex-col items-center justify-center border-2 border-blue-900 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine pointer-events-none"></div>
            <CarFront
              className="w-24 h-24 text-gradient-to-br from-green-300 to-green-500 mb-2 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]"
              style={{ color: "#4ade80" }}
            />
            <span className="text-white font-black text-6xl md:text-7xl italic tracking-tighter drop-shadow-[0_3px_5px_rgba(0,0,0,1)]">
              AIT
            </span>
            <span className="text-white/80 font-bold text-xs md:text-sm tracking-[7px] md:tracking-[9px] mt-1 drop-shadow-md">
              PARCARE
            </span>
          </div>
        </div>

        <div className="w-full max-w-md flex flex-col gap-4 relative z-10">
          <button
            onClick={() => setCurrentScreen("parking")}
            className="group bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-blue-400/30 hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.6)]"
          >
            <MapIcon className="w-7 h-7 group-hover:rotate-12 transition-transform" />{" "}
            EDITARE PARCARE
          </button>
          <button
            onClick={() => setCurrentScreen("stock_check")}
            className="group bg-slate-900 hover:bg-slate-800 p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-700 relative hover:border-slate-600"
          >
            <ClipboardList className="w-7 h-7 text-green-400 group-hover:-translate-y-1 transition-transform" />{" "}
            VERIFICARE PARCARE
            {parcateGlobal.length > 0 && (
              <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse-slow border-2 border-slate-950">
                {parcateGlobal.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              resetFilters();
              setCurrentScreen("search");
            }}
            className="group bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-600"
          >
            <Database className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform" />{" "}
            STOC TOTAL
          </button>

          {userRole === "admin" && (
            <button
              onClick={() => {
                setCurrentScreen("admin_menu");
              }}
              className="group mt-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 p-5 rounded-2xl font-black text-white shadow-[0_10px_30px_rgba(239,68,68,0.4)] flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 border border-orange-400/50"
            >
              <ShieldAlert className="w-6 h-6" /> PANOU ADMINISTRATOR
            </button>
          )}
        </div>
      </div>
    );

  // --- ECRAN ADMIN MENU HUB ---
  if (currentScreen === "admin_menu" && userRole === "admin")
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setCurrentScreen("home")}
            className="mb-6 bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 font-bold text-white shadow-lg border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-orange-400" /> ÎNAPOI LA MENIUL
            PRINCIPAL
          </button>

          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-orange-900/50 shadow-[0_0_50px_rgba(249,115,22,0.15)]">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3 tracking-tight">
              <ShieldAlert className="w-8 h-8 text-orange-500" /> PANOU
              ADMINISTRATOR
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setCurrentScreen("import")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group"
              >
                <div className="bg-purple-900/30 p-4 rounded-full group-hover:bg-purple-600/30 transition-colors">
                  <UploadCloud className="w-10 h-10 text-purple-500" />
                </div>
                <span className="font-black text-lg text-slate-200 group-hover:text-white">
                  ACTUALIZARE CLOUD
                </span>
                <p className="text-xs text-slate-500 text-center">
                  Importă baza de date din Excel pentru a actualiza stocul
                  aplicației.
                </p>
              </button>

              <button
                onClick={() => setCurrentScreen("history")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500/50 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group"
              >
                <div className="bg-yellow-900/30 p-4 rounded-full group-hover:bg-yellow-600/30 transition-colors">
                  <History className="w-10 h-10 text-yellow-500" />
                </div>
                <span className="font-black text-lg text-slate-200 group-hover:text-white">
                  CUTIA NEAGRĂ
                </span>
                <p className="text-xs text-slate-500 text-center">
                  Verifică ultimele 50 de acțiuni făcute de utilizatori în
                  parcare.
                </p>
              </button>

              <button
                onClick={() => setCurrentScreen("settings_logos")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group"
              >
                <div className="bg-orange-900/30 p-4 rounded-full group-hover:bg-orange-600/30 transition-colors">
                  <ImageIcon className="w-10 h-10 text-orange-500" />
                </div>
                <span className="font-black text-lg text-slate-200 group-hover:text-white">
                  DESIGN LOGO-URI
                </span>
                <p className="text-xs text-slate-500 text-center">
                  Personalizează și schimbă siglele mărcilor afișate pe hartă.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // --- ECRAN SETARI LOGO (ADMIN ONLY) ---
  if (currentScreen === "settings_logos" && userRole === "admin") {
    const defaultLogoKeyPreview = Object.keys(logoMasiniDefault).find(
      (k) => k.toLowerCase() === String(adminSelectedBrand).toLowerCase()
    );
    const defaultUrlForPreview = defaultLogoKeyPreview
      ? logoMasiniDefault[defaultLogoKeyPreview]
      : null;
    const previewImgSrc = adminUploadBase64 || defaultUrlForPreview;

    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setCurrentScreen("admin_menu")}
            className="mb-6 bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 font-bold text-white shadow-lg border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-orange-400" /> ÎNAPOI LA PANOU
            ADMIN
          </button>

          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-orange-900/50 shadow-[0_0_50px_rgba(249,115,22,0.15)]">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 tracking-tight">
              <Settings className="w-8 h-8 text-orange-500" /> DESIGN LOGO-URI
            </h1>
            <p className="text-slate-400 mb-8 text-sm border-b border-slate-800 pb-4">
              Personalizează siglele mașinilor afișate pe harta principală.
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2 block">
                  1. Alege Marca Auto
                </label>
                <select
                  className="w-full appearance-none bg-slate-950 border border-slate-700 text-white text-lg font-bold py-4 px-4 rounded-xl outline-none focus:border-orange-500"
                  value={adminSelectedBrand}
                  onChange={(e) => handleSelectAdminBrand(e.target.value)}
                >
                  <option value="">-- Selectează o Marcă --</option>
                  {uniceMarci.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {adminSelectedBrand && (
                <div className="bg-black/20 p-6 rounded-2xl border border-slate-800 space-y-6 animate-fade-in-fast">
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> 2. Încarcă Logo Nou
                      (Opțional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-slate-800 file:text-orange-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      * Se recomandă imagini .PNG fără fundal (transparente),
                      dimensiune sub 500KB.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 block flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" /> 3. Opacitate
                        Fundal Hartă
                      </span>{" "}
                      <span className="text-orange-400 font-black">
                        {adminOpacity}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adminOpacity}
                      onChange={(e) =>
                        setAdminOpacity(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>

                  <div className="mt-8">
                    <label className="text-xs text-green-400 font-bold uppercase tracking-widest mb-3 block text-center">
                      PREVIEW LIVE: CUM VA ARĂTA PE HARTĂ
                    </label>
                    <div className="flex justify-center">
                      <div className="w-24 h-[54px] relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-red-800 via-red-950 to-red-950 shadow-inner border border-red-700/50 rounded-md">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
                        {previewImgSrc && (
                          <img
                            src={previewImgSrc}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-contain p-[8px] pointer-events-none"
                            style={{ opacity: adminOpacity / 100 }}
                          />
                        )}
                        <span className="relative z-10 text-xs font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,1)] uppercase tracking-wider">
                          PREVIEW
                        </span>
                        <span className="relative z-10 text-[9px] md:text-sm font-bold text-white/90 truncate px-2 w-full text-center drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
                          {adminSelectedBrand}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-slate-800">
                    <button
                      onClick={salveazaSetariLogo}
                      className="flex-grow bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 p-4 rounded-xl font-black text-white transition-all duration-300 hover:shadow-[0_5px_20px_rgba(249,115,22,0.4)] active:scale-95 tracking-wide flex justify-center items-center gap-2"
                    >
                      <Check className="w-5 h-5" /> SALVEAZĂ PENTRU TOȚI
                    </button>
                    <button
                      onClick={stergeSetariLogo}
                      className="bg-red-950/30 text-red-500 hover:bg-red-900/40 p-4 rounded-xl font-bold transition-all active:scale-95 px-5 border border-red-900/50 text-sm"
                    >
                      RESETARE (DEFAULT)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ECRAN CUTIA NEAGRA (ISTORIC) ---
  if (currentScreen === "history" && userRole === "admin")
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setCurrentScreen("admin_menu")}
            className="mb-6 bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 font-bold text-white shadow-lg border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-yellow-400" /> ÎNAPOI LA PANOU
            ADMIN
          </button>
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-yellow-900/50 shadow-[0_0_50px_rgba(234,179,8,0.15)]">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3 tracking-tight text-yellow-500">
              <History className="w-8 h-8" /> CUTIA NEAGRĂ (Ultimele 50 acțiuni)
            </h1>
            <div className="space-y-4">
              {istoricLog.length === 0 ? (
                <p className="text-slate-500 text-center italic p-10 bg-slate-950/50 rounded-2xl">
                  Nu există înregistrări recente.
                </p>
              ) : (
                istoricLog.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-yellow-900/50 transition-colors"
                  >
                    <p className="text-slate-200 font-bold text-sm md:text-base">
                      {log.mesaj}
                    </p>
                    <span className="text-slate-500 text-xs font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 shrink-0">
                      {log.data}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );

  // --- ECRAN IMPORT CLOUD ---
  if (currentScreen === "import" && userRole === "admin")
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setCurrentScreen("admin_menu")}
            className="mb-6 bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 font-bold text-white shadow-lg border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-purple-400" /> ÎNAPOI LA PANOU
            ADMIN
          </button>
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-purple-900/50 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <h1 className="text-3xl font-black mb-4 flex items-center gap-3 tracking-tight">
              <UploadCloud className="w-8 h-8 text-purple-500" /> SINCRONIZARE
              CLOUD STOC
            </h1>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Deschide fișierul tău Excel, selectează toate mașinile (inclusiv
              primul rând cu titlurile:{" "}
              <span className="text-purple-300 font-mono">
                Id masina, Serie Sasiu, etc.
              </span>
              ), dă <span className="font-bold text-white">Copy</span> și apoi
              dă <span className="font-bold text-white">Paste</span> în caseta
              de mai jos.
            </p>
            <textarea
              className="w-full h-64 bg-slate-950/50 border-2 border-slate-700 rounded-2xl p-5 text-sm text-slate-300 font-mono outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner resize-none whitespace-pre"
              placeholder="Lipește datele din Excel aici (Ctrl+V)..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              onClick={proceseazaImport}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 text-white shadow-xl transition-all duration-300 active:scale-95 border border-purple-400/30 disabled:opacity-50"
              disabled={!importText.trim()}
            >
              <UploadCloud className="w-7 h-7" /> ACTUALIZEAZĂ (FĂRĂ DUBLURI)
            </button>
          </div>
        </div>
      </div>
    );

  // --- ECRAN STOC TOTAL (SEARCH) ---
  if (currentScreen === "search") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setCurrentScreen("home")}
            className="mb-6 bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 font-bold text-white shadow-lg border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-blue-400" /> ÎNAPOI LA MENIU
          </button>

          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-4">
              <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 tracking-tight">
                <Database className="w-8 h-8 text-blue-500" /> STOC TOTAL AUTO
              </h1>
              <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-900/50">
                GĂSITE: {searchResults.length}
              </span>
            </div>

            {/* BARE DE CAUTARE DUBLE: ID/Marca si VIN (Sasiu) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600 rounded-2xl blur group-focus-within:opacity-20 opacity-0 transition-opacity pointer-events-none"></div>
                <input
                  autoFocus
                  className="relative w-full bg-slate-800 p-5 rounded-2xl border-2 border-slate-700 outline-none text-white font-bold text-xl placeholder:text-slate-500 focus:border-blue-500 transition-all shadow-inner"
                  placeholder="CAUTĂ (ID / MARCĂ / MODEL)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-5 top-5 w-7 h-7 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-purple-600 rounded-2xl blur group-focus-within:opacity-20 opacity-0 transition-opacity pointer-events-none"></div>
                <input
                  className="relative w-full bg-slate-800 p-5 rounded-2xl border-2 border-slate-700 outline-none text-white font-bold text-xl placeholder:text-slate-500 focus:border-purple-500 transition-all shadow-inner uppercase"
                  placeholder="CAUTĂ SERIE ȘASIU (VIN)..."
                  value={searchSasiu}
                  onChange={(e) => setSearchSasiu(e.target.value)}
                />
                <Search className="absolute right-5 top-5 w-7 h-7 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <select
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500"
                  value={filterMarca}
                  onChange={(e) => {
                    setFilterMarca(e.target.value);
                    setFilterModel("");
                  }}
                >
                  <option value="">Toate Mărcile</option>
                  {uniceMarci.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500 disabled:opacity-50"
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  disabled={!filterMarca && modeleDisponibile.length > 50}
                >
                  <option value="">
                    {filterMarca ? "Toate Modelele" : "Selectează Marca..."}
                  </option>
                  {modeleDisponibile.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500"
                  value={filterLocatie}
                  onChange={(e) => setFilterLocatie(e.target.value)}
                >
                  <option value="">Toate Locațiile</option>
                  {uniceLocatii.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-slate-900 border border-blue-900/50 text-blue-300 text-sm font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Sortare Implicită</option>
                  <option value="marca_az">Marcă (A - Z)</option>
                  <option value="id_asc">ID Crescător (1-9)</option>
                </select>
                <ArrowRightLeft className="absolute right-3 top-3 w-4 h-4 text-blue-500 pointer-events-none rotate-90" />
              </div>
              <button
                onClick={resetFilters}
                className="bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/40 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> RESETEAZĂ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {searchResults.length === 0 ? (
              <div className="col-span-full text-center text-slate-500 font-bold p-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                NU A FOST GĂSITĂ NICIO MAȘINĂ.
              </div>
            ) : (
              searchResults.map((car) => {
                const parcareLocId = getParkedLocation(car.idIntern);
                const docs = car.documente || {
                  carte: false,
                  service: false,
                  civ: false,
                  itp: false,
                };

                const masinaMarca = car.marca
                  ? String(car.marca).toUpperCase()
                  : "";
                const customLogoData =
                  logoSettings && masinaMarca
                    ? logoSettings[masinaMarca]
                    : null;
                const defaultLogoKey = Object.keys(logoMasiniDefault).find(
                  (k) =>
                    k.toLowerCase() === String(car.marca || "").toLowerCase()
                );
                const defaultUrl = defaultLogoKey
                  ? logoMasiniDefault[defaultLogoKey]
                  : null;
                const finalLogoUrl = customLogoData?.url || defaultUrl;

                return (
                  <div
                    key={car.idIntern}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col hover:border-slate-600 transition-all hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        {finalLogoUrl && (
                          <img
                            src={finalLogoUrl}
                            alt=""
                            className="w-8 h-8 object-contain"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        )}
                        <div>
                          <h3 className="font-black text-lg text-white leading-tight">
                            {car.marca}
                          </h3>
                          <p className="text-slate-300 font-bold text-sm">
                            {car.model}
                          </p>
                        </div>
                      </div>
                      <div className="bg-blue-900/40 border border-blue-800/50 px-2 py-1 rounded text-blue-400 font-black text-sm">
                        {car.idIntern}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block mb-1">
                          CULOARE
                        </span>
                        <span className="font-bold text-slate-300">
                          {car.culoare}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block mb-1">
                          SERIE ȘASIU
                        </span>
                        <span className="font-mono text-slate-300 truncate block">
                          {car.sasiu}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mb-3 border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                        <span className="text-xs font-bold text-slate-400 ml-1">
                          LOCAȚIE:
                        </span>
                        <span className="text-sm font-black text-white mr-1">
                          {car.locatie}
                        </span>
                      </div>
                      {car.detalii && car.detalii !== "-" && (
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs text-slate-400 italic">
                          Descriere: {car.detalii}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto mb-3">
                      <button
                        onClick={() => toggleDocument(car.idIntern, "carte")}
                        className={`flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold p-2 rounded-lg border transition-colors ${
                          docs.carte
                            ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <FileText
                          className={`w-3 h-3 ${
                            docs.carte ? "text-emerald-400" : "opacity-40"
                          }`}
                        />{" "}
                        C. Mașinii
                      </button>
                      <button
                        onClick={() => toggleDocument(car.idIntern, "service")}
                        className={`flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold p-2 rounded-lg border transition-colors ${
                          docs.service
                            ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <FileText
                          className={`w-3 h-3 ${
                            docs.service ? "text-emerald-400" : "opacity-40"
                          }`}
                        />{" "}
                        C. Service
                      </button>
                      <button
                        onClick={() => toggleDocument(car.idIntern, "civ")}
                        className={`flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold p-2 rounded-lg border transition-colors ${
                          docs.civ
                            ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <FileText
                          className={`w-3 h-3 ${
                            docs.civ ? "text-emerald-400" : "opacity-40"
                          }`}
                        />{" "}
                        CIV
                      </button>
                      <button
                        onClick={() => toggleDocument(car.idIntern, "itp")}
                        className={`flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold p-2 rounded-lg border transition-colors ${
                          docs.itp
                            ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3 h-3 ${
                            docs.itp ? "text-emerald-400" : "opacity-40"
                          }`}
                        />{" "}
                        ITP
                      </button>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                      {parcareLocId ? (
                        <div className="flex items-center justify-between bg-green-900/20 p-2.5 rounded-lg border border-green-800/50">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-black text-green-400 uppercase">
                              PARCATĂ: {parcareLocId}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setHighlightedLocId(parcareLocId);
                              setCurrentScreen("parking");
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider shadow-lg"
                          >
                            Vezi pe hartă
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <MapPin className="w-5 h-5 text-slate-600" />
                          <span className="text-sm font-bold text-slate-500 uppercase">
                            NEPARCATĂ (Pe hartă)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "stock_check") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentScreen("home")}
              className="bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 font-bold text-white shadow-lg border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" /> ÎNAPOI LA MENIU
            </button>
            <button
              onClick={exportRaport}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-6 py-3 rounded-xl flex items-center gap-3 font-black text-white shadow-[0_5px_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-5 h-5" /> DESCARCĂ RAPORT (CSV)
            </button>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3 tracking-tight">
              <ClipboardList className="w-9 h-9 text-blue-500" /> VERIFICARE
              PARCARE{" "}
              <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full text-xl font-bold ml-2">
                {parcateGlobal.length} UNITĂȚI
              </span>
            </h1>
            <div className="rounded-2xl overflow-x-auto border border-slate-800 shadow-inner bg-black/20">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-widest font-black">
                  <tr>
                    <th className="p-5 border-b border-slate-800">Loc</th>
                    <th className="p-5 border-b border-slate-800">Timp</th>
                    <th className="p-5 border-b border-slate-800">ID Intern</th>
                    <th className="p-5 border-b border-slate-800">
                      Marca & Model
                    </th>
                    <th className="p-5 border-b border-slate-800 font-mono">
                      Serie Șasiu (VIN)
                    </th>
                    <th className="p-5 border-b border-slate-800">Culoare</th>
                    <th className="p-5 border-b border-slate-800">Detalii</th>
                  </tr>
                </thead>
                <tbody>
                  {parcateGlobal.map((l, index) => {
                    const zile = l.masina.timestamp
                      ? Math.floor(
                          (Date.now() - l.masina.timestamp) / (1000 * 3600 * 24)
                        )
                      : 0;

                    const masinaMarca = l.masina.marca
                      ? String(l.masina.marca).toUpperCase()
                      : "";
                    const customLogoData =
                      logoSettings && masinaMarca
                        ? logoSettings[masinaMarca]
                        : null;
                    const defaultLogoKey = Object.keys(logoMasiniDefault).find(
                      (k) =>
                        k.toLowerCase() ===
                        String(l.masina.marca || "").toLowerCase()
                    );
                    const defaultUrl = defaultLogoKey
                      ? logoMasiniDefault[defaultLogoKey]
                      : null;
                    const finalLogoUrl = customLogoData?.url || defaultUrl;

                    return (
                      <tr
                        key={l.id}
                        className={`${
                          index % 2 === 0 ? "bg-transparent" : "bg-slate-900/40"
                        } border-b border-slate-800/50 hover:bg-blue-950/30 text-sm transition-colors duration-150`}
                      >
                        <td className="p-5">
                          <span
                            className={`px-3 py-1.5 rounded-lg font-black text-xs ${
                              l.zona === "A"
                                ? "bg-blue-900/60 text-blue-300 border border-blue-700"
                                : "bg-green-900/60 text-green-300 border border-green-700"
                            }`}
                          >
                            {l.id}
                          </span>
                        </td>
                        <td className="p-5">
                          <span
                            className={`font-black text-xs px-2 py-1 rounded ${
                              zile >= 10
                                ? "bg-red-900/50 text-red-400 border border-red-700"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {l.masina.timestamp ? `${zile} ZILE` : "N/A"}
                          </span>
                        </td>
                        <td className="p-5 font-extrabold text-white text-base tracking-tight">
                          {l.masina.idMasina}
                        </td>
                        <td className="p-5 flex items-center gap-3">
                          {finalLogoUrl && (
                            <img
                              src={finalLogoUrl}
                              alt=""
                              className="w-7 h-7 object-contain opacity-80"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          )}
                          <span className="font-semibold text-white/90 text-base">
                            {l.masina.model}
                          </span>
                        </td>
                        <td className="p-5 text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                          {l.masina.sasiu}
                        </td>
                        <td className="p-5 text-slate-200">
                          {l.masina.culoare}
                        </td>
                        <td className="p-5 text-slate-400 text-xs italic">
                          {l.masina.detalii}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ECRAN HARTA PRINCIPALA ---
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 md:p-6 text-white relative">
      <style>{`@keyframes wiggle { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(1.5deg); } } .animate-wiggle { animation: wiggle 0.25s ease-in-out infinite; }`}</style>

      {agingMode && (
        <div className="fixed top-0 left-0 w-full bg-yellow-500/95 backdrop-blur-md text-black py-3 px-4 z-50 animate-fade-in-fast border-b-4 border-yellow-600 shadow-[0_5px_30px_rgba(234,179,8,0.5)] flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-black text-center text-sm md:text-base">
            MOD AGING ACTIV: Mașinile roșii staționează de peste 10 zile!
          </span>
          <button
            onClick={() => setAgingMode(false)}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" /> IEȘIRE DIN MODUL TIMP
          </button>
        </div>
      )}

      {isRearrangeMode && !agingMode && (
        <div className="fixed top-0 left-0 w-full bg-blue-600/90 backdrop-blur-md text-white text-center py-3 font-bold z-50 animate-fade-in-fast border-b border-blue-400 shadow-[0_5px_30px_rgba(37,99,235,0.5)]">
          {!sourceLoc
            ? "MOD REARANJARE ACTIV - Atinge mașina pe care vrei să o muți!"
            : "SELECTEAZĂ LOCUL NOU PENTRU MAȘINA MĂRCAȚĂ"}
        </div>
      )}

      {highlightedLocId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-3 rounded-full font-black z-50 shadow-[0_10px_40px_rgba(234,179,8,0.5)] flex items-center gap-3 animate-popup-in border-4 border-yellow-300">
          MAȘINĂ GĂSITĂ PE LOCUL {highlightedLocId} !
          <button
            onClick={() => setHighlightedLocId(null)}
            className="ml-2 bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <button
        onClick={() => {
          setIsRearrangeMode(!isRearrangeMode);
          setSourceLoc(null);
          setHighlightedLocId(null);
          setAgingMode(false);
        }}
        className={`fixed bottom-6 right-6 md:right-auto md:left-6 z-40 p-4 rounded-full font-black flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 border-2 ${
          isRearrangeMode
            ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-300 w-auto px-6"
            : "bg-slate-800 text-blue-400 border-blue-500/50 w-16 md:w-auto px-4 md:px-6 overflow-hidden"
        }`}
      >
        {isRearrangeMode ? (
          <>
            <Check className="w-8 h-8" /> <span className="text-xl">GATA</span>
          </>
        ) : (
          <>
            <ArrowRightLeft className="w-7 h-7 flex-shrink-0" />{" "}
            <span className="hidden md:inline text-lg">REORGANIZEAZĂ</span>
          </>
        )}
      </button>

      <div
        className={`flex items-center justify-between mb-8 max-w-[1600px] mx-auto bg-slate-900/60 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 shadow-xl ${
          isRearrangeMode || agingMode ? "mt-12 md:mt-10" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentScreen("home");
              setHighlightedLocId(null);
              setAgingMode(false);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold flex items-center gap-2.5 transition-all active:scale-95 border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5 text-blue-400" />{" "}
            <span className="hidden md:inline">MENIU</span>
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 md:px-5 py-2.5 rounded-xl font-bold flex items-center gap-2.5 transition-all active:scale-95 border ${
              showStats
                ? "bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <PieChart
              className={`w-5 h-5 ${
                showStats ? "text-white" : "text-blue-400"
              }`}
            />{" "}
            <span className="hidden md:inline">STATISTICI</span>
          </button>
        </div>

        <h1 className="hidden md:flex text-2xl md:text-3xl font-black items-center gap-3 tracking-tighter">
          <MapIcon className="w-8 h-8 text-blue-500" /> DIGITAL TWIN PARCARE{" "}
          <span className="text-blue-500 italic">AIT</span>
        </h1>

        <button
          onClick={() => setShowSfaturiModal(true)}
          className="bg-yellow-900/40 hover:bg-yellow-600 text-yellow-400 hover:text-white px-4 md:px-5 py-2.5 rounded-xl font-bold flex items-center gap-2.5 transition-all active:scale-95 border border-yellow-700 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
        >
          <Lightbulb className="w-5 h-5" /> SFATURI
        </button>
      </div>

      <div className="flex flex-col-reverse xl:flex-row gap-8 justify-center items-start pb-32 max-w-[1600px] mx-auto transition-all duration-500">
        {showStats && (
          <div className="w-full xl:w-80 flex flex-col gap-6 sticky top-20 shrink-0 animate-fade-in-fast z-10">
            <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-2xl">
              <h3 className="font-black text-lg mb-6 flex items-center gap-3 text-slate-200 border-b border-slate-800 pb-3">
                <PieChart className="w-5 h-5 text-blue-500" /> CAPACITATE
                PARCARE
              </h3>
              <div className="space-y-5">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-blue-900/30 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                    Zona A
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">
                      {locuriA.filter((l) => !l.ocupat).length}
                    </span>
                    <span className="text-sm font-bold text-slate-500 mb-1">
                      / {locuriA.length} Libere
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-green-900/30 relative overflow-hidden group hover:border-green-500/50 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl"></div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                    Zona B
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">
                      {locuriB.filter((l) => !l.ocupat).length}
                    </span>
                    <span className="text-sm font-bold text-slate-500 mb-1">
                      / {locuriB.length} Libere
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {topBrands.length > 0 && (
              <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-2xl">
                <h3 className="font-black text-lg mb-5 flex items-center gap-3 text-slate-200 border-b border-slate-800 pb-3">
                  <CarFront className="w-5 h-5 text-purple-500" /> TOP MĂRCI
                  PARCATE
                </h3>
                <div className="space-y-4">
                  {topBrands.map(([marca, count], idx) => {
                    const customLogoDataStats =
                      logoSettings && marca
                        ? logoSettings[String(marca).toUpperCase()]
                        : null;
                    const defaultLogoKeyStats = Object.keys(
                      logoMasiniDefault
                    ).find(
                      (k) =>
                        k.toLowerCase() === String(marca || "").toLowerCase()
                    );
                    const defaultUrlStats = defaultLogoKeyStats
                      ? logoMasiniDefault[defaultLogoKeyStats]
                      : null;
                    const finalLogoUrlStats =
                      customLogoDataStats?.url || defaultUrlStats;

                    return (
                      <div
                        key={marca}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-black text-sm w-4">
                            {idx + 1}.
                          </span>
                          {finalLogoUrlStats ? (
                            <img
                              src={finalLogoUrlStats}
                              alt=""
                              className="w-5 h-5 object-contain"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <CarFront className="w-5 h-5 text-slate-500" />
                          )}
                          <span className="font-bold text-slate-200 text-sm truncate w-24">
                            {marca}
                          </span>
                        </div>
                        <span className="bg-slate-800 text-white text-xs font-black px-2 py-1 rounded border border-slate-700">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col xl:flex-row justify-center gap-12 overflow-x-auto w-full pb-10 custom-scrollbar">
          <div className="relative group p-1 rounded-2xl shrink-0 mx-auto">
            <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div
              className={`relative border-2 border-blue-900 p-6 bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-2xl transition-all ${
                isRearrangeMode
                  ? "border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                  : ""
              }`}
            >
              <span className="absolute -top-3.5 left-6 bg-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md border border-blue-400">
                Zona A
              </span>
              <div className="flex border-2 border-slate-700 bg-slate-950">
                <div className="flex flex-col">
                  {locuri
                    .filter(
                      (l) => l.zona === "A" && parseInt(l.id.slice(1)) <= 16
                    )
                    .map((l) => (
                      <LocDeParcare
                        key={l.id}
                        loc={l}
                        onClick={handleLocClick}
                        isRearrangeMode={isRearrangeMode}
                        sourceLoc={sourceLoc}
                        isHighlighted={highlightedLocId === l.id}
                        onClearHighlight={() => setHighlightedLocId(null)}
                        agingMode={agingMode}
                        logoSettings={logoSettings}
                      />
                    ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex border-b-2 border-slate-700">
                    <div className="w-[60px] h-24 border-b border-slate-700"></div>
                    {locuri
                      .filter(
                        (l) =>
                          l.zona === "A" &&
                          parseInt(l.id.slice(1)) >= 17 &&
                          parseInt(l.id.slice(1)) <= 20
                      )
                      .map((l) => (
                        <LocDeParcare
                          key={l.id}
                          loc={l}
                          onClick={handleLocClick}
                          isRearrangeMode={isRearrangeMode}
                          sourceLoc={sourceLoc}
                          isHighlighted={highlightedLocId === l.id}
                          onClearHighlight={() => setHighlightedLocId(null)}
                          agingMode={agingMode}
                          logoSettings={logoSettings}
                        />
                      ))}
                  </div>
                  <div className="flex justify-end bg-slate-950 border-l-2 border-slate-700">
                    <div className="grid grid-cols-2">
                      {locuri
                        .filter(
                          (l) => l.zona === "A" && parseInt(l.id.slice(1)) >= 21
                        )
                        .map((l) => (
                          <LocDeParcare
                            key={l.id}
                            loc={l}
                            onClick={handleLocClick}
                            isRearrangeMode={isRearrangeMode}
                            sourceLoc={sourceLoc}
                            isHighlighted={highlightedLocId === l.id}
                            onClearHighlight={() => setHighlightedLocId(null)}
                            agingMode={agingMode}
                            logoSettings={logoSettings}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group p-1 rounded-2xl shrink-0 mx-auto">
            <div className="absolute inset-0 bg-green-600 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div
              className={`relative border-2 border-green-900 p-6 bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-2xl transition-all ${
                isRearrangeMode
                  ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  : ""
              }`}
            >
              <span className="absolute -top-3.5 left-6 bg-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md border border-green-400">
                Zona B
              </span>
              <div className="flex flex-col border-2 border-slate-700 bg-slate-950">
                <div className="flex h-[825px]">
                  <div className="flex flex-col border-r border-slate-700">
                    <LocDeParcare
                      loc={locuri.find((l) => l.id === "B1")}
                      onClick={handleLocClick}
                      isRearrangeMode={isRearrangeMode}
                      sourceLoc={sourceLoc}
                      isHighlighted={highlightedLocId === "B1"}
                      onClearHighlight={() => setHighlightedLocId(null)}
                      agingMode={agingMode}
                      logoSettings={logoSettings}
                    />
                    {locuri
                      .filter(
                        (l) =>
                          l.zona === "B" &&
                          parseInt(l.id.slice(1)) >= 2 &&
                          parseInt(l.id.slice(1)) <= 13
                      )
                      .map((l) => (
                        <LocDeParcare
                          key={l.id}
                          loc={l}
                          onClick={handleLocClick}
                          isRearrangeMode={isRearrangeMode}
                          sourceLoc={sourceLoc}
                          isHighlighted={highlightedLocId === l.id}
                          onClearHighlight={() => setHighlightedLocId(null)}
                          agingMode={agingMode}
                          logoSettings={logoSettings}
                        />
                      ))}
                  </div>
                  <div className="w-36"></div>
                  <div className="flex border-l-2 border-slate-700 bg-slate-950">
                    <div className="flex flex-col">
                      {locuri
                        .filter(
                          (l) =>
                            l.zona === "B" &&
                            parseInt(l.id.slice(1)) >= 14 &&
                            parseInt(l.id.slice(1)) <= 28
                        )
                        .map((l) => (
                          <LocDeParcare
                            key={l.id}
                            loc={l}
                            onClick={handleLocClick}
                            isRearrangeMode={isRearrangeMode}
                            sourceLoc={sourceLoc}
                            isHighlighted={highlightedLocId === l.id}
                            onClearHighlight={() => setHighlightedLocId(null)}
                            agingMode={agingMode}
                            logoSettings={logoSettings}
                          />
                        ))}
                    </div>
                    <div className="flex flex-col border-l border-slate-800">
                      {locuri
                        .filter(
                          (l) =>
                            l.zona === "B" &&
                            parseInt(l.id.slice(1)) >= 29 &&
                            parseInt(l.id.slice(1)) <= 44
                        )
                        .map((l) => (
                          <LocDeParcare
                            key={l.id}
                            loc={l}
                            onClick={handleLocClick}
                            isRearrangeMode={isRearrangeMode}
                            sourceLoc={sourceLoc}
                            isHighlighted={highlightedLocId === l.id}
                            onClearHighlight={() => setHighlightedLocId(null)}
                            agingMode={agingMode}
                            logoSettings={logoSettings}
                          />
                        ))}
                    </div>
                  </div>
                </div>
                <div className="flex border-t-4 border-slate-700 bg-slate-900">
                  {locuri
                    .filter(
                      (l) => l.zona === "B" && parseInt(l.id.slice(1)) >= 45
                    )
                    .map((l) => (
                      <LocDeParcare
                        key={l.id}
                        loc={l}
                        onClick={handleLocClick}
                        isRearrangeMode={isRearrangeMode}
                        sourceLoc={sourceLoc}
                        isHighlighted={highlightedLocId === l.id}
                        onClearHighlight={() => setHighlightedLocId(null)}
                        agingMode={agingMode}
                        logoSettings={logoSettings}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP SFATURI AI */}
      {showSfaturiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in-fast">
          <div className="bg-slate-900 border-2 border-yellow-600/50 rounded-3xl w-full max-w-2xl shadow-[0_0_60px_-10px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-yellow-600/10 p-6 border-b border-yellow-600/20 flex justify-between items-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-3">
                <Lightbulb className="w-8 h-8" /> SFATURI & MANAGEMENT TIMP
              </h2>
              <button
                onClick={() => setShowSfaturiModal(false)}
                className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center hover:border-blue-500/50 transition-colors">
                <div>
                  <h3 className="font-black text-lg text-white mb-1 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-400" /> Vedere Zile
                    Staționare pe Hartă
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Transformă harta de parcare: afișează de câte zile stă
                    fiecare mașină nemișcată în loc de numele modelului.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAgingMode(true);
                    setShowSfaturiModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-black text-white whitespace-nowrap shadow-lg active:scale-95 transition-all"
                >
                  ACTIVEAZĂ MODUL
                </button>
              </div>

              <div>
                <h3 className="font-black text-lg text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Mașini ce necesită
                  atenție ( Peste 10 Zile )
                </h3>
                {masiniAtentie.length === 0 ? (
                  <div className="text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-800 text-green-400 font-bold flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10 mb-2" /> Felicitări!
                    Nicio mașină nu staționează de mai mult de 10 zile.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {masiniAtentie.map((masina) => (
                      <div
                        key={masina.id}
                        className="bg-slate-800/50 p-4 rounded-xl border border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                        <div className="pl-3">
                          <p className="font-black text-white text-lg leading-tight flex items-center gap-2">
                            {masina.masina.marca} {masina.masina.model}{" "}
                            <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                              Loc {masina.id}
                            </span>
                          </p>
                          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> ID:{" "}
                            <span className="text-blue-400 font-bold">
                              {masina.masina.idMasina}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pl-3 sm:pl-0">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              Timp de staționare
                            </p>
                            <p className="text-2xl font-black text-red-500">
                              {masina.zile}{" "}
                              <span className="text-sm">ZILE</span>
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setHighlightedLocId(masina.id);
                              setShowSfaturiModal(false);
                            }}
                            className="bg-slate-900 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-white transition-all"
                          >
                            <ArrowRightLeft className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP EDITARE CLASICĂ */}
      {locSelectat && !isRearrangeMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-fade-in-fast">
          <div className="bg-slate-900/90 backdrop-blur-2xl border-2 border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] transform animate-popup-in">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 relative">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                  <span
                    className={`w-3 h-8 rounded ${
                      locSelectat.zona === "A" ? "bg-blue-500" : "bg-green-500"
                    }`}
                  ></span>
                  LOC PARCARE{" "}
                  <span className="text-blue-400">{locSelectat.id}</span>
                </h2>
                {locSelectat.ocupat && (
                  <div className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-2 bg-slate-950 px-2 py-1 rounded w-fit">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {locSelectat.masina.timestamp
                      ? `Parcată: ${new Date(
                          locSelectat.masina.timestamp
                        ).toLocaleString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Parcată: Dată Necunoscută"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setLocSelectat(null)}
                className="text-slate-500 hover:text-white transition-colors p-2 bg-slate-800 rounded-full self-start"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="text-xs text-blue-300 font-black uppercase tracking-widest pl-1">
              Introdu ID Mașină / Șasiu
            </label>
            <div className="relative mb-5 mt-1.5 group">
              <div className="absolute inset-0 bg-blue-600 rounded-xl blur group-focus-within:opacity-30 opacity-0 transition-opacity pointer-events-none"></div>
              <input
                inputMode="numeric"
                type="text"
                className="relative w-full bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700 outline-none text-blue-400 font-black text-2xl uppercase tracking-wider focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-inner placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-600 placeholder:text-sm"
                placeholder="Ex: 145678..."
                value={tempIdMasina}
                onChange={(e) => handleAutoFill(e.target.value)}
              />
              {stocMaster.find(
                (m) =>
                  String(m.idIntern || "").toLowerCase() ===
                    tempIdMasina.toLowerCase() ||
                  String(m.sasiu || "")
                    .slice(-6)
                    .toLowerCase() === tempIdMasina.toLowerCase()
              ) && (
                <CheckCircle2 className="absolute right-4 top-4 w-7 h-7 text-green-500 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-popup-in" />
              )}
            </div>

            <div className="space-y-3.5 mb-6 bg-black/20 p-5 rounded-2xl border border-slate-800 shadow-inner">
              <div className="flex items-center gap-3">
                {(() => {
                  const tempMarcaUpper = tempMarca
                    ? String(tempMarca).toUpperCase()
                    : "";
                  const customLogoDataPopup =
                    logoSettings && tempMarcaUpper
                      ? logoSettings[tempMarcaUpper]
                      : null;
                  const defaultLogoKeyPopup = Object.keys(
                    logoMasiniDefault
                  ).find(
                    (k) =>
                      k.toLowerCase() === String(tempMarca || "").toLowerCase()
                  );
                  const defaultUrlPopup = defaultLogoKeyPopup
                    ? logoMasiniDefault[defaultLogoKeyPopup]
                    : null;
                  const finalLogoUrlPopup =
                    customLogoDataPopup?.url || defaultUrlPopup;

                  return finalLogoUrlPopup ? (
                    <img
                      src={finalLogoUrlPopup}
                      alt=""
                      className="w-8 h-8 object-contain drop-shadow-md"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : null;
                })()}
                <input
                  className="flex-grow bg-transparent p-1 text-slate-100 font-bold text-lg outline-none"
                  placeholder="Model (Auto-completat)"
                  value={tempModel}
                  readOnly
                />
              </div>
              <input
                className="w-full bg-transparent p-1 text-slate-400 font-mono text-xs uppercase tracking-wider outline-none border-t border-slate-800 pt-3"
                placeholder="Serie Șasiu (Auto-completat)"
                value={tempSasiu}
                readOnly
              />
              <input
                className="w-full bg-transparent p-1 text-slate-300 font-medium outline-none border-t border-slate-800 pt-3"
                placeholder="Culoare (Auto-completat)"
                value={tempCuloare}
                readOnly
              />
            </div>

            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">
              Detalii Adiționale / Note
            </label>
            <textarea
              className="w-full bg-slate-800/60 p-4 mt-1.5 mb-6 rounded-xl border border-slate-700 outline-none h-20 text-sm text-slate-200 focus:border-slate-500 transition-all shadow-inner resize-none"
              placeholder="Adaugă note despre starea mașinii..."
              value={tempDetalii}
              onChange={(e) => setTempDetalii(e.target.value)}
            />

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={salveaza}
                className="flex-grow bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-xl font-black text-white transition-all duration-300 hover:shadow-[0_5px_20px_rgba(37,99,235,0.4)] active:scale-95 tracking-wide"
              >
                SALVEAZĂ MODIFICĂRI
              </button>
              <button
                onClick={stergeLoc}
                className="bg-red-600/10 text-red-500 hover:bg-red-600/20 p-4 rounded-xl font-bold transition-all active:scale-95 px-5 border border-red-900/50"
              >
                ȘTERGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
