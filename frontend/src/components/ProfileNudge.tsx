import { useNavigate } from "react-router-dom";
import "./ProfileNudge.css";

/** "내 맞춤" 결과 정확도를 높이려면 연차·지역을 마저 설정하라고 가볍게 유도. 둘 다 있으면 아무것도 안 보여줌. */
export function ProfileNudge({ myStage, myRegion }: { myStage: string | null; myRegion: string | null }) {
  const navigate = useNavigate();
  if (myStage && myRegion) return null;

  const text =
    !myStage && !myRegion
      ? "창업 연차·지역을 설정하면 더 정확한 맞춤 공고를 볼 수 있어요"
      : !myStage
        ? "창업 연차를 설정하면 더 정확해요"
        : "지역을 설정하면 더 정확한 맞춤 공고를 볼 수 있어요";

  return (
    <div className="profile-nudge">
      <span>{text}</span>
      <button className="profile-nudge-cta" onClick={() => navigate("/my")}>
        설정하기 →
      </button>
    </div>
  );
}
