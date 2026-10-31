import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator, StyleSheet, Alert, SafeAreaView, StatusBar } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const APP_NAME = "SIGMA";
const THEMES = {
  futuriste: { name: "Futuriste violet", bg: "#080b16", pn: "#11172a", ln: "#252e49", tx: "#f1f4ff", mu: "#8c98b8", acc: "#8b5cf6", onAcc: "#ffffff", buy: "#27e6a3", sell: "#ff5577", fib: "#c4a5ff", warn: "#ffbd4a" },
  clair: { name: "Clair bleu", light: true, bg: "#f2f4f7", pn: "#ffffff", ln: "#dde2ea", tx: "#1c2330", mu: "#6b7688", acc: "#2563eb", onAcc: "#ffffff", buy: "#12a672", sell: "#e5484d", fib: "#7c5cff", warn: "#d98a00" },
  graphite: { name: "Graphite violet", bg: "#22252b", pn: "#2e323a", ln: "#41464f", tx: "#e9ecf2", mu: "#8a92a3", acc: "#7c5cff", onAcc: "#ffffff", buy: "#2ee6a6", sell: "#ff5d7a", fib: "#c4a8ff", warn: "#ffb020" },
  ocean: { name: "Océan cyan", bg: "#0e1a2e", pn: "#172a4a", ln: "#27406b", tx: "#e6f0ff", mu: "#7f93b5", acc: "#17d4ff", onAcc: "#04202b", buy: "#2ee6a6", sell: "#ff5d7a", fib: "#b8a4ff", warn: "#ffb020" },
  minuit: { name: "Minuit rose", bg: "#1d1a26", pn: "#2a2538", ln: "#3d3550", tx: "#f1ecfa", mu: "#9a90b3", acc: "#ff4fa3", onAcc: "#ffffff", buy: "#2ee6a6", sell: "#ff5d7a", fib: "#b8a4ff", warn: "#ffb020" },
  corail: { name: "Gris chaud corail", bg: "#26221f", pn: "#342e2a", ln: "#4a423c", tx: "#f4efea", mu: "#a39a91", acc: "#ff7a45", onAcc: "#ffffff", buy: "#2ee6a6", sell: "#ff5d7a", fib: "#b8a4ff", warn: "#ffb020" },
  sobre: { name: "Gris sobre", bg: "#202225", pn: "#2b2d31", ln: "#3c3f45", tx: "#f2f2f2", mu: "#8d9096", acc: "#f2f2f2", onAcc: "#202225", buy: "#2ee6a6", sell: "#ff5d7a", fib: "#c4a8ff", warn: "#ffb020" },
};
const C = { ...THEMES.futuriste };
let S;
const GC = { "Métaux": "#e0a100", Indices: "#2f7cf6", Forex: "#12b5a5", Crypto: "#f2803c" };
const ASSETS = [
  ["Métaux", [["XAUUSD", "Or / Dollar", "Au"], ["XAGUSD", "Argent / Dollar", "Ag"]]],
  ["Indices", [["NAS100", "Nasdaq 100", "N"], ["US30", "Dow Jones", "DJ"]]],
  ["Forex", [["USDJPY", "Dollar / Yen", "¥"], ["USDCAD", "Dollar / Dollar canadien", "C$"], ["GBPUSD", "Livre / Dollar", "£"], ["EURUSD", "Euro / Dollar", "€"]]],
  ["Crypto", [["BTCUSD", "Bitcoin", "₿"], ["ETHUSD", "Ethereum", "Ξ"]]],
];
const TFS = ["H4", "H1", "M15"];
const CTFS = { M15: ["15m", "15min"], H1: ["1h", "1h"], H4: ["4h", "4h"], D1: ["1d", "1day"] };
const BIN = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };
const TD = { XAUUSD: "XAU/USD", XAGUSD: "XAG/USD", USDJPY: "USD/JPY", USDCAD: "USD/CAD", GBPUSD: "GBP/USD", EURUSD: "EUR/USD", NAS100: "NDX", US30: "DJI" };
const TYPES = ["Buy", "Buy limit", "Buy stop", "Sell", "Sell limit", "Sell stop"];
const FIB = [0, 0.382, 0.5, 0.618, 0.705, 0.79, 1];
const ZC = { OB: "#2f7cf6", FVG: "#e0a100", LIQ: "#e5484d", SR: "#64748b", SUP: "#f2683c", DEM: "#12a672", PAT: "#8b5cf6", WYK: "#12b5a5" };
const LINES = ["LIQ", "SR"];
const MODEL = "claude-sonnet-5-5";

const STRATS = [
  { id: "smc", name: "SMC", icon: "layers-outline", color: "#e0a100", desc: "Structure, liquidité, order blocks, FVG, premium/discount.", legend: "Bleu = OB · jaune = FVG · rouge pointillé = liquidité · violet = Fibonacci",
    focus: "Analyse SMC : structure (BOS/CHoCH), liquidité (equal highs/lows, swings), order blocks, FVG, premium/discount, Fibonacci du dernier swing d'impulsion, confluences H4 puis H1 puis M15. Types de zones : OB, FVG, LIQ.",
    chk: [["a", "Biais H4 clair (structure respectée)"], ["b", "Liquidité balayée avant l'entrée"], ["c", "CHoCH ou BOS confirmé en M15"], ["d", "Retour dans un OB ou un FVG"], ["e", "Entrée en discount (achat) ou premium (vente)"], ["rr"], ["f", "Session active, pas d'annonce majeure"]] },
  { id: "ict", name: "ICT", icon: "time-outline", color: "#8b5cf6", desc: "Liquidité BSL/SSL, MSS, OTE, killzones, Silver Bullet.", legend: "Bleu = OB · jaune = FVG · rouge pointillé = liquidité · violet = OTE",
    focus: "Analyse ICT : biais journalier et H4, liquidité (BSL/SSL, plus hauts et bas de la veille), market structure shift, FVG, order blocks, breaker blocks, OTE (Fibonacci 0.62 à 0.79), killzones et modèles (Silver Bullet, Power of 3) si lisibles. Types de zones : OB, FVG, LIQ.",
    chk: [["a", "Biais H4 ou journalier clair"], ["b", "Liquidité BSL ou SSL prise"], ["c", "Market structure shift en M15"], ["d", "Entrée dans un FVG, un OB ou l'OTE (0.62-0.79)"], ["e", "Dans une killzone (Londres ou New York)"], ["rr"]] },
  { id: "pa", name: "Price action", icon: "pulse-outline", color: "#2f7cf6", desc: "Supports, résistances, figures de chandeliers, cassures.", legend: "Gris = support/résistance · violet = figure",
    focus: "Analyse price action pure, sans indicateur : tendance, supports et résistances (plusieurs touches), figures de chandeliers (pin bar, englobante), cassures et retests, figures chartistes. Types de zones : SR (ligne, y1 = y2), PAT (boîte autour de la figure).",
    chk: [["a", "Tendance claire sur H4"], ["b", "Niveau S/R respecté plusieurs fois"], ["c", "Bougie ou figure de confirmation"], ["d", "Cassure et retest validés"], ["rr"], ["e", "Pas d'annonce majeure"]] },
  { id: "sd", name: "Supply and demand", icon: "swap-vertical-outline", color: "#f2683c", desc: "Zones d'offre et de demande fraîches, départ impulsif.", legend: "Orange = offre · vert = demande",
    focus: "Analyse supply and demand : zones d'offre et de demande fraîches (base puis impulsion), force du départ, nombre de retests, zones opposées proches. Types de zones : SUP (offre), DEM (demande).",
    chk: [["a", "Zone fraîche (jamais retestée)"], ["b", "Départ fort et impulsif"], ["c", "Zone alignée avec la tendance H4"], ["d", "Pas de zone opposée proche"], ["rr"]] },
  { id: "wy", name: "Wyckoff", icon: "stats-chart-outline", color: "#12b5a5", desc: "Phases, accumulation, distribution, Spring et UTAD.", legend: "Turquoise = range ou événement Wyckoff",
    focus: "Analyse Wyckoff : phase (accumulation, distribution, markup, markdown), événements (PS, SC, AR, ST, Spring, UTAD, SOS, SOW, LPS), range. Types de zones : WYK (boîte autour du range ou de l'événement, label = événement).",
    chk: [["a", "Phase identifiée (accumulation ou distribution)"], ["b", "Événement clé repéré (Spring, UTAD…)"], ["c", "Effort et résultat cohérents"], ["d", "Confirmation (SOS, SOW ou LPS)"], ["rr"]] },
  { id: "free", name: "Libre", icon: "sparkles-outline", color: "#64748b", desc: "Claude choisit la lecture la plus adaptée.", legend: "Couleurs selon le type de zone",
    focus: "Mode libre : choisis toi-même la lecture la plus pertinente (SMC, ICT, price action, supply and demand, Wyckoff) et dis laquelle tu utilises au début de « structure ». Types de zones : OB, FVG, LIQ, SR, SUP, DEM, PAT, WYK.",
    chk: [["a", "Biais cohérent sur H4 et H1"], ["b", "Niveau clé identifié"], ["c", "Confirmation en M15"], ["rr"], ["d", "Pas d'annonce majeure"]] },
];

async function getCandles(sym, tf, tdkey) {
  if (BIN[sym]) {
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${BIN[sym]}&interval=${CTFS[tf][0]}&limit=80`);
    const d = await r.json();
    if (!Array.isArray(d)) throw new Error("Données indisponibles");
    return d.map((k) => ({ o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
  }
  if (!tdkey) throw new Error("Ajoute ta clé Twelve Data dans Réglages pour voir ce graphique.");
  const r = await fetch(`https://api.twelvedata.com/time_series?symbol=${TD[sym]}&interval=${CTFS[tf][1]}&outputsize=80&apikey=${tdkey}`);
  const d = await r.json();
  if (d.status === "error" || !d.values) throw new Error(d.message || "Données indisponibles");
  return d.values.reverse().map((k) => ({ o: +k.open, h: +k.high, l: +k.low, c: +k.close }));
}

const PROMPT = (asset, mine, st) => `Tu es un analyste de trading rigoureux. Les 3 captures ci-dessus sont H4, H1, M15 de ${asset}. Lis les prix sur l'axe visible, n'invente aucun niveau illisible.
Stratégie imposée : ${st.name}. ${st.focus}
Règles : signal seulement si confluence claire. Stop loss serré derrière l'invalidation, jamais large par défaut. Vise un R:R d'au moins 4 (idéal 5) vers un vrai objectif ; sinon verdict "Attendre" et explique. Captures illisibles = "Attendre".${mine ? `\nScénario du trader : « ${mine} ». Compare-le honnêtement à ce que tu vois.` : ""}
Pour chaque capture, donne les zones à dessiner en coordonnées FRACTIONNAIRES de l'image (0 à 1, origine en haut à gauche, x vers la droite, y vers le bas). Sois le plus précis possible.
Réponds UNIQUEMENT par un objet JSON en français, sans markdown :
{"biais":"Haussier|Baissier|Neutre","structure":"…","verdict":"Achat|Vente|Attendre","type_ordre":"Buy limit|Buy stop|Buy|Sell limit|Sell stop|Sell","entree":nombre|null,"sl":nombre|null,"tp":nombre|null,"rr":nombre|null,"confiance":0-100,"invalidation":"…","comparaison":"…","risques":["…"],
"resume":{"H4":"…","H1":"…","M15":"…"},
"zones":{"H4":[{"t":"OB|FVG|LIQ|SR|SUP|DEM|PAT|WYK","label":"…","why":"…","x1":0,"y1":0,"x2":1,"y2":1}],"H1":[…],"M15":[…]},
"fib":{"H4":{"a":{"x":0,"y":0},"b":{"x":0,"y":0}},"H1":null,"M15":null}}
Pour chaque zone, "why" explique en une ou deux phrases ce que tu vois sur CETTE capture (bougies, niveaux, cassure) qui justifie la zone ; pas de généralités, et dis-le si un élément n'est pas clairement lisible. "resume" donne la lecture de chaque timeframe en deux phrases. Pour LIQ et SR, y1 = y2 (ligne). Pour fib, a = début du swing, b = fin du swing ; mets null si la stratégie n'en a pas besoin.`;

const Logo = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <Path d="M36 6l26 15v30L36 66 10 51V21z" stroke={C.tx} strokeWidth={3} strokeLinejoin="round" />
    <Path d="M26 44c4 5 20 5 20-4 0-9-20-4-20-13 0-8 13-8 19-4" stroke={C.acc} strokeWidth={4} strokeLinecap="round" />
  </Svg>
);

function PriceChart({ data }) {
  const [w, setW] = useState(0);
  const H = 220;
  const hi = Math.max(...data.map((k) => k.h)), lo = Math.min(...data.map((k) => k.l));
  const y = (v) => ((hi - v) / (hi - lo || 1)) * (H - 16) + 8, cw = w / data.length;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H, backgroundColor: C.bg, borderRadius: 8, overflow: "hidden" }}>
      {w > 0 && data.map((k, i) => {
        const col = k.c >= k.o ? C.buy : C.sell, x = i * cw + cw / 2;
        return (
          <React.Fragment key={i}>
            <View style={{ position: "absolute", left: x - 0.5, top: y(k.h), width: 1, height: Math.max(1, y(k.l) - y(k.h)), backgroundColor: col }} />
            <View style={{ position: "absolute", left: x - cw * 0.35, top: y(Math.max(k.o, k.c)), width: Math.max(1, cw * 0.7), height: Math.max(1, Math.abs(y(k.o) - y(k.c))), backgroundColor: col }} />
          </React.Fragment>
        );
      })}
      <Text style={S.axT}>{hi}</Text>
      <Text style={S.axB}>{lo}</Text>
    </View>
  );
}

function Shot({ img, zones, fib, off, toggle, tf }) {
  const [w, setW] = useState(0);
  const h = (w * img.h) / img.w;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Image source={{ uri: img.uri }} style={{ width: "100%", aspectRatio: img.w / img.h }} />
      {w > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {fib && FIB.map((l) => {
            const yy = (fib.a.y + (fib.b.y - fib.a.y) * l) * h, x0 = Math.min(fib.a.x, fib.b.x) * w;
            return (
              <View key={l} pointerEvents="none" style={{ position: "absolute", left: x0, right: 0, top: yy, borderTopWidth: 1, borderColor: C.fib }}>
                <Text style={{ color: C.fib, fontSize: 9, fontWeight: "700", position: "absolute", right: 2, top: -11 }}>{l}</Text>
              </View>
            );
          })}
          {(zones || []).map((z, i) => {
            if (off[tf + i]) return null;
            const col = ZC[z.t] || C.mu, line = LINES.includes(z.t);
            const x = Math.min(z.x1, z.x2) * w, yy = Math.min(z.y1, z.y2) * h;
            return (
              <TouchableOpacity key={i} onPress={() => toggle(tf + i)} style={{ position: "absolute", left: x, top: yy, width: line ? w - x : Math.max(Math.abs(z.x2 - z.x1) * w, 6), height: line ? 14 : Math.max(Math.abs(z.y2 - z.y1) * h, 4), backgroundColor: line ? "transparent" : col + "40", borderTopWidth: line ? 1.5 : 1, borderWidth: line ? 0 : 1, borderColor: col, borderStyle: line ? "dashed" : "solid" }}>
                <Text style={{ color: col, fontSize: 9, fontWeight: "700" }}>{z.t} {z.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [page, setPage] = useState("accueil");
  const [asset, setAsset] = useState("XAUUSD");
  const [strat, setStrat] = useState("free");
  const [imgs, setImgs] = useState({});
  const [mine, setMine] = useState("");
  const [res, setRes] = useState(null);
  const [tf, setTf] = useState("H4");
  const [off, setOff] = useState({});
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [tdkey, setTdkey] = useState("");
  const [sim, setSim] = useState({ t: "Buy limit", e: "", s: "", p: "", r: "100" });
  const [jr, setJr] = useState([]);
  const [last, setLast] = useState({});
  const [chk, setChk] = useState({});
  const [ctf, setCtf] = useState("H1");
  const [cd, setCd] = useState({ data: null, err: "", load: false });
  const [theme, setTheme] = useState("futuriste");
  Object.assign(C, THEMES[theme] || THEMES.futuriste);
  S = mk(C);

  useEffect(() => {
    SecureStore.getItemAsync("apikey").then((k) => k && setKey(k));
    SecureStore.getItemAsync("tdkey").then((k) => k && setTdkey(k));
    AsyncStorage.getItem("jr").then((j) => j && setJr(JSON.parse(j)));
    AsyncStorage.getItem("last").then((j) => j && setLast(JSON.parse(j)));
    AsyncStorage.getItem("strat").then((j) => j && setStrat(j));
    AsyncStorage.getItem("theme").then((j) => j && THEMES[j] && setTheme(j));
  }, []);
  useEffect(() => {
    let live = true;
    setCd({ data: null, err: "", load: true });
    getCandles(asset, ctf, tdkey)
      .then((data) => live && setCd({ data, err: "", load: false }))
      .catch((e) => live && setCd({ data: null, err: String(e.message || e), load: false }));
    return () => { live = false; };
  }, [asset, ctf, tdkey]);

  const st = STRATS.find((s) => s.id === strat) || STRATS[5];
  const rs = res ? STRATS.find((s) => s.id === res._s) || st : st;
  const ac = C.acc;
  const saveJr = (n) => { setJr(n); AsyncStorage.setItem("jr", JSON.stringify(n)); };
  const pickStrat = (id) => { setStrat(id); AsyncStorage.setItem("strat", id); };

  const pick = async (t) => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.85 });
    if (r.canceled) return;
    const a = r.assets[0];
    setImgs((p) => ({ ...p, [t]: { uri: a.uri, b64: a.base64, w: a.width, h: a.height, type: a.mimeType || "image/jpeg" } }));
  };

  const run = async () => {
    if (!key) return Alert.alert("Clé API manquante", "Ajoutez-la dans Réglages.");
    const miss = TFS.filter((t) => !imgs[t]);
    if (miss.length) return Alert.alert("Captures manquantes", miss.join(", "));
    setBusy(true);
    try {
      const content = [];
      TFS.forEach((t) => {
        content.push({ type: "text", text: "Capture " + t + " :" });
        content.push({ type: "image", source: { type: "base64", media_type: imgs[t].type, data: imgs[t].b64 } });
      });
      content.push({ type: "text", text: PROMPT(asset, mine.trim(), st) });
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 6000, messages: [{ role: "user", content }] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Erreur " + r.status);
      const t = d.content.map((c) => c.text || "").join("");
      const out = { ...JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)), _s: st.id };
      setRes(out);
      const nl = { ...last, [asset]: { v: out.verdict, rr: out.rr } };
      setLast(nl); AsyncStorage.setItem("last", JSON.stringify(nl));
      setOff({}); setTf("H4"); setChk({});
    } catch (e) { Alert.alert("Analyse impossible", String(e.message || e)); }
    setBusy(false);
  };

  const toSim = () => {
    setSim({ t: TYPES.includes(res.type_ordre) ? res.type_ordre : "Buy limit", e: String(res.entree), s: String(res.sl), p: String(res.tp), r: sim.r });
    setPage("sim");
  };

  const buy = sim.t.startsWith("Buy"), e = +sim.e, s = +sim.s, p = +sim.p, r = +sim.r || 0;
  const ok = e && s && p && (buy ? s < e && e < p : p < e && e < s);
  const rr = ok ? Math.abs(p - e) / Math.abs(e - s) : 0;
  const done = jr.filter((x) => x.res), net = done.reduce((a, x) => a + (x.res === "TP" ? x.rr : x.res === "SL" ? -1 : 0), 0);
  const win = done.filter((x) => x.res === "TP").length;
  const rrOk = !!res && res.rr >= 4;
  const score = rs.chk.filter(([k]) => (k === "rr" ? rrOk : chk[k])).length;
  const full = score === rs.chk.length;
  const gcol = (ASSETS.find(([, l]) => l.some((a) => a[0] === asset)) || ["Métaux"])[0];

  const Btn = ({ on, children, ...p }) => (
    <TouchableOpacity {...p} style={[S.chip, on && { backgroundColor: ac, borderColor: ac }, p.style]}><Text style={{ color: on ? C.onAcc : C.tx, fontWeight: "600" }}>{children}</Text></TouchableOpacity>
  );
  const TABS = [["accueil", "Accueil", "home-outline"], ["assets", "Actifs", "stats-chart-outline"], ["strat", "Stratégie", "layers-outline"], ["analyse", "Analyse", "analytics"], ["sim", "Simu", "calculator-outline"]];

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle={C.light ? "dark-content" : "light-content"} />
      <View style={S.top}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Logo />
          <Text style={S.logo}>{APP_NAME}</Text>
        </View>
        <TouchableOpacity onPress={() => setPage("set")} hitSlop={12} accessibilityLabel="Réglages">
          <Ionicons name="menu" size={28} color={page === "set" ? ac : C.tx} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        {page === "accueil" && (<>
          <View style={S.hero}>
            <View style={S.heroGlow} />
            <Text style={S.heroEyebrow}>TON ESPACE DE TRADING</Text>
            <Text style={S.heroTitle}>Analyse. Trade.
Progresse.</Text>
            <Text style={S.heroText}>Une lecture structurée des marchés, de tes stratégies et de tes performances.</Text>
            <TouchableOpacity style={S.heroButton} onPress={() => setPage("analyse")}>
              <Text style={S.heroButtonText}>LANCER UNE ANALYSE</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </TouchableOpacity>
            <View style={S.heroOrb} />
          </View>

          <View style={S.sectionHead}>
            <Text style={S.sectionTitle}>Marchés suivis</Text>
            <TouchableOpacity onPress={() => setPage("assets")}><Text style={S.linkText}>Voir les actifs  ›</Text></TouchableOpacity>
          </View>
          <View style={S.marketGrid}>
            {[
              ["XAUUSD", "Or / Dollar", "Au", "#e5ad36"],
              ["NAS100", "Nasdaq 100", "N", "#4295ff"],
              ["EURUSD", "Euro / Dollar", "€", "#24c9b8"],
              ["BTCUSD", "Bitcoin", "₿", "#f59b3d"],
            ].map(([sym, label, icon, color]) => (
              <TouchableOpacity key={sym} style={S.marketCard} onPress={() => { setAsset(sym); setPage("analyse"); }}>
                <View style={[S.marketIcon, { borderColor: color + "88", backgroundColor: color + "20" }]}><Text style={{ color, fontWeight: "900", fontSize: 17 }}>{icon}</Text></View>
                <Text style={S.marketSymbol}>{sym}</Text>
                <Text style={S.mu}>{label}</Text>
                <Text style={S.marketHint}>{last[sym] ? last[sym].v.toUpperCase() + (last[sym].rr ? " · 1:" + last[sym].rr : "") : "Prêt à analyser"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={S.sectionHead}>
            <Text style={S.sectionTitle}>Tes stratégies</Text>
            <TouchableOpacity onPress={() => setPage("strat")}><Text style={S.linkText}>Explorer  ›</Text></TouchableOpacity>
          </View>
          <View style={S.strategyGrid}>
            {STRATS.slice(0, 4).map((item) => (
              <TouchableOpacity key={item.id} style={S.strategyTile} onPress={() => { pickStrat(item.id); setPage("analyse"); }}>
                <View style={[S.strategyIcon, { backgroundColor: item.color + "20" }]}><Ionicons name={item.icon} size={22} color={item.color} /></View>
                <Text style={S.strategyName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={S.card}>
            <View style={S.sectionHead}>
              <Text style={S.sectionTitle}>Espace de progression</Text>
              <Ionicons name="stats-chart" size={20} color={C.acc} />
            </View>
            <Text style={S.tx}>Enregistre tes trades dans le simulateur pour suivre tes résultats en R et ton taux de réussite.</Text>
            <TouchableOpacity style={S.secondaryButton} onPress={() => setPage("sim")}>
              <Ionicons name="calculator-outline" size={18} color={C.acc} />
              <Text style={S.secondaryButtonText}>Ouvrir le simulateur</Text>
            </TouchableOpacity>
          </View>
        </>)}

        {page === "assets" && (<>
          <Text style={S.step}>TES ACTIFS</Text>
          <View style={[S.card, { padding: 0, overflow: "hidden" }]}>
            {ASSETS.map(([g, list]) => (
              <View key={g}>
                <Text style={[S.grp, { color: GC[g] }]}>{g.toUpperCase()}</Text>
                {list.map(([sym, name, ic]) => {
                  const on = asset === sym, l = last[sym];
                  return (
                    <TouchableOpacity key={sym} onPress={() => setAsset(sym)} style={[S.rowA, on && { backgroundColor: GC[g] + "26", borderLeftColor: GC[g] }]}>
                      <View style={[S.badge, { backgroundColor: GC[g] + "30", borderColor: GC[g] }]}><Text style={{ color: GC[g], fontWeight: "800" }}>{ic}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.sym}>{sym}</Text>
                        <Text style={S.mu}>{name}</Text>
                      </View>
                      {l ? <Text style={{ color: l.v === "Achat" ? C.buy : l.v === "Vente" ? C.sell : C.warn, fontWeight: "800" }}>{l.v.toUpperCase()}{l.rr ? "  1:" + l.rr : ""}</Text> : <Text style={S.mu}>Aucune analyse</Text>}
                      <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} color={on ? GC[g] : C.ln} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={S.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={S.big}>{asset}</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>{Object.keys(CTFS).map((t) => <Btn key={t} on={ctf === t} onPress={() => setCtf(t)}>{t}</Btn>)}</View>
            </View>
            {cd.load && <ActivityIndicator color={ac} style={{ height: 220 }} />}
            {!!cd.err && <Text style={[S.mu, { height: 60 }]}>{cd.err}</Text>}
            {cd.data && <PriceChart data={cd.data} />}
            {cd.data && <Text style={S.mu}>Dernier cours {cd.data[cd.data.length - 1].c} · estimation, pas du temps réel</Text>}
          </View>
        </>)}

        {page === "strat" && (<>
          <Text style={S.step}>CHOISIS UNE STRATÉGIE · FACULTATIF</Text>
          {STRATS.map((x) => {
            const on = strat === x.id;
            return (
              <TouchableOpacity key={x.id} onPress={() => pickStrat(x.id)} style={[S.sc, { borderColor: on ? x.color : C.ln, backgroundColor: on ? x.color + "22" : C.pn }]}>
                <View style={[S.badge, { borderColor: x.color, backgroundColor: x.color + "30" }]}><Ionicons name={x.icon} size={20} color={x.color} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={S.sym}>{x.name}</Text>
                  <Text style={S.mu}>{x.desc}</Text>
                </View>
                {on && <Ionicons name="checkmark-circle" size={26} color={x.color} />}
              </TouchableOpacity>
            );
          })}
          <Text style={S.mu}>Une seule stratégie à la fois. Elle reste active jusqu'à ce que tu en choisisses une autre, et l'analyse, les zones tracées et la checklist s'y adaptent.</Text>
        </>)}

        {page === "analyse" && (<>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={[S.strip, { borderColor: GC[gcol] }]} onPress={() => setPage("assets")}>
              <Text style={S.mu}>Actif</Text><Text style={[S.sym, { color: GC[gcol] }]}>{asset}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.strip, { borderColor: st.color }]} onPress={() => setPage("strat")}>
              <Text style={S.mu}>Stratégie</Text><Text style={[S.sym, { color: st.color }]}>{st.name}</Text>
            </TouchableOpacity>
          </View>
          <Text style={S.step}>TES CAPTURES</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TFS.map((t) => (
              <TouchableOpacity key={t} onPress={() => pick(t)} style={S.slot}>
                {imgs[t] ? <Image source={{ uri: imgs[t].uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <Ionicons name="add" size={30} color={C.mu} />}
                <Text style={[S.slotTag, { color: ac }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={S.input} multiline placeholder="Mon scénario (facultatif)" placeholderTextColor={C.mu} value={mine} onChangeText={setMine} />
          <TouchableOpacity style={[S.go, { backgroundColor: ac }]} onPress={run} disabled={busy}>{busy ? <ActivityIndicator color={C.onAcc} /> : <Text style={S.goT}>ANALYSER · {asset}</Text>}</TouchableOpacity>

          {res && (<>
            <View style={S.card}>
              <Text style={[S.big, { color: res.verdict === "Achat" ? C.buy : res.verdict === "Vente" ? C.sell : C.warn }]}>{res.verdict.toUpperCase()} · {asset}</Text>
              <Text style={S.mu}>Stratégie {rs.name} · biais {res.biais} · confiance {res.confiance}%</Text>
              <Text style={S.tx}>{res.structure}</Text>
              {res.entree != null && res.verdict !== "Attendre" && (<>
                <View style={S.grid}>
                  {[[res.type_ordre, res.entree], ["SL", res.sl], ["TP", res.tp], ["R:R", "1:" + res.rr]].map(([k, v]) => <View key={k} style={S.cell}><Text style={S.mu}>{k}</Text><Text style={S.num}>{v}</Text></View>)}
                </View>
                <TouchableOpacity style={[S.go, { backgroundColor: ac }]} onPress={toSim}><Text style={S.goT}>SIMULER CE TRADE</Text></TouchableOpacity>
              </>)}
              <Text style={S.tx}><Text style={S.b}>Invalidation : </Text>{res.invalidation}</Text>
              {!!res.comparaison && <Text style={S.tx}><Text style={S.b}>Face à ton scénario : </Text>{res.comparaison}</Text>}
              {(res.risques || []).map((x, i) => <Text key={i} style={S.mu}>• {x}</Text>)}
            </View>
            {TFS.map((t) => (
              <View key={t} style={{ gap: 8 }}>
                <Text style={S.step}>{t} · ZONES TRACÉES SUR TA CAPTURE</Text>
                <Shot img={imgs[t]} tf={t} zones={res.zones?.[t]} fib={res.fib?.[t]} off={off} toggle={(k) => setOff((o) => ({ ...o, [k]: !o[k] }))} />
                <Text style={S.mu}>{rs.legend}. Touche une zone pour la masquer. Le placement est approximatif : vérifie sur ton graphique.</Text>
                <View style={S.card}>
                  <Text style={S.b}>Pourquoi ces zones en {t}</Text>
                  {!!res.resume?.[t] && <Text style={S.tx}>{res.resume[t]}</Text>}
                  {(res.zones?.[t] || []).map((z, i) => (
                    <View key={i} style={S.why}>
                      <View style={[S.dot, { backgroundColor: ZC[z.t] || C.mu }]} />
                      <Text style={[S.tx, { flex: 1 }]}><Text style={S.b}>{z.t} {z.label} : </Text>{z.why}</Text>
                    </View>
                  ))}
                  {!!res.fib?.[t] && <Text style={S.mu}>Fibonacci tracé sur le dernier swing d'impulsion visible.</Text>}
                </View>
              </View>
            ))}
            <View style={S.card}>
              <Text style={S.big}>Checklist {rs.name} · {score}/{rs.chk.length}</Text>
              {rs.chk.map(([k, label]) => {
                const auto = k === "rr", on = auto ? rrOk : !!chk[k];
                return (
                  <TouchableOpacity key={k} disabled={auto} onPress={() => setChk({ ...chk, [k]: !chk[k] })} style={S.chkRow}>
                    <Ionicons name={on ? "checkbox" : "square-outline"} size={24} color={on ? C.buy : C.mu} />
                    <Text style={[S.tx, { flex: 1 }]}>{auto ? "R:R d'au moins 1:4 (auto)" : label}</Text>
                  </TouchableOpacity>
                );
              })}
              <Text style={{ color: full ? C.buy : score >= rs.chk.length - 2 ? C.warn : C.sell, fontWeight: "800" }}>
                {full ? "Toutes les confluences sont là." : score >= rs.chk.length - 2 ? "Presque : attends la confluence manquante." : "Trop tôt : patience, le setup n'est pas mûr."}
              </Text>
            </View>
          </>)}
        </>)}

        {page === "sim" && (
          <View style={S.card}>
            <View style={S.wrap}>{TYPES.map((t) => <Btn key={t} on={sim.t === t} onPress={() => setSim({ ...sim, t })}>{t}</Btn>)}</View>
            {[["e", "Entrée"], ["s", "Stop loss"], ["p", "Take profit"], ["r", "Risque ($)"]].map(([k, n]) => (
              <TextInput key={k} style={S.input} keyboardType="decimal-pad" placeholder={n} placeholderTextColor={C.mu} value={sim[k]} onChangeText={(v) => setSim({ ...sim, [k]: v.replace(",", ".") })} />
            ))}
            {ok ? (<>
              <Text style={[S.big, { color: rr >= 4 ? C.buy : C.warn }]}>R:R 1:{rr.toFixed(2)}</Text>
              <Text style={S.tx}>Gain si TP : +{(r * rr).toFixed(0)} $ · Perte si SL : −{r.toFixed(0)} $</Text>
              <TouchableOpacity style={[S.go, { backgroundColor: ac }]} onPress={() => saveJr([{ a: asset, t: sim.t, rr: +rr.toFixed(2), res: null }, ...jr])}><Text style={S.goT}>AJOUTER AU JOURNAL</Text></TouchableOpacity>
            </>) : <Text style={S.mu}>{e && s && p ? "Niveaux incohérents : " + (buy ? "SL < entrée < TP" : "TP < entrée < SL") : "Saisis entrée, SL et TP."}</Text>}
            <Text style={[S.b, { marginTop: 10 }]}>Journal · {done.length} clôturés · {done.length ? Math.round((win / done.length) * 100) : 0}% gagnants · net {net.toFixed(1)} R</Text>
            {jr.map((x, i) => (
              <View key={i} style={S.jr}>
                <Text style={S.tx}>{x.a} {x.t} 1:{x.rr}</Text>
                {x.res ? <Text style={S.b}>{x.res}</Text> : <View style={{ flexDirection: "row", gap: 6 }}>{["TP", "SL", "BE"].map((v) => <Btn key={v} onPress={() => saveJr(jr.map((y, j) => (j === i ? { ...y, res: v } : y)))}>{v}</Btn>)}</View>}
              </View>
            ))}
          </View>
        )}

        {page === "set" && (
          <View style={S.card}>
            <Text style={S.big}>Réglages</Text>
            <Text style={S.b}>Thème</Text>
            <View style={S.wrap}>
              {Object.entries(THEMES).map(([k, t]) => (
                <TouchableOpacity key={k} onPress={() => { setTheme(k); AsyncStorage.setItem("theme", k); }} style={[S.chip, { flexDirection: "row", alignItems: "center", gap: 6 }, theme === k && { borderColor: C.acc, borderWidth: 2 }]}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.acc, borderWidth: 1, borderColor: C.ln }} />
                  <Text style={{ color: C.tx, fontWeight: "600" }}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={S.b}>Clé API Anthropic (analyse des captures)</Text>
            <TextInput style={S.input} secureTextEntry autoCapitalize="none" placeholder="sk-ant-…" placeholderTextColor={C.mu} value={key} onChangeText={setKey} />
            <Text style={S.b}>Clé Twelve Data (graphiques or, forex, indices)</Text>
            <TextInput style={S.input} secureTextEntry autoCapitalize="none" placeholder="Clé gratuite sur twelvedata.com" placeholderTextColor={C.mu} value={tdkey} onChangeText={setTdkey} />
            <TouchableOpacity style={[S.go, { backgroundColor: ac }]} onPress={() => Promise.all([SecureStore.setItemAsync("apikey", key.trim()), SecureStore.setItemAsync("tdkey", tdkey.trim())]).then(() => Alert.alert("Clés enregistrées"))}><Text style={S.goT}>ENREGISTRER</Text></TouchableOpacity>
            <Text style={S.mu}>Les clés restent dans le stockage sécurisé du téléphone. Le Bitcoin et l'Ethereum n'ont pas besoin de clé pour le graphique. Chaque analyse est facturée à l'usage sur ton compte API.</Text>
          </View>
        )}
      </ScrollView>

      <View style={S.bar}>
        {TABS.map(([k, n, ic]) => {
          const on = page === k, mid = k === "analyse";
          return (
            <TouchableOpacity key={k} style={S.tab} onPress={() => setPage(k)}>
              {mid ? <View style={[S.mid, { backgroundColor: ac }]}><Ionicons name={ic} size={26} color={C.onAcc} /></View> : <Ionicons name={ic} size={22} color={on ? ac : C.mu} />}
              <Text style={{ fontSize: 11, fontWeight: "700", color: on ? ac : C.mu, marginTop: mid ? 2 : 0 }}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const mk = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingTop: StatusBar.currentHeight || 0 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderColor: C.ln, backgroundColor: C.bg },
  step: { color: C.mu, fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 7, marginBottom: 2 },
  grp: { fontSize: 10, fontWeight: "900", letterSpacing: 1.8, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 6 },
  rowA: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, paddingVertical: 12, borderTopWidth: 1, borderColor: C.ln, borderLeftWidth: 3, borderLeftColor: "transparent" },
  sc: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 3 },
  strip: { flex: 1, backgroundColor: C.pn, borderWidth: 1, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 13, borderColor: C.ln },
  badge: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sym: { color: C.tx, fontSize: 15, fontWeight: "800" },
  logo: { color: C.tx, fontSize: 19, fontWeight: "900", letterSpacing: 3 },
  card: { backgroundColor: C.pn, borderWidth: 1, borderColor: C.ln, borderRadius: 17, padding: 14, gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.ln, backgroundColor: C.bg },
  slot: { flex: 1, height: 132, borderRadius: 15, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.acc + "99", backgroundColor: C.pn, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  slotTag: { position: "absolute", left: 7, top: 7, fontWeight: "900", backgroundColor: "#080b16dd", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.ln, borderRadius: 12, padding: 12, color: C.tx },
  go: { borderRadius: 12, padding: 15, alignItems: "center", shadowColor: C.acc, shadowOpacity: 0.24, shadowRadius: 12, elevation: 4 },
  goT: { color: C.onAcc, fontWeight: "900", letterSpacing: 1.1 },
  big: { fontSize: 21, fontWeight: "900", color: C.tx, letterSpacing: 0.2 },
  grid: { flexDirection: "row", gap: 7 },
  cell: { flex: 1, borderWidth: 1, borderColor: C.ln, borderRadius: 12, padding: 9, backgroundColor: C.bg },
  num: { color: C.tx, fontSize: 16, fontWeight: "800" },
  tx: { color: C.tx, lineHeight: 21 },
  mu: { color: C.mu, fontSize: 12 },
  b: { color: C.tx, fontWeight: "800" },
  jr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: C.ln, paddingTop: 9 },
  why: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
  chkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  axT: { position: "absolute", right: 5, top: 3, color: C.mu, fontSize: 10 },
  axB: { position: "absolute", right: 5, bottom: 3, color: C.mu, fontSize: 10 },
  bar: { flexDirection: "row", alignItems: "center", backgroundColor: C.pn, borderTopWidth: 1, borderColor: C.ln, paddingTop: 9, paddingBottom: 12 },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  mid: { width: 43, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.acc + "88" },
  hero: { backgroundColor: "#171333", borderColor: "#51418e", borderWidth: 1, borderRadius: 22, padding: 19, minHeight: 215, overflow: "hidden", justifyContent: "center", gap: 9 },
  heroGlow: { position: "absolute", width: 230, height: 230, borderRadius: 115, right: -80, top: -95, backgroundColor: "#6d42db", opacity: 0.18 },
  heroOrb: { position: "absolute", width: 120, height: 120, borderRadius: 60, right: 16, bottom: -78, borderWidth: 1, borderColor: "#a78bfa66" },
  heroEyebrow: { color: "#c4b5fd", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  heroTitle: { color: "#ffffff", fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -0.5 },
  heroText: { color: "#d6d1ef", fontSize: 13, lineHeight: 19, maxWidth: "88%" },
  heroButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#7c3aed", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 11, marginTop: 5 },
  heroButtonText: { color: "#ffffff", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 3, marginBottom: 2 },
  sectionTitle: { color: C.tx, fontSize: 16, fontWeight: "900" },
  linkText: { color: "#a78bfa", fontSize: 12, fontWeight: "800" },
  marketGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  marketCard: { width: "48%", minHeight: 128, backgroundColor: C.pn, borderWidth: 1, borderColor: C.ln, borderRadius: 16, padding: 12, gap: 4 },
  marketIcon: { width: 34, height: 34, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 3 },
  marketSymbol: { color: C.tx, fontWeight: "900", fontSize: 14 },
  marketHint: { color: C.buy, fontSize: 10, fontWeight: "800", marginTop: 3 },
  strategyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  strategyTile: { width: "23%", minHeight: 98, backgroundColor: C.pn, borderWidth: 1, borderColor: C.ln, borderRadius: 15, alignItems: "center", justifyContent: "center", padding: 8, gap: 7 },
  strategyIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  strategyName: { color: C.tx, fontSize: 10, fontWeight: "800", textAlign: "center" },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 11, borderWidth: 1, borderColor: C.acc + "88", borderRadius: 11, backgroundColor: C.acc + "12", marginTop: 3 },
  secondaryButtonText: { color: C.tx, fontWeight: "800", fontSize: 12 },
});
S = mk(C);
