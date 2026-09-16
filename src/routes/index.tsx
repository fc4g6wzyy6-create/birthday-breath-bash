import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import cake from "@/assets/cake.png";
import photoTrain from "@/assets/WhatsApp_Image_2026-09-16_at_01.31.31.jpeg.asset.json";
import photoHarbor from "@/assets/WhatsApp_Image_2026-09-16_at_01.31.31_3.jpeg.asset.json";
import photoGlasses from "@/assets/WhatsApp_Image_2026-09-16_at_01.31.31_1.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Happy Birthday, My Love — Sept 22" },
      {
        name: "description",
        content:
          "A little birthday surprise: make a wish, blow out the candles, and see what's waiting for you.",
      },
      { property: "og:title", content: "Happy Birthday, My Love — Sept 22" },
      {
        property: "og:description",
        content: "Make a wish, blow out the candles, and open your surprise.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CANDLE_COUNT = 3;

type Stage = "invite" | "listening" | "celebrating";
type MicState = "off" | "on" | "denied";

function Index() {
  const [stage, setStage] = useState<Stage>("invite");
  const [micState, setMicState] = useState<MicState>("off");
  const [lit, setLit] = useState(CANDLE_COUNT);
  const [smoke, setSmoke] = useState<boolean[]>(
    Array.from({ length: CANDLE_COUNT }, () => false),
  );

  const litRef = useRef(CANDLE_COUNT);
  const blowRef = useRef(0);
  const lastTsRef = useRef(0);
  const rafRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  const celebrate = useCallback(() => {
    stopMic();
    setStage("celebrating");
  }, [stopMic]);

  const extinguishOne = useCallback(() => {
    if (litRef.current <= 0) return;
    const idx = litRef.current - 1;
    litRef.current = idx;
    setLit(idx);
    setSmoke((s) => {
      const next = [...s];
      next[idx] = true;
      return next;
    });
    if (idx === 0) window.setTimeout(celebrate, 1100);
  }, [celebrate]);

  const startListening = useCallback(async () => {
    if (stage !== "invite") return;
    setStage("listening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      setMicState("on");
      lastTsRef.current = performance.now();
      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        const now = performance.now();
        const dt = Math.min((now - lastTsRef.current) / 1000, 0.1);
        lastTsRef.current = now;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // A real blow into the mic spikes the volume well past this level.
        if (rms > 0.09) {
          blowRef.current += dt;
          const needed = 0.45 * (CANDLE_COUNT - litRef.current) + 0.45;
          if (blowRef.current >= needed) extinguishOne();
        }
      };
      tick();
    } catch {
      setMicState("denied");
    }
  }, [extinguishOne, stage]);

  useEffect(() => {
    if (stage === "celebrating") {
      const t = window.setTimeout(() => {
        revealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
      return () => window.clearTimeout(t);
    }
  }, [stage]);

  useEffect(() => stopMic, [stopMic]);

  const candlesLit = lit > 0;

  return (
    <main className="min-h-screen bg-paper text-ink overflow-x-hidden">
      {stage === "celebrating" && <ConfettiCanvas />}

      <div className="mx-auto max-w-md px-6 pt-12 pb-16">
        {/* ---------- Stage 1: the cake & the wish ---------- */}
        <section
          className={`flex min-h-[calc(100svh-6rem)] flex-col items-center transition-opacity duration-700 ${
            stage === "celebrating" ? "opacity-60" : "opacity-100"
          }`}
        >
          <header className="animate-fade-in-up text-center">
            <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-ink/40">
              For you, September 22
            </span>
            <h1 className="font-display text-4xl italic leading-tight text-balance">
              {stage === "celebrating"
                ? "You blew them all out!"
                : "Make a wish, then blow them out."}
            </h1>
          </header>

          {/* Cake with candles */}
          <button
            type="button"
            onClick={extinguishOne}
            aria-label="Tap to blow out a candle"
            className="relative mt-14 w-64 cursor-pointer outline-none"
          >
            <div className="animate-breathe absolute bottom-10 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-glow/40 blur-3xl" />

            {/* Candles */}
            <div className="absolute -top-[4.7rem] left-1/2 z-10 flex -translate-x-1/2 gap-7">
              {Array.from({ length: CANDLE_COUNT }).map((_, i) => {
                const isLit = i < lit;
                return (
                  <div key={i} className="relative flex flex-col items-center">
                    {isLit ? (
                      <div
                        className="animate-flicker -mb-1 h-5 w-3 rounded-full bg-glow shadow-[0_0_18px_6px_rgba(255,197,100,0.55)]"
                        style={{ animationDelay: `${i * 0.28}s` }}
                      />
                    ) : (
                      <div className="h-5 w-3 -mb-1 flex items-start justify-center">
                        {smoke[i] && (
                          <div className="animate-wisp h-2 w-2 rounded-full bg-ink/30 blur-[2px]" />
                        )}
                      </div>
                    )}
                    <div className="candle-stripe h-11 w-2 rounded-t-full border-x border-t border-ink/10" />
                  </div>
                );
              })}
            </div>

            <img
              src={cake}
              alt="A hand-painted birthday cake with cream frosting and strawberries"
              width={768}
              height={768}
              className="animate-float-soft relative w-full drop-shadow-[0_24px_40px_rgba(45,36,45,0.14)]"
            />
          </button>

          {/* Blow prompt */}
          <div className="mt-12 flex flex-col items-center gap-4">
            {stage === "invite" && (
              <button
                type="button"
                onClick={startListening}
                className="rounded-full bg-coral px-8 py-3.5 text-sm font-medium tracking-wide text-paper shadow-[0_12px_30px_-8px_rgba(212,129,102,0.6)] transition-transform hover:scale-[1.03] active:scale-95"
              >
                Tap to make your wish
              </button>
            )}
            {stage === "listening" && (
              <div className="flex items-center gap-3 rounded-full border border-ink/10 bg-white px-5 py-3 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
                </span>
                <span className="text-xs uppercase tracking-[0.15em] text-ink/60">
                  {micState === "on"
                    ? "Mic on — blow into your phone!"
                    : "Getting your mic ready…"}
                </span>
              </div>
            )}
            {micState === "denied" && (
              <p className="max-w-[26ch] text-center text-xs uppercase tracking-[0.15em] text-ink/50">
                No mic? No problem — just tap the cake to blow the candles out
              </p>
            )}
            {stage === "celebrating" && (
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">
                Your wish is on its way
              </p>
            )}
          </div>
        </section>

        {/* ---------- Stage 2: the reveal ---------- */}
        <div ref={revealRef}>
          {stage === "celebrating" && (
            <div className="space-y-20">
              {/* The message */}
              <section className="animate-fade-in-up px-2 pt-8 text-center">
                <h2 className="font-script text-5xl italic leading-tight text-coral">
                  Happy Birthday, My Love
                </h2>
                <p className="mx-auto mt-6 max-w-[34ch] text-lg leading-relaxed text-pretty text-ink/70">
                  The world got so much brighter the day you were born. I hope
                  today feels as magic as you make every ordinary day feel.
                  Here's to you, and to every wish we still get to make
                  together.
                </p>
              </section>

              {/* The photo strip */}
              <section className="space-y-12 pb-4">
                <Polaroid
                  src={photoTrain.url}
                  alt="A candid selfie on the train"
                  caption="Train rides with you &gt; anywhere"
                  rotateClass="rotate-[-2deg]"
                  delay="0s"
                />
                <Polaroid
                  src={photoHarbor.url}
                  alt="A selfie in a baseball cap in front of a Neptune statue at the harbor"
                  caption="Poseidon's biggest fan"
                  rotateClass="rotate-[3deg]"
                  delay="0.15s"
                />
                <Polaroid
                  src={photoGlasses.url}
                  alt="A close-up of her glasses reflecting the trees on a sunny day"
                  caption="My favorite view, always"
                  rotateClass="rotate-[-1deg]"
                  delay="0.3s"
                />
              </section>

              {/* Signature */}
              <footer className="animate-fade-in-up pb-6 text-center opacity-70">
                <p className="font-display text-xl italic">Always yours, Aymane</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-ink/50">
                  September 22
                </p>
              </footer>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Polaroid({
  src,
  alt,
  caption,
  rotateClass,
  delay,
}: {
  src: string;
  alt: string;
  caption: string;
  rotateClass: string;
  delay: string;
}) {
  return (
    <div
      className={`animate-fade-in-up mx-auto max-w-[280px] border border-ink/5 bg-white p-3 pb-10 shadow-xl transition-transform duration-300 hover:rotate-0 ${rotateClass}`}
      style={{ animationDelay: delay }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="aspect-[4/5] w-full bg-blush object-cover"
      />
      <div className="mt-4 px-1 font-display text-sm italic text-ink/45">
        {caption}
      </div>
    </div>
  );
}

function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c2 = canvas.getContext("2d");
    if (!c2) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#D48166", "#FFD580", "#F4A9B8", "#9DB5A3", "#C6BBE4"];
    const parts = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -30 - Math.random() * window.innerHeight * 0.6,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 100 + Math.random() * 170,
      vx: -45 + Math.random() * 90,
      rot: Math.random() * Math.PI,
      vr: -3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    }));

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      c2.clearRect(0, 0, canvas.width, canvas.height);
      c2.save();
      c2.scale(dpr, dpr);
      for (const p of parts) {
        p.y += p.vy * dt;
        p.x += p.vx * dt + Math.sin(now / 480 + p.rot) * 0.6;
        p.rot += p.vr * dt;
        if (p.y > window.innerHeight + 30) {
          p.y = -30;
          p.x = Math.random() * window.innerWidth;
        }
        c2.save();
        c2.translate(p.x, p.y);
        c2.rotate(p.rot);
        c2.fillStyle = p.color;
        c2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c2.restore();
      }
      c2.restore();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50" />;
}
