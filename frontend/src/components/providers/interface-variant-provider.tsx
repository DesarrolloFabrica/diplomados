"use client";

import * as React from "react";
import {
  getInterfaceVariantConfig,
  resolveInterfaceVariant,
  type InterfaceVariant,
  type InterfaceVariantConfig,
} from "@backend/config/interface-variants";

type InterfaceVariantContextValue = {
  variant: InterfaceVariant;
  config: InterfaceVariantConfig;
  setVariant: (variant: InterfaceVariant) => void;
};

const InterfaceVariantContext = React.createContext<InterfaceVariantContextValue | undefined>(
  undefined,
);

export function InterfaceVariantProvider({
  initialVariant,
  children,
}: Readonly<{
  initialVariant: InterfaceVariant;
  children: React.ReactNode;
}>) {
  const [variant, setVariantState] = React.useState<InterfaceVariant>(() =>
    resolveInterfaceVariant(initialVariant),
  );

  // La BD (profiles.interface_variant) es la fuente de verdad: cuando el
  // layout del colaborador se vuelve a renderizar en el servidor (p. ej.
  // tras un router.refresh() tras guardar una preferencia nueva), este
  // efecto sincroniza el estado del provider con el valor recién resuelto
  // en vez de quedarse con el valor de montaje inicial.
  React.useEffect(() => {
    setVariantState(resolveInterfaceVariant(initialVariant));
  }, [initialVariant]);

  const value = React.useMemo<InterfaceVariantContextValue>(
    () => ({
      variant,
      config: getInterfaceVariantConfig(variant),
      setVariant: setVariantState,
    }),
    [variant],
  );

  return (
    <InterfaceVariantContext.Provider value={value}>
      {children}
    </InterfaceVariantContext.Provider>
  );
}

export function useInterfaceVariant() {
  const context = React.useContext(InterfaceVariantContext);
  if (!context) {
    throw new Error("useInterfaceVariant debe usarse dentro de InterfaceVariantProvider");
  }
  return context;
}

