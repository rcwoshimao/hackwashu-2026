import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import { AccountRepos } from "./AccountRepos.tsx";
import { IMessageLink } from "./IMessageLink.tsx";
import { useMe } from "./useMe.ts";

export function SignInPage() {
  const { me, loading, failed } = useMe();
  const [signingOut, setSigningOut] = useState(false);
  const [signoutFailed, setSignoutFailed] = useState(false);
  const signout = async () => {
    setSigningOut(true);
    const result = await api.signout();
    if (result.ok) window.location.assign("/signin");
    else {
      setSigningOut(false);
      setSignoutFailed(true);
    }
  };
  return (
    <main className="page form-page account-page">
      <div className="form-panel panel">
        <p className="eyebrow">{copy.brand}</p>
        <h1>{me?.signedIn ? copy.accountTitle : copy.signInTitle}</h1>
        {!me?.signedIn && <p>{copy.signInIntro}</p>}
        {loading && <p role="status">{copy.commonLoading}</p>}
        {failed && <p role="alert">{copy.signInUnavailable}</p>}
        {me?.signedIn ? (
          <div className="account-state">
            <p>
              {copy.signInConnected}{" "}
              <strong>{me.login ?? copy.commonUnknown}</strong>
            </p>
            <button
              type="button"
              onClick={() => void signout()}
              disabled={signingOut}
            >
              {copy.navSignOut}
            </button>
            {signoutFailed && <p role="alert">{copy.signInUnavailable}</p>}
            <IMessageLink />
            <AccountRepos login={me.login ?? ""} />
          </div>
        ) : (
          <a className="button" href="/auth/github">
            {copy.signInAction}
          </a>
        )}
      </div>
    </main>
  );
}
