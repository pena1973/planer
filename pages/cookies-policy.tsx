import Layout from "@/components/Layout/layout";
import { CookiePolicyBlock } from '@/components/CookiePolicyBlock/сookiePolicyBlock'
import { useTranslation } from 'react-i18next';
export default function Index() {
  const { t, i18n } = useTranslation();
  return (
    <Layout>
      <pre />
      <div className="container_cookie">
        <CookiePolicyBlock />
      </div>

    </Layout>
  )
}