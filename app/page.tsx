import { supabase } from "@/lib/supabase";
import CouponManager from "@/components/CouponManager";

export const revalidate = 3600;

export default async function HomePage() {
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*');

  if (error) {
    console.error("Error fetching coupons:", error);
    return <div>資料載入錯誤，請稍後再試。</div>;
  }

  return (
    <main className="container">
      <CouponManager initialData={coupons || []} />
    </main>
  );
}