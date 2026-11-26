import { useLumoraStore } from '../store/useLumoraStore';
import type { MediaSession } from '../types/lumora';
import MediaChip from './MediaChip';
import StarredSitesChip from './StarredSitesChip';

export default function BottomDock({
  sessions,
  onRefreshMedia,
  onOpenSettings,
}: {
  sessions: MediaSession[];
  onRefreshMedia: () => Promise<void>;
  onOpenSettings: () => void;
}) {
  const mediaAutoHide = useLumoraStore((state) => state.settings.mediaAutoHide);
  return (
    <div className="bottom-dock">
      <MediaChip sessions={sessions} autoHide={mediaAutoHide} onRefresh={onRefreshMedia} />
      <StarredSitesChip onOpenSettings={onOpenSettings} />
    </div>
  );
}
