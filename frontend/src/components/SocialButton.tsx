import { KakaoIcon, GoogleIcon } from "../icons/SocialIcons";

interface Props {
  provider: "kakao" | "google";
  label: string;
  onClick?: () => void;
}

export function SocialButton({ provider, label, onClick }: Props) {
  return (
    <button
      type="button"
      className={`btn btn-social${provider === "kakao" ? " kakao" : ""}`}
      onClick={onClick}
      style={{ width: "100%" }}
    >
      {provider === "kakao" ? <KakaoIcon /> : <GoogleIcon />}
      {label}
    </button>
  );
}
