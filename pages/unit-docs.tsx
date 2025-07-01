import Layout from "@/components/Layout/layout";
import UnitDoc from "@/components/support/UnitDoc/unitDoc";
import { useTranslation } from 'react-i18next';
export default function Monitor() {

  const { t, i18n } = useTranslation();

  return (
    <Layout>
      <div className="container_global" >
         <div className="container_unit_interface" >
        <UnitDoc />
        </div>
      </div>
    </Layout >
  )
}