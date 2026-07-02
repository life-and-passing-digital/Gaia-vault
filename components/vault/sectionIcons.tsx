import type { SectionType } from "@/lib/db/types";
import {
  IconBank,
  IconFile,
  IconHeart,
  IconMail,
  IconUsers,
  type IconProps,
} from "@/components/ui/icons";

const MAP: Record<SectionType, (p: IconProps) => React.ReactNode> = {
  wishes: IconHeart,
  people: IconUsers,
  documents: IconFile,
  assets: IconBank,
  messages: IconMail,
};

/** The icon for a vault section, consistent everywhere it appears. */
export function SectionIcon({
  section,
  ...props
}: IconProps & { section: SectionType }) {
  const Icon = MAP[section];
  return <Icon {...props} />;
}
