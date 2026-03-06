import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

type NumericKeypadProps = {
  title: string;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
};

export default function NumericKeypad({ title, onConfirm, onCancel }: NumericKeypadProps) {
  const [value, setValue] = useState("0");

  const handleKey = (key: string) => {
    if (key === "." && value.includes(".")) return;
    if (key === "." && value === "0") {
      setValue("0.");
      return;
    }
    // Max 2 decimal places
    if (value.includes(".")) {
      const decimals = value.split(".")[1] || "";
      if (decimals.length >= 2) return;
    }
    if (value === "0" && key !== ".") {
      setValue(key);
    } else {
      setValue(value + key);
    }
  };

  const handleDelete = () => {
    if (value.length <= 1) {
      setValue("0");
    } else {
      setValue(value.slice(0, -1));
    }
  };

  const handleConfirm = () => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) return;
    onConfirm(amount);
  };

  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "⌫"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <div className="bg-secondary rounded-xl px-6 py-4 text-center">
          <span className="text-4xl font-bold text-foreground tracking-tight">
            {parseFloat(value).toLocaleString("es-ES", {
              minimumFractionDigits: value.includes(".") ? (value.split(".")[1]?.length || 0) : 0,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-2xl font-bold text-primary ml-1">€</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key) => (
          <button
            key={key}
            onClick={() => key === "⌫" ? handleDelete() : handleKey(key)}
            className={`
              h-16 rounded-xl text-xl font-bold transition-all active:scale-95
              ${key === "⌫"
                ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                : "bg-secondary text-foreground hover:bg-accent"
              }
            `}
          >
            {key === "⌫" ? <Delete className="w-5 h-5 mx-auto" /> : key}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="h-12 text-base"
        >
          Cancelar
        </Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={parseFloat(value) <= 0}
          className="h-12 text-base font-semibold"
        >
          Añadir {parseFloat(value) > 0 ? `${parseFloat(value).toFixed(2)}€` : ""}
        </Button>
      </div>
    </div>
  );
}
