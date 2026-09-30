import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profile, services } from "../data/content";
import { RED, EDGE, TEXT, SILK, hexA, HudLabel, MetalTitle } from "../components/Comic";

const EMAILJS = {
  service: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  template: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  key: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};
const HAS_EMAILJS = Boolean(EMAILJS.service && EMAILJS.template && EMAILJS.key);

const NEEDS = [...services.map((s) => s.title), "Something else"];
const INITIAL = { name: "", email: "", need: NEEDS[0], message: "" };

const LINES = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, copy: true },
  { label: "Phone", value: profile.phone, href: profile.phoneHref },
  { label: "GitHub", value: "hsfault", href: profile.github },
  { label: "Instagram", value: "@hs_fault", href: profile.instagram },
];

const BLANK =
  "mx-1 inline-block max-w-full border-0 border-b-2 border-[rgba(201,204,214,0.25)] bg-transparent px-1 pb-0.5 align-baseline font-hero font-semibold text-[#e6e7ee] outline-none transition-colors placeholder:font-normal placeholder:text-[#c9ccd6]/30 focus:border-[#ff2d4b]";

/* an inline blank that grows with what you type */
function Blank({ value, onChange, placeholder, type = "text", name }) {
  const len = Math.max(placeholder.length, value.length) + 1;
  return (
    <input
      required
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={placeholder}
      className={BLANK}
      style={{ width: `${len}ch` }}
    />
  );
}

/* circular send button with a rotating ring of text */
function SignalOrb({ sending }) {
  return (
    <button type="submit" disabled={sending} className="group relative grid size-40 shrink-0 place-items-center sm:size-48" aria-label="Send">
      <motion.svg
        key={sending ? "fast" : "slow"}
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: sending ? 1.8 : 16, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        <defs>
          <path id="signal-orbit" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke={EDGE} strokeWidth="1" />
        <text fontFamily="JetBrains Mono, monospace" fontSize="12" letterSpacing="5" fill={SILK}>
          <textPath href="#signal-orbit">SEND A SIGNAL • SEND A SIGNAL •</textPath>
        </text>
      </motion.svg>

      <span
        className="relative grid size-20 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 group-active:scale-95 sm:size-24"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${hexA(RED, 0.95)}, #6d0c1c 72%)`,
          boxShadow: `0 0 40px ${hexA(RED, 0.55)}, inset 0 0 0 1px ${hexA(RED, 0.9)}`,
        }}
      >
        <span className="font-hero text-lg font-bold uppercase tracking-[0.1em]" style={{ color: TEXT }}>
          {sending ? "···" : "Send"}
        </span>
      </span>
    </button>
  );
}

export default function Signal() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | mailto | error
  const [sentAs, setSentAs] = useState({ name: "", email: "" });
  const [copied, setCopied] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const copyEmail = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the link still works */
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setSentAs({ name: form.name, email: form.email });

    const body = `${form.message}\n\nLooking for: ${form.need}`;

    try {
      await new Promise((r) => setTimeout(r, 700)); // let the web line zip across
      if (HAS_EMAILJS) {
        const { default: emailjs } = await import("@emailjs/browser");
        await emailjs.send(
          EMAILJS.service,
          EMAILJS.template,
          { from_name: form.name, reply_to: form.email, services: form.need, message: body },
          { publicKey: EMAILJS.key }
        );
        setStatus("sent");
      } else {
        const subject = encodeURIComponent(`New mission from ${form.name}`);
        const mailBody = encodeURIComponent(`${body}\n\n— ${form.name} (${form.email})`);
        window.location.href = `mailto:${profile.email}?subject=${subject}&body=${mailBody}`;
        setStatus("mailto");
      }
      setForm(INITIAL);
    } catch {
      setStatus("error");
    }
  };

  const sending = status === "sending";
  const done = status === "sent" || status === "mailto";

  return (
    <section id="signal" className="night relative z-10 scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 md:py-32 lg:pr-56">
      <div className="halftone-red pointer-events-none absolute -right-40 top-0 size-[680px] opacity-20" />

      <div className="relative mx-auto max-w-6xl 2xl:max-w-[1680px]">
        {/* header */}
        <motion.header
          className="max-w-4xl"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HudLabel>06 — Contact</HudLabel>
          <MetalTitle className="mt-4" size="clamp(2.6rem, 7vw, 6.5rem)">
            Send a signal
          </MetalTitle>
          <p className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: SILK }}>
            <motion.span
              className="size-1.5 rounded-full"
              style={{ background: RED, boxShadow: `0 0 8px ${RED}` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            Open for new missions · {profile.location}
          </p>
        </motion.header>

        {/* the sentence */}
        <div className="relative mt-14">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.form
                key="form"
                onSubmit={onSubmit}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: sending ? 0.35 : 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <p
                  className="max-w-5xl font-body text-2xl font-light leading-[2.1] sm:text-3xl lg:text-[2.4rem]"
                  style={{ color: SILK }}
                >
                  Hey Zeeshan, I'm <Blank name="name" value={form.name} onChange={update("name")} placeholder="your name" />,
                  and I need help with{" "}
                  <span className="relative inline-block">
                    <select
                      value={form.need}
                      onChange={update("need")}
                      aria-label="What you need"
                      className={`${BLANK} cursor-pointer appearance-none pr-7 text-[#ff2d4b]`}
                      style={{ width: `${form.need.length + 3}ch` }}
                    >
                      {NEEDS.map((n) => (
                        <option key={n} value={n} style={{ background: "#0c0c12", color: TEXT }}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-base" style={{ color: RED }}>
                      ▾
                    </span>
                  </span>
                  . You can reach me at{" "}
                  <Blank name="email" type="email" value={form.email} onChange={update("email")} placeholder="your@email.com" />.
                </p>

                <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end">
                  <label className="block flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: RED }}>
                      The mission
                    </span>
                    <textarea
                      required
                      name="message"
                      rows={3}
                      value={form.message}
                      onChange={update("message")}
                      placeholder="What are you building, and when do you need it?"
                      className="mt-3 w-full resize-none border-0 border-b-2 border-[rgba(201,204,214,0.25)] bg-transparent pb-3 text-lg leading-relaxed text-[#e6e7ee] outline-none transition-colors placeholder:text-[#c9ccd6]/30 focus:border-[#ff2d4b] sm:text-xl"
                    />
                  </label>
                  <div className="flex justify-center lg:justify-end">
                    <SignalOrb sending={sending} />
                  </div>
                </div>

                {status === "error" && (
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: RED }}>
                    Transmission failed — email me directly at {profile.email}
                  </p>
                )}

                {/* the web line that zips across while sending */}
                <AnimatePresence>
                  {sending && (
                    <motion.span
                      className="pointer-events-none absolute left-0 right-0 top-1/2 h-[2px] origin-left"
                      style={{ background: `linear-gradient(90deg, transparent, ${RED})`, boxShadow: `0 0 16px ${RED}` }}
                      initial={{ scaleX: 0, opacity: 1 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                    />
                  )}
                </AnimatePresence>
              </motion.form>
            ) : (
              <motion.div
                key="sent"
                className="max-w-4xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p
                  className="font-hero text-4xl font-bold uppercase tracking-[0.02em] sm:text-6xl"
                  style={{ color: TEXT, textShadow: `0 0 24px ${hexA(RED, 0.4)}` }}
                >
                  {status === "sent" ? "Signal caught" : "Almost there"}
                  <span style={{ color: RED }}>.</span>
                </p>
                <motion.span
                  className="mt-5 block h-px origin-left"
                  style={{ background: `linear-gradient(90deg, ${RED}, transparent)`, boxShadow: `0 0 10px ${RED}` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
                <p className="mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: SILK }}>
                  {status === "sent" ? (
                    <>
                      Thanks {sentAs.name} — your mission is in. I'll get back to you soon at{" "}
                      <span style={{ color: TEXT }}>{sentAs.email}</span>.
                    </>
                  ) : (
                    <>Your email app should be open with everything filled in — just hit send there.</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-8 min-h-11 font-mono text-[11px] uppercase tracking-[0.35em] transition-colors hover:text-[#ff2d4b]"
                  style={{ color: SILK }}
                >
                  ← Send another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* direct lines — outlined giants that fill with neon on hover */}
        <div className="mt-24">
          <HudLabel>Or reach me directly</HudLabel>
          <ul className="mt-6" style={{ borderTop: `1px solid ${EDGE}` }}>
            {LINES.map((l, i) => (
              <li key={l.label} className="flex items-center gap-3" style={{ borderBottom: `1px solid ${EDGE}` }}>
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex min-h-16 flex-1 items-center gap-4 py-5 sm:gap-8"
                >
                  <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.35em] sm:w-32" style={{ color: SILK }}>
                    <span style={{ color: RED }}>{String(i + 1).padStart(2, "0")}</span> {l.label}
                  </span>

                  <span className="relative min-w-0 truncate font-hero text-2xl font-bold uppercase leading-none tracking-[0.02em] sm:text-4xl lg:text-5xl">
                    <span style={{ color: "transparent", WebkitTextStroke: "1px rgba(201,204,214,0.4)" }}>{l.value}</span>
                    <span
                      className="absolute inset-0 transition-[clip-path] duration-500 ease-out [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0%_0_0)]"
                      style={{ color: RED, textShadow: `0 0 18px ${hexA(RED, 0.5)}` }}
                      aria-hidden="true"
                    >
                      {l.value}
                    </span>
                  </span>

                  <span
                    className="ml-auto text-2xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    style={{ color: RED }}
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </a>

                {l.copy && (
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="grid h-11 min-w-16 place-items-center px-3 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors hover:border-[#ff2d4b]"
                    style={{ border: `1px solid ${EDGE}`, color: copied ? RED : SILK }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}