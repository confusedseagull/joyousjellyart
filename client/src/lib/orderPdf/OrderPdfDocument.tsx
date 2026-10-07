import { Document, Page, View, Text, Image, Svg, Path, StyleSheet, Font } from "@react-pdf/renderer";
import instrumentSansRegular from "@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff?url";
import instrumentSansSemiBold from "@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff?url";
import { needsFallbackFont, rasterizeText } from "./images";
import { BUSINESS, type PdfContact, type PdfField, type PdfItem, type PdfOrderModel } from "./orderPdfData";

Font.register({
  family: "Instrument Sans",
  fonts: [
    { src: instrumentSansRegular, fontWeight: 400 },
    { src: instrumentSansSemiBold, fontWeight: 600 },
  ],
});
// Never hyphenate — a split word in an address or name reads as a typo.
Font.registerHyphenationCallback((word) => [word]);

export interface PdfAssets {
  logo: string;
  watermark: string;
  /** Pre-cropped circle photo for each item, same order as model.items. */
  itemImages: (string | undefined)[];
  /** Pre-cropped thumbnails for each item's reference images. */
  referenceImages: string[][];
}

type PdfStyle = Record<string, any>;

const GREY = "#6e7176";
const BLACK = "#000000";

const s = StyleSheet.create({
  page: {
    fontFamily: "Instrument Sans",
    fontSize: 10,
    color: BLACK,
    paddingTop: 20,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16 },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, paddingBottom: 16 },
  divider: { height: 0.5, backgroundColor: "#d4d5d7", marginHorizontal: 9 },
  itemBlock: { paddingVertical: 12, paddingHorizontal: 2 },
  itemRow: { flexDirection: "row", gap: 25 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 2 },
  deliveryRow: { flexDirection: "row", gap: 16, paddingTop: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 595,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerText: { fontSize: 8, color: GREY },
});

// Text that falls back to a rasterised image when it contains glyphs the
// bundled font lacks (Chinese, emoji, ...), so nothing prints as blank boxes.
function PText({
  children,
  size = 10,
  weight = 400,
  color = BLACK,
  width,
  style,
}: {
  children: string;
  size?: number;
  weight?: 400 | 600;
  color?: string;
  width: number;
  style?: PdfStyle;
}) {
  if (needsFallbackFont(children)) {
    const raster = rasterizeText(children, { fontSize: size, weight, color, maxWidth: width });
    return <Image src={raster.src} style={{ width: raster.width, height: raster.height, ...style }} />;
  }
  return <Text style={{ fontSize: size, fontWeight: weight, color, width, ...style }}>{children}</Text>;
}

function Field({ field, width }: { field: PdfField; width: number }) {
  return (
    <View style={{ width, gap: 4 }}>
      <PText size={10} color={GREY} width={width}>
        {field.label}
      </PText>
      <PText size={12} weight={600} width={width}>
        {field.value}
      </PText>
    </View>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: "#d9d9d9", alignItems: "center", justifyContent: "center" }}>
      {checked && (
        <Svg width={16} height={16} viewBox="0 0 16 16">
          <Path d="M3.5 8.5 L6.8 11.8 L12.5 4.8" stroke="#1c1e22" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}

function CheckOption({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Checkbox checked={checked} />
      <Text style={{ fontSize: 12, fontWeight: 600 }}>{label}</Text>
    </View>
  );
}

function ContactBlock({ contact, width, lineSize }: { contact: PdfContact; width: number; lineSize: number }) {
  const lines = [...contact.lines, contact.phone, contact.email].filter(Boolean);
  return (
    <View style={{ width, gap: 4 }}>
      <PText size={12} weight={600} width={width}>
        {contact.name}
      </PText>
      <View style={{ gap: 2 }}>
        {lines.map((line, i) => (
          <PText key={i} size={lineSize} width={width}>
            {line}
          </PText>
        ))}
      </View>
    </View>
  );
}

function ItemBlock({
  item,
  index,
  count,
  imageSrc,
  referenceImages,
}: {
  item: PdfItem;
  index: number;
  count: number;
  imageSrc?: string;
  referenceImages: string[];
}) {
  return (
    <View style={s.itemBlock} wrap={false}>
      <View style={s.itemRow}>
        <View style={{ width: 100, gap: 13 }}>
          <View style={{ gap: 3 }}>
            <Text style={{ fontSize: 12, fontWeight: 600 }}>Order Details</Text>
            {count > 1 && <Text style={{ fontSize: 8, color: GREY }}>{`Item ${index + 1} of ${count}`}</Text>}
          </View>
          {imageSrc && <Image src={imageSrc} style={{ width: 100, height: 100 }} />}
        </View>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
          <View style={{ width: 134, gap: 8 }}>
            {item.columnA.map((field) => (
              <Field key={field.label} field={field} width={134} />
            ))}
          </View>
          <View style={{ width: 198, gap: 8 }}>
            {item.columnB.map((field) => (
              <Field key={field.label} field={field} width={198} />
            ))}
          </View>
        </View>
      </View>

      {item.detailRows.length > 0 && (
        <View style={{ marginTop: 20, gap: 8, width: 501 }}>
          {item.detailRows.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 33, alignItems: "flex-start" }}>
              <View style={{ width: 120 }}>{row.left && <Field field={row.left} width={120} />}</View>
              <View style={{ width: 348 }}>{row.right && <Field field={row.right} width={348} />}</View>
            </View>
          ))}
        </View>
      )}

      {referenceImages.length > 0 && (
        <View style={{ marginTop: 12, gap: 6 }}>
          <Text style={{ fontSize: 10, color: GREY }}>Reference Images</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {referenceImages.map((src, i) => (
              <Image key={i} src={src} style={{ width: 56, height: 56 }} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export function OrderPdfDocument({ model, assets }: { model: PdfOrderModel; assets: PdfAssets }) {
  const { billTo, deliveryContact } = model;
  return (
    <Document title={`Order ${model.orderNumber}`} author="Joyous JellyArt" creator="Joyous JellyArt">
      <Page size="A4" style={s.page}>
        {/* Faint brand mark behind the content, repeated on every page. */}
        <Image src={assets.watermark} fixed style={{ position: "absolute", left: 66, top: 178, width: 453, height: 438, opacity: 0.03 }} />

        <View style={s.headerRow}>
          <Image src={assets.logo} style={{ width: 96, height: 30 }} />
          <View style={{ gap: 4, width: 90 }}>
            <Text style={{ color: GREY }}>TAX ID/UEN</Text>
            <Text style={{ fontWeight: 600 }}>{BUSINESS.taxId}</Text>
          </View>
        </View>

        <View style={s.partiesRow}>
          <View style={{ gap: 12, width: 200 }}>
            <View style={{ flexDirection: "row", gap: 24 }}>
              <View style={{ gap: 4, width: 70 }}>
                <Text style={{ color: GREY }}>Invoice No.</Text>
                <Text style={{ fontWeight: 600 }}>{model.orderNumber}</Text>
              </View>
              <View style={{ gap: 4, width: 70 }}>
                <Text style={{ color: GREY }}>Order No.</Text>
                <Text style={{ fontWeight: 600 }}>{model.orderNumber}</Text>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: GREY }}>Bill from</Text>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>{BUSINESS.legalName}</Text>
              <View style={{ gap: 2 }}>
                {[...BUSINESS.addressLines, BUSINESS.phone, BUSINESS.email].map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
              </View>
            </View>
          </View>

          <View style={{ gap: 12, width: 170 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: GREY }}>Invoice/Order Date</Text>
              <Text style={{ fontWeight: 600 }}>{model.orderDate}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: GREY }}>Bill to</Text>
              <ContactBlock contact={billTo} width={170} lineSize={10} />
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {model.items.map((item, i) => (
          <ItemBlock
            key={i}
            item={item}
            index={i}
            count={model.items.length}
            imageSrc={assets.itemImages[i]}
            referenceImages={assets.referenceImages[i] ?? []}
          />
        ))}

        <View style={s.summaryRow} wrap={false}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12 }}>Paid:</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CheckOption label="Yes" checked={model.paid} />
              <CheckOption label="No" checked={!model.paid} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            {[
              ["Subtotal:", model.subtotal],
              ["Delivery Fee:", model.deliveryFee],
              ["Total:", model.total],
            ].map(([label, value]) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: GREY }}>{label}</Text>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.deliveryRow} wrap={false}>
          <View style={{ width: 119, gap: 16 }}>
            <CheckOption label="Delivery" checked={model.isDelivery} />
            <CheckOption label="Store Pick Up" checked={!model.isDelivery} />
          </View>

          <View style={{ width: 170, gap: 24 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: GREY }}>Delivery Address</Text>
              <ContactBlock contact={deliveryContact} width={170} lineSize={12} />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: GREY }}>Fulfilment Date and Time</Text>
              <Text style={{ fontSize: 12 }}>
                Date : <Text style={{ fontWeight: 600 }}>{model.fulfilmentDate}</Text>
              </Text>
              {model.fulfilmentTime ? (
                <Text style={{ fontSize: 12 }}>
                  Time : <Text style={{ fontWeight: 600 }}>{model.fulfilmentTime}</Text>
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ fontWeight: 600, color: "#1c1e22" }}>Additional Instructions/Notes</Text>
            <View style={{ minHeight: 152, borderWidth: 0.5, borderColor: GREY, borderRadius: 12, padding: 10 }}>
              {model.notes ? (
                <PText size={10} width={180}>
                  {model.notes}
                </PText>
              ) : null}
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Joyous JellyArt</Text>
          <View style={s.footerItem}>
            <Svg width={13} height={10} viewBox="0 0 13 10">
              <Path
                d="M12.5 0H0.5C0.367392 0 0.240215 0.0526785 0.146447 0.146447C0.0526784 0.240215 0 0.367392 0 0.5V9C0 9.26522 0.105357 9.51957 0.292893 9.70711C0.48043 9.89464 0.734784 10 1 10H12C12.2652 10 12.5196 9.89464 12.7071 9.70711C12.8946 9.51957 13 9.26522 13 9V0.5C13 0.367392 12.9473 0.240215 12.8536 0.146447C12.7598 0.0526785 12.6326 0 12.5 0ZM11.2144 1L6.5 5.32187L1.78563 1H11.2144ZM12 9H1V1.63688L6.16187 6.36875C6.25412 6.45343 6.37478 6.50041 6.5 6.50041C6.62522 6.50041 6.74588 6.45343 6.83813 6.36875L12 1.63688V9Z"
                fill={GREY}
              />
            </Svg>
            <Text style={s.footerText}>{BUSINESS.email}</Text>
          </View>
          <View style={s.footerItem}>
            <Svg width={10} height={10} viewBox="0 0 10 10">
              <Path
                d="M5 0C4.01109 0 3.0444 0.293245 2.22215 0.842652C1.3999 1.39206 0.759043 2.17295 0.380605 3.08658C0.00216642 4.00021 -0.0968502 5.00555 0.0960758 5.97545C0.289002 6.94536 0.765206 7.83627 1.46447 8.53553C2.16373 9.23479 3.05465 9.711 4.02455 9.90392C4.99445 10.0969 5.99979 9.99783 6.91342 9.6194C7.82705 9.24096 8.60794 8.60009 9.15735 7.77785C9.70676 6.9556 10 5.98891 10 5C9.99847 3.67439 9.4712 2.4035 8.53385 1.46615C7.5965 0.528801 6.32561 0.00152691 5 0ZM9.23077 5C9.2311 5.39017 9.17722 5.7785 9.07067 6.15384H7.21923C7.33718 5.38914 7.33718 4.61086 7.21923 3.84615H9.07067C9.17722 4.2215 9.2311 4.60982 9.23077 5ZM3.75 6.92308H6.25C6.00371 7.73009 5.57615 8.4701 5 9.08654C4.42408 8.46994 3.99654 7.72998 3.75 6.92308ZM3.5625 6.15384C3.43045 5.39028 3.43045 4.60972 3.5625 3.84615H6.44135C6.57339 4.60972 6.57339 5.39028 6.44135 6.15384H3.5625ZM0.769233 5C0.768898 4.60982 0.822779 4.2215 0.929329 3.84615H2.78077C2.66282 4.61086 2.66282 5.38914 2.78077 6.15384H0.929329C0.822779 5.7785 0.768898 5.39017 0.769233 5ZM6.25 3.07692H3.75C3.99629 2.26991 4.42386 1.52989 5 0.913461C5.57593 1.53006 6.00346 2.27002 6.25 3.07692ZM8.76587 3.07692H7.05337C6.83753 2.28505 6.47375 1.54119 5.98125 0.884615C6.5763 1.02756 7.13341 1.29749 7.61438 1.67589C8.09535 2.0543 8.48881 2.53223 8.76779 3.07692H8.76587ZM4.01875 0.884615C3.52625 1.54119 3.16248 2.28505 2.94664 3.07692H1.23221C1.51119 2.53223 1.90465 2.0543 2.38562 1.67589C2.86659 1.29749 3.4237 1.02756 4.01875 0.884615ZM1.23221 6.92308H2.94664C3.16248 7.71495 3.52625 8.45881 4.01875 9.11538C3.4237 8.97244 2.86659 8.70251 2.38562 8.32411C1.90465 7.9457 1.51119 7.46777 1.23221 6.92308ZM5.98125 9.11538C6.47375 8.45881 6.83753 7.71495 7.05337 6.92308H8.76779C8.48881 7.46777 8.09535 7.9457 7.61438 8.32411C7.13341 8.70251 6.5763 8.97244 5.98125 9.11538Z"
                fill={GREY}
              />
            </Svg>
            <Text style={s.footerText}>{BUSINESS.website}</Text>
          </View>
          <View style={s.footerItem}>
            <Svg width={12} height={10} viewBox="0 0 12 10">
              <Path
                d="M8.5 2.50019C8.50005 2.02099 8.36236 1.55187 8.10335 1.1487C7.84433 0.745529 7.47489 0.425296 7.03902 0.226136C6.60316 0.0269764 6.11923 -0.0427183 5.64488 0.0253519C5.17052 0.0934221 4.72573 0.296389 4.36346 0.610082C4.00119 0.923774 3.73672 1.33497 3.60154 1.79471C3.46635 2.25445 3.46615 2.74336 3.60096 3.20321C3.73577 3.66305 3.99991 4.07447 4.36192 4.38846C4.72393 4.70245 5.16856 4.90578 5.64286 4.97423V9.64287C5.64286 9.73758 5.68048 9.82842 5.74746 9.8954C5.81444 9.96237 5.90528 10 6 10C6.09472 10 6.18556 9.96237 6.25254 9.8954C6.31952 9.82842 6.35714 9.73758 6.35714 9.64287V4.97423C6.95175 4.88757 7.49536 4.58998 7.88876 4.13578C8.28216 3.68158 8.49911 3.10106 8.5 2.50019ZM6 4.28586C5.64682 4.28586 5.30157 4.18113 5.00791 3.98492C4.71425 3.78871 4.48537 3.50982 4.35021 3.18354C4.21506 2.85725 4.1797 2.49821 4.2486 2.15182C4.3175 1.80544 4.48757 1.48726 4.73731 1.23753C4.98705 0.9878 5.30523 0.817732 5.65162 0.748831C5.99802 0.679931 6.35707 0.715293 6.68336 0.850446C7.00966 0.985599 7.28855 1.21447 7.48477 1.50812C7.68098 1.80178 7.78571 2.14702 7.78571 2.50019C7.78571 2.73469 7.73953 2.96689 7.64979 3.18354C7.56004 3.40018 7.42851 3.59703 7.26269 3.76285C7.09687 3.92866 6.90002 4.06019 6.68336 4.14993C6.46671 4.23967 6.2345 4.28586 6 4.28586Z"
                fill={GREY}
              />
            </Svg>
            <Text style={s.footerText}>{BUSINESS.storeAddress}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
