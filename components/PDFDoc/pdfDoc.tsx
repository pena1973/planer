
// Обрати внимание: без 'use client'. Этот компонент рендерится на сервере.
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BillItem } from '@/types/service-types';

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
  // добавил утилиты
  mb5: { marginBottom: 5 },
  bold: { fontFamily: 'Helvetica-Bold' },
});


function money(n: number, currency: string) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n);
}

export interface PDFDocProps {
  bill: BillItem,
}

const PDFDoc = ({
  bill,
}: PDFDocProps) => {

  const total = bill.amount;
  const formatUsageDate = (dateStr: string, locale: string = 'en-CA') => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.toLocaleString(locale, { month: 'long' }); // "July" для en-US, "июль" для ru-RU
    return `${year}.${month}`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Invoice № {bill.id}, date: {bill.date}</Text>

        <View style={[styles.box, styles.row]}>
          <View>
            <Text style={{ fontFamily: 'Inter', fontWeight: 'bold', fontSize: 14, marginBottom: 15 }}>Seller</Text>
            <Text style={{ marginBottom: 5 }}>{bill.seller.title}</Text>
            <Text style={{ marginBottom: 5 }}>{bill.seller.address}</Text>
            <Text style={{ marginBottom: 5 }}>Reg N: {bill.seller.reg_n}</Text>
            <Text style={{ marginBottom: 5 }}>E-mail: {bill.seller.email}</Text>
            <Text style={{ marginBottom: 5 }}>Phone: {bill.seller.phone}</Text>
            <Text style={{ marginBottom: 5 }}>Contact person: {bill.seller.person}</Text>
          </View>

          <View>
            <Text style={{ fontFamily: 'Inter', fontWeight: 'bold', fontSize: 14, marginBottom: 15 }}>Client</Text>
            <Text style={{ marginBottom: 5 }}>{bill.client.title}</Text>
            <Text style={{ marginBottom: 5 }}>{bill.client.address}</Text>
            <Text style={{ marginBottom: 5 }}>Reg N: {bill.client.reg_n}</Text>
            <Text style={{ marginBottom: 5 }}>E-mail: {bill.client.email}</Text>
            <Text style={{ marginBottom: 5 }}>Phone: {bill.client.phone}</Text>
            <Text style={{ marginBottom: 5 }}>Contact person: {bill.client.person}</Text>
          </View>
        </View>

        <View style={[styles.box]}>         
          <Text>Due date: {bill.dueDate}</Text>
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Title</Text>
            <Text style={styles.thQty}>Days</Text>
            <Text style={styles.thPrice}>Discaunt</Text>
            <Text style={styles.thSum}>Amount</Text>
          </View>

          {bill.rows.map((row) => (
            <View key={row.id} style={styles.tr} wrap={false}>
              <Text style={styles.tdTitle}>Team: {row.billableTeamNumber}, for usage in {formatUsageDate(row.dateFrom)}</Text>
              <Text style={styles.tdQty}>{row.activeDays}</Text>
              <Text style={styles.tdPrice}>{row.discount} %</Text>
              <Text style={styles.tdSum}>{money(row.amount, 'EUR')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>SubTotal: </Text>
            <Text>{money(total, 'EUR')}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Vat(23%): </Text>
            <Text>{money(total, 'EUR')}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Total: </Text>
            <Text>{money(total, 'EUR')}</Text>
          </View>
        </View>

        {bill.coment && (
          <View style={styles.notes}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 'bold' }}>Comment</Text>
            <Text>{bill.coment}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
export default PDFDoc;