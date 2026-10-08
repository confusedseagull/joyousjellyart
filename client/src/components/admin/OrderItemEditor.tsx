import type { ReactNode } from "react";
import { CARTOON_CHARACTERS, DIETARY_OPTIONS, FLOWERS, FORMATS, PLATTER_INDIVIDUAL_SHAPES, SHAPE_SIZES } from "@/lib/customizeOptions";
import {
  COLOR_SLOTS,
  MAX_FLOWERS,
  applyItemChange,
  buildNumbers,
  flavourChoices,
  maxPlatterShapes,
  numberCountOf,
  numberDigits,
  requiredFlavourCount,
  shapesForFormat,
  themesForFormat,
  unitPrice,
} from "../../../../shared/orderItemRules";
import { sizeLabel } from "../../../../shared/orderLabels";
import { formatPrice } from "@/lib/utils";
import { adminInput } from "./AdminUI";

type Item = Record<string, any>;

function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-neutral-500 mb-1">
        {label}
        {hint && <span className="font-normal text-neutral-400"> · {hint}</span>}
      </p>
      {children}
    </div>
  );
}

// A toggle for picking several options at once (flowers, dietary needs, platter pieces).
function Chip({ label, selected, disabled, onClick }: { label: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`h-8 rounded-full border px-3 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        selected ? "border-primary bg-primary/10 text-neutral-900 font-medium" : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Same rule as the builder: "None" excludes every other choice.
function toggleDietary(current: string[], value: string): string[] {
  if (value === "none") return current.includes("none") ? [] : ["none"];
  const withoutNone = current.filter((v) => v !== "none");
  return toggle(withoutNone, value);
}

function dietaryList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return typeof value === "string" ? value.split(/,\s*/).filter(Boolean) : [];
}

function PriceFields({ item, onChange, note }: { item: Item; onChange: (next: Item) => void; note?: ReactNode }) {
  const isCny = item.collection === "cny";
  return (
    <div className="grid grid-cols-2 gap-4 pt-4 mt-1 border-t border-neutral-200">
      <Field label={isCny ? "Price each ($)" : item.format === "miniGiftBox" && item.boxes > 1 ? "Price for all boxes ($)" : "Price ($)"}>
        <input
          type="number"
          min={0}
          step="0.01"
          value={Number.isFinite(item.price) ? item.price : ""}
          onChange={(e) => onChange({ ...item, price: e.target.value === "" ? NaN : Number(e.target.value) })}
          className={adminInput}
        />
      </Field>
      {isCny && (
        <Field label="Quantity">
          <input
            type="number"
            min={1}
            step={1}
            value={item.quantity ?? 1}
            onChange={(e) => onChange({ ...item, quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
            className={adminInput}
          />
        </Field>
      )}
      {note && <div className="col-span-2 text-xs text-neutral-500">{note}</div>}
    </div>
  );
}

function CnyItemEditor({ item, onChange }: { item: Item; onChange: (next: Item) => void }) {
  const dietary = dietaryList(item.dietaryRequirements);
  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-lg">
        {item.name} <span className="text-sm text-muted-foreground">{item.edition}</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Size">
          <input value={item.size ?? ""} onChange={(e) => onChange({ ...item, size: e.target.value })} className={adminInput} />
        </Field>
        <Field label="Flavour">
          <input value={item.flavor ?? ""} onChange={(e) => onChange({ ...item, flavor: e.target.value })} className={adminInput} />
        </Field>
      </div>
      <Field label="Dietary requirements">
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((d) => (
            <Chip
              key={d.value}
              label={d.label}
              selected={dietary.includes(d.value)}
              onClick={() => {
                const next = toggleDietary(dietary, d.value);
                onChange({ ...item, dietaryRequirements: next.length ? next : undefined });
              }}
            />
          ))}
        </div>
      </Field>
      <PriceFields item={item} onChange={onChange} />
    </div>
  );
}

export function OrderItemEditor({ item, onChange }: { item: Item; onChange: (next: Item) => void }) {
  if (item.collection === "cny") return <CnyItemEditor item={item} onChange={onChange} />;

  const update = (changes: Item) => onChange(applyItemChange(item, changes));

  const sizes = SHAPE_SIZES[item.shape] ?? [];
  const flavourCount = requiredFlavourCount(item.shape);
  const flavourOptions = flavourChoices(item);
  const platterMax = maxPlatterShapes(item.shape, item.size);
  const platterPieces: string[] = item.platterShapes ?? [];
  const flowers: string[] = item.selectedFlowers ?? [];
  const dietary = dietaryList(item.dietaryRequirements);
  const colors: string[] = item.selectedColors ?? [];
  const listPrice = unitPrice(item);

  // Flowers already on the order but not in the builder's list stay selectable so nothing is lost.
  const flowerOptions = [...FLOWERS.map((f) => f.value), ...flowers.filter((f) => !FLOWERS.some((o) => o.value === f))];

  const setColor = (index: number, value: string) => {
    const next = Array.from({ length: COLOR_SLOTS }, (_, i) => (i === index ? value : colors[i] ?? ""));
    update({ selectedColors: next.some(Boolean) ? next.filter(Boolean) : undefined });
  };

  const numberCount = numberCountOf(item);
  const [firstNumber, secondNumber] = numberDigits(item);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Format">
          <select value={item.format} onChange={(e) => update({ format: e.target.value })} className={adminInput}>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Theme">
          <select value={item.theme} onChange={(e) => update({ theme: e.target.value })} className={adminInput}>
            {themesForFormat(item.format).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {item.theme === "floralBouquet" && (
        <Field label="Flowers" hint={`up to ${MAX_FLOWERS}`}>
          <div className="flex flex-wrap gap-2">
            {flowerOptions.map((flower) => (
              <Chip
                key={flower}
                label={flower}
                selected={flowers.includes(flower)}
                disabled={!flowers.includes(flower) && flowers.length >= MAX_FLOWERS}
                onClick={() => {
                  const next = toggle(flowers, flower);
                  update({ selectedFlowers: next.length ? next : undefined });
                }}
              />
            ))}
          </div>
        </Field>
      )}
      {item.theme === "cartoonCharacters" && (
        <Field label="Character">
          <select
            value={item.cartoonCharacter ?? ""}
            onChange={(e) => update({ cartoonCharacter: e.target.value || undefined })}
            className={adminInput}
          >
            <option value="">None</option>
            {[...CARTOON_CHARACTERS, ...(item.cartoonCharacter && !CARTOON_CHARACTERS.includes(item.cartoonCharacter) ? [item.cartoonCharacter] : [])].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
        </Field>
      )}
      {item.theme === "coutureFashion" && (
        <Field label="Brand">
          <input value={item.fashionBrand ?? ""} onChange={(e) => update({ fashionBrand: e.target.value || undefined })} className={adminInput} />
        </Field>
      )}
      {(item.theme === "handDrawn" || item.theme === "nameAndInitial") && (
        <Field label={item.theme === "nameAndInitial" ? "Name" : "Design description"}>
          <input value={item.themeCustomText ?? ""} onChange={(e) => update({ themeCustomText: e.target.value || undefined })} className={adminInput} />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Shape">
          <select value={item.shape} onChange={(e) => update({ shape: e.target.value })} className={adminInput}>
            {shapesForFormat(item.format).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Size">
          <select value={item.size} onChange={(e) => update({ size: e.target.value })} className={adminInput}>
            {sizes.map((s) => (
              <option key={s.value} value={s.value}>
                {sizeLabel(item.shape, s.value)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {item.format === "miniGiftBox" && (
        <Field label="Number of boxes" hint="one item, priced for all the boxes">
          <input
            type="number"
            min={1}
            step={1}
            value={item.boxes ?? 1}
            onChange={(e) => update({ boxes: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
            className={adminInput}
          />
        </Field>
      )}

      {item.shape === "numbers" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="How many numbers">
            <select
              value={numberCount}
              onChange={(e) => update({ numbers: buildNumbers(Number(e.target.value) === 1 ? 1 : 2, firstNumber, secondNumber) })}
              className={adminInput}
            >
              <option value={1}>1 Number</option>
              <option value={2}>2 Numbers</option>
            </select>
          </Field>
          <Field label="First number">
            <input
              type="number"
              min={0}
              max={9}
              value={firstNumber}
              onChange={(e) => update({ numbers: buildNumbers(numberCount, e.target.value, secondNumber) })}
              className={adminInput}
            />
          </Field>
          {numberCount === 2 && (
            <Field label="Second number">
              <input
                type="number"
                min={0}
                max={9}
                value={secondNumber}
                onChange={(e) => update({ numbers: buildNumbers(2, firstNumber, e.target.value) })}
                className={adminInput}
              />
            </Field>
          )}
        </div>
      )}

      {platterMax > 0 && (
        <Field label="Platter shapes" hint={`up to ${platterMax}`}>
          <div className="flex flex-wrap gap-2">
            {PLATTER_INDIVIDUAL_SHAPES.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={platterPieces.includes(s.value)}
                disabled={!platterPieces.includes(s.value) && platterPieces.length >= platterMax}
                onClick={() => update({ platterShapes: toggle(platterPieces, s.value) })}
              />
            ))}
          </div>
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: flavourCount }, (_, i) => (
          <Field key={i} label={flavourCount > 1 ? `Flavour ${i + 1}` : "Base flavour"}>
            <select
              value={(item.flavours ?? [])[i] ?? ""}
              onChange={(e) => {
                const next = Array.from({ length: flavourCount }, (_, j) => (j === i ? e.target.value : (item.flavours ?? [])[j] ?? ""));
                update({ flavours: next });
              }}
              className={adminInput}
            >
              <option value="">Choose a flavour</option>
              {flavourOptions.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>

      <Field label="Colours" hint="the customer typed these in, so they're free text">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={item.backgroundColor ?? ""}
            onChange={(e) => update({ backgroundColor: e.target.value || undefined })}
            placeholder="Background colour"
            className={adminInput}
          />
          {Array.from({ length: COLOR_SLOTS }, (_, i) => (
            <input key={i} value={colors[i] ?? ""} onChange={(e) => setColor(i, e.target.value)} placeholder={`Colour ${i + 1}`} className={adminInput} />
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Cake message" className="sm:col-span-2">
          <input value={item.cakeText ?? ""} onChange={(e) => update({ cakeText: e.target.value || undefined })} className={adminInput} />
        </Field>
        <Field label="Message language">
          <select
            value={item.cakeTextLanguage ?? ""}
            onChange={(e) => update({ cakeTextLanguage: e.target.value || undefined })}
            className={adminInput}
          >
            <option value="">Not set</option>
            <option value="english">English</option>
            <option value="chinese">Chinese</option>
          </select>
        </Field>
      </div>

      <Field label="Design details">
        <textarea
          rows={3}
          value={item.designDetails ?? ""}
          onChange={(e) => update({ designDetails: e.target.value || undefined })}
          className={`${adminInput} h-auto py-2`}
        />
      </Field>

      <Field label="Dietary requirements">
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((d) => (
            <Chip
              key={d.value}
              label={d.label}
              selected={dietary.includes(d.value)}
              onClick={() => {
                const next = toggleDietary(dietary, d.value);
                update({ dietaryRequirements: next.length ? next.join(", ") : undefined });
              }}
            />
          ))}
        </div>
      </Field>

      <Field label="Additional notes">
        <textarea
          rows={2}
          value={item.specialInstructions ?? ""}
          onChange={(e) => update({ specialInstructions: e.target.value || undefined })}
          className={`${adminInput} h-auto py-2`}
        />
      </Field>

      <PriceFields
        item={item}
        onChange={onChange}
        note={
          listPrice !== null ? (
            <>
              Price list for this choice: {formatPrice(listPrice)}. Changing the theme, shape, size or numbers resets the price to the price
              list; edit it here to give a different price.
            </>
          ) : (
            "This combination isn't on the price list, so set the price yourself."
          )
        }
      />
    </div>
  );
}
