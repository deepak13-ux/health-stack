import { useEffect } from "react";
import { Compass, Lock } from "lucide-react";
import { ButtonLink, EmptyState } from "../components/ui.jsx";

const useTitle = (title) => useEffect(() => { document.title = `${title} · Careflow`; }, [title]);

export function Forbidden() {
  useTitle("Access denied");
  return (
    <div className="bg-white border border-line rounded-2xl">
      <h1 className="sr-only">Access denied</h1>
      <EmptyState icon={Lock} title="You don't have access to this page." action={<ButtonLink to="/overview">Back to overview</ButtonLink>}>
        Your account's role can't open this screen.
      </EmptyState>
    </div>
  );
}

export function NotFound() {
  useTitle("Not found");
  return (
    <div className="bg-white border border-line rounded-2xl">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState icon={Compass} title="We couldn't find that page." action={<ButtonLink to="/overview">Back to overview</ButtonLink>}>
        Check the address, or return to your overview.
      </EmptyState>
    </div>
  );
}
