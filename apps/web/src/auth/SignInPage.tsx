import { copy } from "@ground-control/copy";
import { AccountRepos } from "./AccountRepos.tsx";
import { IMessageLink } from "./IMessageLink.tsx";
import { useMe } from "./useMe.ts";

export function SignInPage() {
  const { me, loading, failed } = useMe();
  return (
    <main className="page form-page account-page">
      <div className="form-panel panel">
        <p className="eyebrow">{copy.brand}</p>
        <h1>{me?.signedIn ? copy.navMyRepos : copy.signInTitle}</h1>
        {!me?.signedIn && <p>{copy.signInIntro}</p>}
        {loading && <p role="status">{copy.commonLoading}</p>}
        {failed && <p role="alert">{copy.signInUnavailable}</p>}
        {me?.signedIn ? (
          <div className="account-state">
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
