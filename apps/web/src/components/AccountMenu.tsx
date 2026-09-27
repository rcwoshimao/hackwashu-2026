import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import { useMe } from "../auth/useMe.ts";

function DefaultAvatar() {
  return (
    <svg className="account-avatar" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15.5" className="avatar-ring" />
      <circle cx="16" cy="12.5" r="5" className="avatar-figure" />
      <path
        d="M6.5 26.5c1.8-5 5.3-7.5 9.5-7.5s7.7 2.5 9.5 7.5"
        className="avatar-figure"
      />
    </svg>
  );
}

function Avatar({ login }: { login: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <DefaultAvatar />;
  return (
    <img
      className="account-avatar"
      src={`https://github.com/${encodeURIComponent(login)}.png?size=64`}
      alt={copy.navAvatarAlt}
      width={32}
      height={32}
      onError={() => setBroken(true)}
    />
  );
}

export function AccountMenu() {
  const { me, loading } = useMe();
  const [signingOut, setSigningOut] = useState(false);
  if (loading) return <span className="account-slot" aria-hidden="true" />;
  if (!me?.signedIn || !me.login)
    return (
      <a className="account-slot" href="/signin" title={copy.navSignedOut}>
        <DefaultAvatar />
        <span className="visually-hidden">{copy.navSignIn}</span>
      </a>
    );
  const signout = async () => {
    setSigningOut(true);
    const result = await api.signout();
    if (result.ok) window.location.assign("/");
    else setSigningOut(false);
  };
  return (
    <details className="account-menu">
      <summary
        className="account-slot"
        aria-label={`${copy.navSignedInAs} @${me.login}. ${copy.navAccount}`}
      >
        <Avatar login={me.login} />
        <span className="account-login">@{me.login}</span>
      </summary>
      <div className="account-popover">
        <p>
          {copy.signInConnected} <strong>{me.login}</strong>
        </p>
        <a href="/signin">{copy.navMyRepos}</a>
        <a href="/reports">{copy.navReports}</a>
        <button
          type="button"
          onClick={() => void signout()}
          disabled={signingOut}
        >
          {copy.navSignOut}
        </button>
      </div>
    </details>
  );
}
