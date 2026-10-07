"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  defaultDienstbefreiungFormData,
  type AuthenticatedEmployee,
  type DienstbefreiungFormData,
} from "../../types/dienstbefreiung";
import { submitDienstbefreiung } from "./actions";
import styles from "./dienstbefreiung.module.css";

const ANLAESS = [
  "Fussball",
  "Handball",
  "Schwingen / Freestyle",
  "Judo",
  "Leichtathletik",
  "Mehrkampf",
  "Ski",
  "Triathlon",
  "Unihockey",
  "Andere",
];

const DIENSTE = ["G1", "G2", "N2", "N2 / ND", "N3", "P3", "Andere"];

function weekday(date: string): string {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("de-CH", {
    weekday: "long",
  }).format(parsed);
}

type Props = {
  employee: AuthenticatedEmployee;
};

export default function DienstbefreiungForm({ employee }: Props) {
  const [form, setForm] = useState<DienstbefreiungFormData>(
    defaultDienstbefreiungFormData,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anlassVonWochentag = useMemo(
    () => weekday(form.anlassVon),
    [form.anlassVon],
  );
  const anlassBisWochentag = useMemo(
    () => weekday(form.anlassBis),
    [form.anlassBis],
  );

  const dienstbefreiungWochentage = [
    weekday(form.dienstbefreiung1),
    weekday(form.dienstbefreiung2),
    weekday(form.dienstbefreiung3),
  ];

  function update<K extends keyof DienstbefreiungFormData>(
    key: K,
    value: DienstbefreiungFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleDienst(value: string) {
    setForm((current) => ({
      ...current,
      dienst: current.dienst.includes(value)
        ? current.dienst.filter((item) => item !== value)
        : [...current.dienst, value],
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await submitDienstbefreiung(form);
      setMessage("Der Antrag wurde erfolgreich gespeichert.");
      setForm(defaultDienstbefreiungFormData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Der Antrag konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.page} onSubmit={onSubmit}>
      <header className={styles.header}>
        <div className={styles.department}>
          Justiz- und Sicherheitsdepartement des Kantons Basel-Stadt
        </div>
        <h1>Antrag auf Dienstbefreiung für Sportanlässe</h1>
        <p>2. Hd. Sportoffizier</p>
      </header>

      <section className={styles.section}>
        <h2>Antragsteller</h2>

        <div className={styles.grid2}>
          <ReadOnlyField label="Vorname" value={employee.firstName} />
          <ReadOnlyField label="Name" value={employee.lastName} />
          <ReadOnlyField label="Abteilung" value={employee.department} />
          <ReadOnlyField label="UserID" value={employee.userId} />
        </div>

        <Field
          label="Dienstgrad"
          value={form.dienstgrad}
          onChange={(value) => update("dienstgrad", value)}
        />

        <TextArea
          label="Antragsteller Bemerkungen"
          value={form.antragstellerBemerkungen}
          onChange={(value) =>
            update("antragstellerBemerkungen", value)
          }
        />
      </section>

      <section className={styles.section}>
        <h2>Anlass</h2>

        <fieldset className={styles.fieldset}>
          <legend>Anlass / Disziplin</legend>

          <div className={styles.checkGrid}>
            {ANLAESS.map((item) => (
              <label key={item} className={styles.checkbox}>
                <input
                  type="radio"
                  name="anlassDisziplin"
                  value={item}
                  checked={form.anlassDisziplin === item}
                  onChange={(event) =>
                    update("anlassDisziplin", event.target.value)
                  }
                />
                {item}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Anderer Anlass / Andere Disziplin"
          value={form.andererAnlass}
          onChange={(value) => update("andererAnlass", value)}
        />

        <div className={styles.grid2}>
          <DateField
            label="Datum Anlass von"
            value={form.anlassVon}
            onChange={(value) => update("anlassVon", value)}
          />
          <ReadOnlyField
            label="Wochentag Anlass von"
            value={anlassVonWochentag}
          />
          <DateField
            label="Datum Anlass bis"
            value={form.anlassBis}
            onChange={(value) => update("anlassBis", value)}
          />
          <ReadOnlyField
            label="Wochentag Anlass bis"
            value={anlassBisWochentag}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Wann findet die Dienstbefreiung statt?</h2>

        <div className={styles.grid2}>
          <DateField
            label="Datum 1 Dienstbefreiung"
            value={form.dienstbefreiung1}
            onChange={(value) => update("dienstbefreiung1", value)}
          />
          <ReadOnlyField
            label="Wochentag 1"
            value={dienstbefreiungWochentage[0]}
          />

          <DateField
            label="Datum 2 Dienstbefreiung"
            value={form.dienstbefreiung2}
            onChange={(value) => update("dienstbefreiung2", value)}
          />
          <ReadOnlyField
            label="Wochentag 2"
            value={dienstbefreiungWochentage[1]}
          />

          <DateField
            label="Datum 3 Dienstbefreiung"
            value={form.dienstbefreiung3}
            onChange={(value) => update("dienstbefreiung3", value)}
          />
          <ReadOnlyField
            label="Wochentag 3"
            value={dienstbefreiungWochentage[2]}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Dienst</h2>

        <fieldset className={styles.fieldset}>
          <legend>Welche Dienstart betrifft die Dienstbefreiung?</legend>

          <div className={styles.checkGrid}>
            {DIENSTE.map((item) => (
              <label key={item} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.dienst.includes(item)}
                  onChange={() => toggleDienst(item)}
                />
                {item}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Anderer Dienst"
          value={form.andererDienst}
          onChange={(value) => update("andererDienst", value)}
        />
      </section>

      <section className={styles.section}>
        <h2>Dienstweg</h2>

        <Field
          label="Dienststelle / Vorgesetzter Stufe 1"
          value={form.dienstVorangehendeStufe1}
          onChange={(value) =>
            update("dienstVorangehendeStufe1", value)
          }
        />

        <TextArea
          label="Dienststelle / Vorgesetzter Stufe 1 Bemerkungen"
          value={form.dienstVorangehendeStufe1Bemerkung}
          onChange={(value) =>
            update("dienstVorangehendeStufe1Bemerkung", value)
          }
        />

        <Field
          label="Dienststelle / Vorgesetzter Stufe 2"
          value={form.dienstVorangehendeStufe2}
          onChange={(value) =>
            update("dienstVorangehendeStufe2", value)
          }
        />

        <TextArea
          label="Dienststelle / Vorgesetzter Stufe 2 Bemerkungen"
          value={form.dienstVorangehendeStufe2Bemerkung}
          onChange={(value) =>
            update("dienstVorangehendeStufe2Bemerkung", value)
          }
        />
      </section>

      <section className={styles.section}>
        <h2>Dienstbefreiung Sportler</h2>

        <TextArea
          label="Begründung des Sportlers"
          value={form.begruendungSportler}
          onChange={(value) => update("begruendungSportler", value)}
        />

        <div className={styles.grid2}>
          <Field
            label="Status Test"
            value={form.statusTest}
            onChange={(value) => update("statusTest", value)}
          />
          <Field
            label="Anhänge"
            value={form.anhaenge}
            onChange={(value) => update("anhaenge", value)}
          />
        </div>
      </section>

      {message && (
        <div className={styles.success} role="status">
          {message}
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={saving}
          onClick={() => history.back()}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={saving}
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input type="text" value={value} readOnly />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
