import { copy } from "@ground-control/copy";
import { type FormEvent, useState } from "react";
import { api } from "../api.ts";

type State =
  | "idle"
  | "invalid"
  | "pending"
  | "sent"
  | "limit"
  | "unavailable"
  | "error";

export function IMessageLink() {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>("idle");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setState("invalid");
      return;
    }
    setState("pending");
    const result = await api.imessageLink(normalizedPhone);
    if (result.ok) {
      setState("sent");
      return;
    }
    setState(
      result.error.status === 429
        ? "limit"
        : result.error.status === 503
          ? "unavailable"
          : "error",
    );
  };
  const feedback = {
    idle: "",
    invalid: copy.imessageInvalidPhone,
    pending: copy.imessagePending,
    sent: copy.imessageSent,
    limit: copy.imessageRateLimit,
    unavailable: copy.imessageUnavailable,
    error: copy.imessageFailed,
  }[state];
  return (
    <section className="account-state imessage-link">
      <h2>{copy.imessageTitle}</h2>
      <p>{copy.imessageIntro}</p>
      <form onSubmit={(event) => void submit(event)} noValidate>
        <label htmlFor="imessage-phone">{copy.imessagePhoneLabel}</label>
        <input
          id="imessage-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          placeholder={copy.imessagePhonePlaceholder}
          onChange={(event) => {
            setPhone(event.target.value);
            setState("idle");
          }}
        />
        <p className="form-hint">{copy.imessagePhoneHint}</p>
        <button type="submit" disabled={state === "pending"}>
          {copy.imessageAction}
        </button>
      </form>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
