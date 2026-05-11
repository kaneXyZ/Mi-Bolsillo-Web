export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout mínimo: la página /protected define el aspecto de la app
  return <>{children}</>;
}