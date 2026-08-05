"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { DishDTO, FormuleDTO } from "@/lib/menu";

// Options choisies pour une ligne (recalculées côté serveur à la commande).
export type ChosenOptions = {
  choiceIds: string[];
  priceDelta: number;
  text: string;
};

export type CartLine = {
  lineId: string; // dishId/formuleId + signature des choix
  kind: "dish" | "formule";
  dishId?: string; // ligne plat
  formuleId?: string; // ligne formule
  name: string;
  priceCents: number; // prix unitaire, options comprises
  photoUrl: string | null;
  quantity: number;
  note?: string;
  optionsText?: string;
  optionChoiceIds?: string[]; // options d'un plat
  choiceDishIds?: string[]; // formule : un plat choisi par étape
};

type State = { lines: CartLine[] };

type Action =
  | { type: "addLine"; line: CartLine }
  | { type: "setQty"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };
    case "addLine": {
      const existing = state.lines.find((l) => l.lineId === action.line.lineId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.lineId === action.line.lineId
              ? { ...l, quantity: l.quantity + action.line.quantity }
              : l
          ),
        };
      }
      return { lines: [...state.lines, action.line] };
    }
    case "setQty": {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };
      }
      return {
        lines: state.lines.map((l) =>
          l.lineId === action.lineId ? { ...l, quantity: action.quantity } : l
        ),
      };
    }
    case "remove":
      return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };
    case "clear":
      return { lines: [] };
    default:
      return state;
  }
}

type CartApi = {
  lines: CartLine[];
  count: number;
  totalCents: number;
  qtyOf: (dishId: string) => number; // total pour un plat (toutes variantes)
  add: (
    dish: DishDTO,
    quantity?: number,
    note?: string,
    options?: ChosenOptions
  ) => void;
  addFormule: (
    formule: FormuleDTO,
    choiceDishIds: string[],
    text: string,
    quantity?: number,
    note?: string
  ) => void;
  setQty: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) dispatch({ type: "hydrate", lines: JSON.parse(raw) });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.lines));
    } catch {}
  }, [state.lines, storageKey]);

  const api = useMemo<CartApi>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const totalCents = state.lines.reduce(
      (s, l) => s + l.quantity * l.priceCents,
      0
    );
    return {
      lines: state.lines,
      count,
      totalCents,
      qtyOf: (dishId) =>
        state.lines
          .filter((l) => l.dishId === dishId)
          .reduce((n, l) => n + l.quantity, 0),
      add: (dish, quantity = 1, note, options) => {
        const ids = options?.choiceIds ?? [];
        const lineId = ids.length
          ? `${dish.id}:${[...ids].sort().join(",")}`
          : dish.id;
        dispatch({
          type: "addLine",
          line: {
            lineId,
            kind: "dish",
            dishId: dish.id,
            name: dish.name,
            priceCents: dish.priceCents + (options?.priceDelta ?? 0),
            photoUrl: dish.photoUrl,
            quantity,
            note,
            optionsText: options?.text || undefined,
            optionChoiceIds: ids.length ? ids : undefined,
          },
        });
      },
      addFormule: (formule, choiceDishIds, text, quantity = 1, note) => {
        // Chaque composition distincte = une ligne distincte.
        const lineId = `f:${formule.id}:${choiceDishIds.join(",")}`;
        dispatch({
          type: "addLine",
          line: {
            lineId,
            kind: "formule",
            formuleId: formule.id,
            name: formule.name,
            priceCents: formule.priceCents,
            photoUrl: formule.photoUrl,
            quantity,
            note,
            optionsText: text || undefined,
            choiceDishIds,
          },
        });
      },
      setQty: (lineId, quantity) => dispatch({ type: "setQty", lineId, quantity }),
      remove: (lineId) => dispatch({ type: "remove", lineId }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state.lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
