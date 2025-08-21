// Обрати внимание: без 'use client'. Этот компонент рендерится на сервере.
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type InvoiceItem = {
  id: string;
  title: string;
  qty: number;
  price: number; // цена за единицу
};

export type Party = { name: string; address: string; vat?: string };

export type Invoice = {
  id: string;
  issueDate: string; // ISO
  dueDate?: string;  // ISO
  seller: Party;
  buyer: Party;
  items: InvoiceItem[];
  currency: string;  // 'EUR' | ...
  notes?: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Inter' },
  h1: { fontSize: 16, marginBottom: 8, fontFamily: 'Inter', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: { marginBottom: 12 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 4, marginTop: 8 },
  th: { flexBasis: '50%', fontFamily: 'Inter', fontWeight: 'bold' },
  thQty: { width: 50, textAlign: 'right', fontFamily: 'Inter', fontWeight: 'bold' },
  thPrice: { width: 70, textAlign: 'right', fontFamily: 'Inter', fontWeight: 'bold' },
  thSum: { width: 80, textAlign: 'right', fontFamily: 'Inter', fontWeight: 'bold' },
  tr: { flexDirection: 'row', paddingTop: 4 },
  tdTitle: { flexBasis: '50%' },
  tdQty: { width: 50, textAlign: 'right' },
  tdPrice: { width: 70, textAlign: 'right' },
  tdSum: { width: 80, textAlign: 'right' },
  totals: { marginTop: 12, marginLeft: 'auto', width: 200 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  notes: { marginTop: 16 },
});

function money(n: number, currency: string) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(n);
}

export default function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const subtotal = invoice.items.reduce((s, it) => s + it.qty * it.price, 0);
  const total = subtotal; // добавь НДС/скидки при необходимости

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Счёт № {invoice.id}</Text>

        <View style={[styles.box, styles.row]}>
          <View>
            <Text style={{ fontFamily: 'Inter', fontWeight: 'bold' }}>Поставщик</Text>
            <Text>{invoice.seller.name}</Text>
            <Text>{invoice.seller.address}</Text>
            {invoice.seller.vat && <Text>VAT: {invoice.seller.vat}</Text>}
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter', fontWeight: 'bold' }}>Получатель</Text>
            <Text>{invoice.buyer.name}</Text>
            <Text>{invoice.buyer.address}</Text>
            {invoice.buyer.vat && <Text>VAT: {invoice.buyer.vat}</Text>}
          </View>
        </View>

        <View style={[styles.box, styles.row]}>
          <Text>Дата выставления: {new Date(invoice.issueDate).toLocaleDateString('ru-RU')}</Text>
          {invoice.dueDate && <Text>Оплатить до: {new Date(invoice.dueDate).toLocaleDateString('ru-RU')}</Text>}
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Позиция</Text>
            <Text style={styles.thQty}>Кол-во</Text>
            <Text style={styles.thPrice}>Цена</Text>
            <Text style={styles.thSum}>Сумма</Text>
          </View>

          {invoice.items.map((it) => (
            <View key={it.id} style={styles.tr} wrap={false}>
              <Text style={styles.tdTitle}>{it.title}</Text>
              <Text style={styles.tdQty}>{it.qty}</Text>
              <Text style={styles.tdPrice}>{money(it.price, invoice.currency)}</Text>
              <Text style={styles.tdSum}>{money(it.qty * it.price, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Итого:</Text>
            <Text>{money(total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 'bold' }}>Примечания</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
