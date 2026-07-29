import {
  ShoppingBag,
  Bike,
  Landmark,
  ArrowDownToLine,
  CreditCard,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Ticket,
  RefreshCw,
  Coins,
  TrainFront,
  Camera,
  Stamp,
  Sparkles,
  Receipt,
} from "lucide-react"

// One coherent line-icon set (unified stroke) replacing OS emoji as functional
// iconography. Keys are stored in mock-data; components render via <AppIcon/>.
const REGISTRY = {
  beauty: ShoppingBag,
  delivery: Bike,
  museum: Landmark,
  topup: ArrowDownToLine,
  card: CreditCard,
  check: CheckCircle2,
  gift: Gift,
  shield: ShieldCheck,
  ticket: Ticket,
  refresh: RefreshCw,
  coins: Coins,
  transit: TrainFront,
  camera: Camera,
  stamp: Stamp,
  sparkles: Sparkles,
  receipt: Receipt,
} as const

export type IconKey = keyof typeof REGISTRY

export function AppIcon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: IconKey
  className?: string
  strokeWidth?: number
}) {
  const Cmp = REGISTRY[name] ?? Receipt
  return <Cmp className={className} strokeWidth={strokeWidth} />
}
