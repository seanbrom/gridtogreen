interface RacingStripeProps {
  variant?: "bold" | "subtle";
}

export function RacingStripe({ variant = "subtle" }: RacingStripeProps) {
  return (
    <div
      className={`w-full ${variant === "bold" ? "racing-stripe h-1.5" : "racing-stripe-subtle h-1"}`}
      role="separator"
    />
  );
}
