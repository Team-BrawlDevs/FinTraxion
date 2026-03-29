/**
 * Minimal ops-style backdrop: faint grid only. No blobs or gradient curves.
 */
export default function BackgroundDecor() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-grid-faint bg-grid bg-background"
      aria-hidden="true"
    />
  )
}
