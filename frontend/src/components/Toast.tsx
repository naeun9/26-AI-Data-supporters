import { useAppState } from "../state/AppState";
import "./Toast.css";

export function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;

  return (
    <div className="toast-wrap" role="status">
      <div className="toast">{toast}</div>
    </div>
  );
}
