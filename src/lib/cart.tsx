import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Channel = "retail" | "wholesale";

export type CartLine = {
  key: string;
  productId: string;
  name: { ar: string; fr?: string | null; en?: string | null };
  image?: string | undefined;
  price: number;
  quantity: number;
  minQuantity: number;
  color?: string | undefined;
  size?: string | undefined;
  inBundle?: boolean | undefined;
};

type CartState = Record<Channel, CartLine[]>;

type CartValue = {
  lines: (c: Channel) => CartLine[];
  count: (c: Channel) => number;
  add: (c: Channel, line: Omit<CartLine, "key">) => void;
  setQty: (c: Channel, key: string, qty: number) => void;
  remove: (c: Channel, key: string) => void;
  clear: (c: Channel) => void;
};

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = "plaster-cart-v1";

const lineKey = (l: Omit<CartLine, "key">) =>
  [l.productId, l.color ?? "", l.size ?? "", l.inBundle ? "b" : ""].join("|");

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ retail: [], wholesale: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ retail: [], wholesale: [], ...JSON.parse(raw) });
    } catch {
      /* ignore broken storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const add = useCallback((c: Channel, line: Omit<CartLine, "key">) => {
    setState((s) => {
      const key = lineKey(line);
      const existing = s[c].find((l) => l.key === key);
      const next = existing
        ? s[c].map((l) => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l))
        : [...s[c], { ...line, key }];
      return { ...s, [c]: next };
    });
  }, []);

  const value = useMemo<CartValue>(
    () => ({
      lines: (c) => state[c],
      count: (c) => state[c].reduce((n, l) => n + l.quantity, 0),
      add,
      setQty: (c, key, qty) =>
        setState((s) => ({ ...s, [c]: s[c].map((l) => (l.key === key ? { ...l, quantity: Math.max(1, qty) } : l)) })),
      remove: (c, key) => setState((s) => ({ ...s, [c]: s[c].filter((l) => l.key !== key) })),
      clear: (c) => setState((s) => ({ ...s, [c]: [] })),
    }),
    [state, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
