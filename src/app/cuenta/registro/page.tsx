"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField, AuthShell, inputClass } from "@/components/auth/auth-shell";
import { PinKeypad } from "@/components/auth/pin-keypad";
import { PinSetupSteps } from "@/components/auth/pin-setup-steps";
import { COUNTRIES } from "@/data/countries";
import { useUserAuth } from "@/components/providers/user-auth-provider";
import type { UserGender } from "@/types/user";

type PinStep = "create" | "confirm";

export default function RegistroPage() {
  const router = useRouter();
  const { refresh } = useUserAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [country, setCountry] = useState("España");
  const [gender, setGender] = useState<UserGender>("hombre");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<PinStep>("create");
  const [pinReady, setPinReady] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function resetPinFlow() {
    setPin("");
    setPinConfirm("");
    setPinStep("create");
    setPinReady(false);
  }

  function handlePinComplete(code: string) {
    if (pinStep === "create") {
      setPin(code);
      setPinStep("confirm");
      setPinConfirm("");
      setPinReady(false);
      return;
    }

    if (code !== pin) {
      setError("Los códigos de 4 dígitos no coinciden. Inténtalo de nuevo.");
      resetPinFlow();
      return;
    }

    setPinConfirm(code);
    setPinReady(true);
    setError("");
  }

  function handlePinChange(value: string) {
    if (pinStep === "create") {
      setPin(value);
      setPinReady(false);
      return;
    }

    setPinConfirm(value);
    setPinReady(false);
    if (value.length === 0) {
      setPinStep("create");
      setPin("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (pin.length !== 4 || pinConfirm.length !== 4 || pin !== pinConfirm) {
      setError("Completa y confirma tu código de 4 dígitos.");
      return;
    }

    if (!privacyAccepted) {
      setError("Debes aceptar el aviso de privacidad.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          mobile,
          birthDate,
          country,
          gender,
          pin,
          privacyAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear la cuenta.");
        return;
      }
      await refresh();
      router.push("/cuenta");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Completa tus datos y crea un código de 4 dígitos (lo ingresarás dos veces para confirmarlo)."
      footer={
        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/cuenta/ingresar" className="text-indigo-600 font-semibold hover:underline">
            Ingresar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField label="Nombre *">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              required
              autoComplete="given-name"
            />
          </AuthField>
          <AuthField label="Apellido *">
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              required
              autoComplete="family-name"
            />
          </AuthField>
        </div>

        <AuthField label="Correo electrónico *">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
            autoComplete="email"
            placeholder="tu@correo.com"
          />
        </AuthField>

        <AuthField label="Número móvil *">
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={inputClass}
            required
            autoComplete="tel"
            placeholder="+34 600 000 000"
          />
          <p className="text-xs text-slate-400 mt-1">Solo para contacto. Para ingresar usarás tu código de 4 dígitos.</p>
        </AuthField>

        <AuthField label="Fecha de nacimiento *">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={inputClass}
            required
          />
        </AuthField>

        <AuthField label="País donde vives *">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
            required
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </AuthField>

        <AuthField label="Género *">
          <div className="flex gap-3">
            {(["hombre", "mujer"] as const).map((value) => (
              <label
                key={value}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${
                  gender === value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={gender === value}
                  onChange={() => setGender(value)}
                  className="sr-only"
                />
                {value === "hombre" ? "Hombre" : "Mujer"}
              </label>
            ))}
          </div>
        </AuthField>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <PinSetupSteps step={pinStep} pinReady={pinReady} />

          {pinStep === "confirm" && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-center">
              <p className="text-sm font-bold text-amber-900">⚠️ Repite tu código</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Introduce otra vez los mismos 4 dígitos del paso anterior.
              </p>
            </div>
          )}

          <PinKeypad
            value={pinStep === "create" ? pin : pinConfirm}
            onChange={handlePinChange}
            onComplete={handlePinComplete}
            disabled={saving}
          />

          {pinStep === "confirm" && (
            <button
              type="button"
              onClick={resetPinFlow}
              className="w-full text-xs font-semibold text-indigo-600 hover:underline py-1"
            >
              ← Volver al paso 1 y cambiar código
            </button>
          )}

          {pinReady && (
            <p className="text-center text-sm font-semibold text-emerald-600">
              ✓ Código confirmado correctamente
            </p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Aviso de privacidad
          </p>
          <p className="text-xs text-amber-900/90 leading-relaxed">
            Tus datos personales (nombre, correo, móvil, fecha de nacimiento, país y género) se
            almacenan de forma segura en Firebase únicamente para gestionar tu cuenta en Líneas y
            Letras. No compartimos tu información con terceros sin tu consentimiento. El código de
            4 dígitos se guarda cifrado y no es visible para nadie, ni siquiera para el equipo del
            sitio.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600"
            />
            <span className="text-xs text-amber-900 font-medium">
              He leído el aviso y acepto el tratamiento de mis datos.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving || !privacyAccepted}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
        >
          {saving ? "Creando cuenta..." : "Crear mi cuenta"}
        </button>
        {!privacyAccepted && (
          <p className="text-center text-xs text-slate-400">
            Marca la casilla del aviso de privacidad para activar el botón.
          </p>
        )}
      </form>
    </AuthShell>
  );
}
